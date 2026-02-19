<?php

declare(strict_types=1);

require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/security.php';

apply_cors();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    ok(['preflight' => true]);
}

$pdo = db();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$segments = route_segments();

if (empty($segments)) {
    ok([
        'service' => 'Meme Generator API',
        'version' => '1.2.0',
        'routes' => [
            'POST /api/auth/register',
            'POST /api/auth/login',
            'POST /api/auth/logout',
            'GET  /api/me',
            'GET  /api/me/favorites',
            'GET  /api/memes/public',
            'GET  /api/memes',
            'POST /api/memes',
            'POST /api/memes/autosave',
            'GET  /api/memes/{id}',
            'PUT  /api/memes/{id}',
            'DELETE /api/memes/{id}',
            'POST /api/memes/{id}/favorite',
            'DELETE /api/memes/{id}/favorite',
            'POST /api/memes/{id}/report',
            'GET  /api/memes/{id}/versions',
            'POST /api/memes/{id}/versions',
            'POST /api/memes/{id}/restore/{version_id}',
            'GET  /api/moderation/memes',
            'GET  /api/moderation/reports',
            'GET  /api/moderation/blacklist',
            'POST /api/moderation/blacklist',
            'DELETE /api/moderation/blacklist/{id}',
            'PATCH /api/moderation/memes/{id}',
            'PATCH /api/moderation/reports/{id}',
            'POST /api/ai/meme-suggestions',
            'POST /api/telemetry/visit',
        ],
    ]);
}

function body_bool(array $body, string $key, bool $default = false): bool
{
    if (!array_key_exists($key, $body)) {
        return $default;
    }
    return filter_var($body[$key], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
}

function body_string(array $body, string $key, int $maxLength, string $default = ''): string
{
    if (!array_key_exists($key, $body)) {
        return $default;
    }
    $value = limit_string((string) $body[$key], $maxLength);
    return $value ?? $default;
}

function normalize_tags($raw): array
{
    if (!is_array($raw)) {
        return [];
    }
    $clean = [];
    foreach ($raw as $item) {
        $value = limit_string((string) $item, 32);
        if ($value !== null) {
            $clean[] = $value;
        }
    }
    return array_values(array_unique($clean));
}

function is_moderation_status(string $status): bool
{
    return in_array($status, ['pending', 'approved', 'rejected'], true);
}

function normalize_moderation_status(string $status): string
{
    $normalized = utf8_strtolower(trim($status));
    return is_moderation_status($normalized) ? $normalized : 'pending';
}

function load_blacklist_terms(PDO $pdo): array
{
    static $cache = null;
    if (is_array($cache)) {
        return $cache;
    }

    $stmt = $pdo->query('SELECT term FROM moderation_blacklist WHERE is_active = 1');
    $rows = $stmt ? $stmt->fetchAll() : [];
    $terms = [];
    foreach ($rows as $row) {
        $term = utf8_strtolower(trim((string) ($row['term'] ?? '')));
        if ($term !== '') {
            $terms[] = $term;
        }
    }
    $cache = array_values(array_unique($terms));
    return $cache;
}

function detect_blacklisted_term(PDO $pdo, array $sources): ?string
{
    $terms = load_blacklist_terms($pdo);
    if (empty($terms)) {
        return null;
    }

    $parts = [];
    foreach ($sources as $source) {
        if (is_array($source)) {
            foreach ($source as $entry) {
                $parts[] = utf8_strtolower((string) $entry);
            }
        } else {
            $parts[] = utf8_strtolower((string) $source);
        }
    }
    $haystack = implode(' ', $parts);
    foreach ($terms as $term) {
        if ($term !== '' && str_contains($haystack, $term)) {
            return $term;
        }
    }
    return null;
}

function meme_to_api(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'user_id' => (int) $row['user_id'],
        'username' => $row['username'] ?? null,
        'title' => $row['title'],
        'description' => $row['description'],
        'source_image_url' => $row['source_image_url'],
        'generated_image_url' => $row['generated_image_url'],
        'payload' => $row['payload_json'] ? json_decode((string) $row['payload_json'], true) : null,
        'tags' => $row['tags_json'] ? json_decode((string) $row['tags_json'], true) : [],
        'is_public' => (bool) $row['is_public'],
        'moderation_status' => $row['moderation_status'] ?? 'pending',
        'moderation_reason' => $row['moderation_reason'] ?? null,
        'favorites_count' => isset($row['favorites_count']) ? (int) $row['favorites_count'] : null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

function fetch_meme_row(PDO $pdo, int $memeId): ?array
{
    $stmt = $pdo->prepare(
        'SELECT m.*, u.username,
                (SELECT COUNT(*) FROM meme_favorites mf WHERE mf.meme_id = m.id) AS favorites_count
         FROM memes m
         INNER JOIN users u ON u.id = m.user_id
         WHERE m.id = :id
         LIMIT 1'
    );
    $stmt->execute([':id' => $memeId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function can_view_meme(array $row, ?array $viewer): bool
{
    $isPublicApproved = ((int) $row['is_public'] === 1)
        && (($row['moderation_status'] ?? 'pending') === 'approved');
    if ($isPublicApproved) {
        return true;
    }
    if (!$viewer) {
        return false;
    }
    if ((int) $viewer['id'] === (int) $row['user_id']) {
        return true;
    }
    return is_admin_user($viewer);
}

function require_meme_owner_or_admin(PDO $pdo, int $memeId, array $user): array
{
    $row = fetch_meme_row($pdo, $memeId);
    if (!$row) {
        fail('Meme not found', 404);
    }
    if ((int) $row['user_id'] !== (int) $user['id'] && !is_admin_user($user)) {
        fail('Forbidden', 403);
    }
    return $row;
}

function persist_meme_version(
    PDO $pdo,
    int $memeId,
    int $ownerUserId,
    array $memeRow,
    string $changeSource,
    ?int $createdByUserId = null,
    ?string $label = null
): void {
    $stmt = $pdo->prepare(
        'INSERT INTO meme_versions
            (meme_id, user_id, version_label, snapshot_payload_json, snapshot_title, snapshot_description, snapshot_source_image_url, snapshot_generated_image_url, snapshot_tags_json, snapshot_is_public, change_source, created_by_user_id)
         VALUES
            (:meme_id, :user_id, :version_label, :snapshot_payload_json, :snapshot_title, :snapshot_description, :snapshot_source_image_url, :snapshot_generated_image_url, :snapshot_tags_json, :snapshot_is_public, :change_source, :created_by_user_id)'
    );
    $stmt->execute([
        ':meme_id' => $memeId,
        ':user_id' => $ownerUserId,
        ':version_label' => $label !== null ? limit_string($label, 120) : null,
        ':snapshot_payload_json' => $memeRow['payload_json'] ?? null,
        ':snapshot_title' => limit_string((string) ($memeRow['title'] ?? 'Untitled meme'), 120) ?? 'Untitled meme',
        ':snapshot_description' => limit_string((string) ($memeRow['description'] ?? ''), 65535),
        ':snapshot_source_image_url' => limit_string((string) ($memeRow['source_image_url'] ?? ''), 8192),
        ':snapshot_generated_image_url' => limit_string((string) ($memeRow['generated_image_url'] ?? ''), 8192),
        ':snapshot_tags_json' => $memeRow['tags_json'] ?? json_encode([], JSON_UNESCAPED_UNICODE),
        ':snapshot_is_public' => ((int) ($memeRow['is_public'] ?? 0)) === 1 ? 1 : 0,
        ':change_source' => $changeSource,
        ':created_by_user_id' => $createdByUserId,
    ]);
}

function parse_json_candidates(string $raw): ?array
{
    $raw = trim($raw);
    if ($raw === '') {
        return null;
    }

    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        return $decoded;
    }

    $start = strpos($raw, '[');
    $end = strrpos($raw, ']');
    if ($start === false || $end === false || $end <= $start) {
        return null;
    }

    $candidate = substr($raw, $start, $end - $start + 1);
    $decoded = json_decode($candidate, true);
    return is_array($decoded) ? $decoded : null;
}

function generate_local_suggestions(string $language, string $topic, string $style): array
{
    $safeTopic = $topic !== '' ? $topic : 'today';
    $safeStyle = $style !== '' ? $style : 'funny';

    $dictionary = [
        'fr' => [
            ['top' => "Quand je pense a {$safeTopic}", 'bottom' => "Et je choisis le chaos {$safeStyle}"],
            ['top' => "Moi: je reste calme", 'bottom' => "{$safeTopic}: mission impossible"],
            ['top' => "Plan du jour", 'bottom' => "{$safeTopic}, cafe, puis panique"],
        ],
        'de' => [
            ['top' => "Wenn ich an {$safeTopic} denke", 'bottom' => "und trotzdem professionell bleibe"],
            ['top' => "Ich bleibe ruhig", 'bottom' => "{$safeTopic} sagt nein"],
            ['top' => "Heute auf der Liste", 'bottom' => "{$safeTopic} im {$safeStyle}-Modus"],
        ],
        'it' => [
            ['top' => "Quando penso a {$safeTopic}", 'bottom' => "ma faccio finta che sia tutto sotto controllo"],
            ['top' => "Io: resto tranquillo", 'bottom' => "{$safeTopic}: non oggi"],
            ['top' => "Piano del giorno", 'bottom' => "{$safeTopic} con energia {$safeStyle}"],
        ],
        'ja' => [
            ['top' => "{$safeTopic}を考えた瞬間", 'bottom' => "{$safeStyle}モードで全力"],
            ['top' => "落ち着いてるつもりの私", 'bottom' => "{$safeTopic}で一気に崩壊"],
            ['top' => "今日の予定", 'bottom' => "{$safeTopic}とカオス"],
        ],
        'en' => [
            ['top' => "When I think about {$safeTopic}", 'bottom' => "and choose {$safeStyle} chaos"],
            ['top' => "Me: staying calm", 'bottom' => "{$safeTopic}: absolutely not"],
            ['top' => "Today's plan", 'bottom' => "{$safeTopic}, coffee, controlled chaos"],
        ],
    ];

    $items = $dictionary[$language] ?? $dictionary['en'];
    return array_slice($items, 0, 3);
}

function generate_openai_suggestions(string $language, string $topic, string $style): ?array
{
    $aiConfig = config()['ai'] ?? [];
    $apiKey = trim((string) ($aiConfig['openai_api_key'] ?? ''));
    if ($apiKey === '' || !function_exists('curl_init')) {
        return null;
    }

    $model = trim((string) ($aiConfig['model'] ?? 'gpt-4.1-mini'));
    if ($model === '') {
        $model = 'gpt-4.1-mini';
    }

    $payload = [
        'model' => $model,
        'input' => [
            [
                'role' => 'system',
                'content' => 'Return ONLY a JSON array of 3 meme caption pairs with keys top and bottom.',
            ],
            [
                'role' => 'user',
                'content' => sprintf(
                    'Language: %s. Topic: %s. Style: %s. Keep each line short.',
                    $language,
                    $topic,
                    $style
                ),
            ],
        ],
        'temperature' => 0.9,
        'max_output_tokens' => 250,
    ];

    $ch = curl_init('https://api.openai.com/v1/responses');
    if ($ch === false) {
        return null;
    }

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 12,
    ]);

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!is_string($response) || $status < 200 || $status >= 300) {
        return null;
    }

    $json = json_decode($response, true);
    if (!is_array($json)) {
        return null;
    }

    $rawText = '';
    if (isset($json['output_text']) && is_string($json['output_text'])) {
        $rawText = $json['output_text'];
    } elseif (isset($json['output']) && is_array($json['output'])) {
        foreach ($json['output'] as $chunk) {
            if (!is_array($chunk) || !isset($chunk['content']) || !is_array($chunk['content'])) {
                continue;
            }
            foreach ($chunk['content'] as $part) {
                if (isset($part['text']) && is_string($part['text'])) {
                    $rawText .= $part['text'];
                }
            }
        }
    }

    $parsed = parse_json_candidates($rawText);
    if (!$parsed) {
        return null;
    }

    $items = [];
    foreach ($parsed as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $top = limit_string((string) ($entry['top'] ?? ''), 80) ?? '';
        $bottom = limit_string((string) ($entry['bottom'] ?? ''), 80) ?? '';
        if ($top === '' && $bottom === '') {
            continue;
        }
        $items[] = ['top' => $top, 'bottom' => $bottom];
    }

    return !empty($items) ? array_slice($items, 0, 3) : null;
}

if ($segments[0] === 'auth' && count($segments) >= 2) {
    $action = $segments[1];
    $body = json_input();

    if ($method === 'POST' && $action === 'register') {
        assert_rate_limit(
            $pdo,
            'auth_register',
            (int) (config()['auth']['max_register_attempts_per_hour'] ?? 20),
            3600,
            1800
        );

        $username = trim((string) ($body['username'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if (utf8_strlen($username) < 3 || utf8_strlen($username) > 32) {
            fail('Username must be between 3 and 32 characters');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            fail('Invalid email');
        }
        if (utf8_strlen($password) < 8) {
            fail('Password must contain at least 8 characters');
        }

        try {
            $stmt = $pdo->prepare(
                'INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)'
            );
            $stmt->execute([
                ':username' => $username,
                ':email' => utf8_strtolower($email),
                ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
            ]);
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 23000) {
                fail('Username or email already used', 409);
            }
            throw $e;
        }

        $userId = (int) $pdo->lastInsertId();
        $token = issue_token($pdo, $userId);
        ok([
            'token' => $token,
            'user' => [
                'id' => $userId,
                'username' => $username,
                'email' => utf8_strtolower($email),
            ],
        ], 201);
    }

    if ($method === 'POST' && $action === 'login') {
        assert_rate_limit(
            $pdo,
            'auth_login',
            (int) (config()['auth']['max_login_attempts_per_minute'] ?? 8),
            60,
            900
        );

        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            fail('Invalid credentials', 401);
        }

        $stmt = $pdo->prepare(
            'SELECT id, username, email, password_hash FROM users WHERE email = :email LIMIT 1'
        );
        $stmt->execute([':email' => utf8_strtolower($email)]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, (string) $user['password_hash'])) {
            fail('Invalid credentials', 401);
        }

        $token = issue_token($pdo, (int) $user['id']);
        ok([
            'token' => $token,
            'user' => [
                'id' => (int) $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
            ],
        ]);
    }

    if ($method === 'POST' && $action === 'logout') {
        $token = bearer_token();
        if ($token) {
            revoke_token($pdo, $token);
        }
        ok(['logged_out' => true]);
    }
}

if ($segments[0] === 'ai' && count($segments) === 2 && $segments[1] === 'meme-suggestions') {
    if ($method !== 'POST') {
        fail('Method not allowed', 405);
    }

    assert_rate_limit($pdo, 'ai_meme_suggestions', 30, 3600, 900);
    $body = json_input();
    $language = utf8_strtolower(body_string($body, 'language', 8, 'en'));
    if (!in_array($language, ['fr', 'en', 'de', 'it', 'ja'], true)) {
        $language = 'en';
    }
    $topic = body_string($body, 'topic', 120, '');
    $style = body_string($body, 'style', 80, 'funny');

    $items = generate_openai_suggestions($language, $topic, $style);
    $provider = 'openai';
    if (!$items) {
        $items = generate_local_suggestions($language, $topic, $style);
        $provider = 'local';
    }
    ok(['items' => $items, 'provider' => $provider]);
}

if ($segments[0] === 'me') {
    $user = require_user($pdo);

    if ($method === 'GET' && count($segments) === 1) {
        $statsStmt = $pdo->prepare(
            'SELECT
                COUNT(*) AS total_memes,
                SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) AS public_memes
             FROM memes
             WHERE user_id = :user_id'
        );
        $statsStmt->execute([':user_id' => (int) $user['id']]);
        $stats = $statsStmt->fetch() ?: ['total_memes' => 0, 'public_memes' => 0];

        ok([
            'user' => [
                'id' => (int) $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'created_at' => $user['created_at'],
                'is_admin' => is_admin_user($user),
            ],
            'stats' => [
                'total_memes' => (int) ($stats['total_memes'] ?? 0),
                'public_memes' => (int) ($stats['public_memes'] ?? 0),
            ],
        ]);
    }

    if ($method === 'GET' && count($segments) === 2 && $segments[1] === 'favorites') {
        $stmt = $pdo->prepare(
            'SELECT m.*, u.username,
                    (SELECT COUNT(*) FROM meme_favorites mf2 WHERE mf2.meme_id = m.id) AS favorites_count
             FROM meme_favorites mf
             INNER JOIN memes m ON m.id = mf.meme_id
             INNER JOIN users u ON u.id = m.user_id
             WHERE mf.user_id = :user_id
             ORDER BY mf.created_at DESC'
        );
        $stmt->execute([':user_id' => (int) $user['id']]);
        $rows = $stmt->fetchAll();
        ok(['items' => array_map('meme_to_api', $rows)]);
    }
}

if ($segments[0] === 'telemetry' && count($segments) === 2 && $segments[1] === 'visit') {
    if ($method !== 'POST') {
        fail('Method not allowed', 405);
    }

    assert_rate_limit($pdo, 'telemetry_visit', 120, 3600, 600);
    $body = json_input();
    $consent = body_bool($body, 'consent', false);
    if (!$consent) {
        fail('Consent is required', 400);
    }

    $visitorId = limit_string((string) ($body['visitor_id'] ?? ''), 80);
    if ($visitorId === null) {
        fail('visitor_id is required', 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO consented_visits
            (visitor_id, consent_version, page_path, referrer, timezone, screen, language, platform, user_agent, ip_hash, dnt, utm_source, utm_medium, utm_campaign)
         VALUES
            (:visitor_id, :consent_version, :page_path, :referrer, :timezone, :screen, :language, :platform, :user_agent, :ip_hash, :dnt, :utm_source, :utm_medium, :utm_campaign)'
    );
    $stmt->execute([
        ':visitor_id' => $visitorId,
        ':consent_version' => limit_string((string) ($body['consent_version'] ?? 'v1'), 24),
        ':page_path' => limit_string((string) ($body['page_path'] ?? '/'), 255),
        ':referrer' => limit_string((string) ($body['referrer'] ?? ''), 1024),
        ':timezone' => limit_string((string) ($body['timezone'] ?? ''), 64),
        ':screen' => limit_string((string) ($body['screen'] ?? ''), 32),
        ':language' => limit_string((string) ($body['language'] ?? ''), 32),
        ':platform' => limit_string((string) ($body['platform'] ?? ''), 64),
        ':user_agent' => limit_string($_SERVER['HTTP_USER_AGENT'] ?? '', 400),
        ':ip_hash' => client_ip_hash(),
        ':dnt' => body_bool($body, 'dnt', false) ? 1 : 0,
        ':utm_source' => limit_string((string) ($body['utm_source'] ?? ''), 80),
        ':utm_medium' => limit_string((string) ($body['utm_medium'] ?? ''), 80),
        ':utm_campaign' => limit_string((string) ($body['utm_campaign'] ?? ''), 80),
    ]);

    ok(['tracked' => true], 201);
}

if ($segments[0] === 'moderation') {
    $admin = require_admin($pdo);

    if ($method === 'GET' && count($segments) === 2 && $segments[1] === 'blacklist') {
        $stmt = $pdo->query(
            'SELECT id, term, is_active, created_at
             FROM moderation_blacklist
             ORDER BY term ASC'
        );
        $rows = $stmt ? $stmt->fetchAll() : [];
        ok(['items' => $rows]);
    }

    if ($method === 'POST' && count($segments) === 2 && $segments[1] === 'blacklist') {
        $body = json_input();
        $term = body_string($body, 'term', 120, '');
        if ($term === '') {
            fail('term is required', 400);
        }
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO moderation_blacklist (term, is_active, created_by_user_id)
                 VALUES (:term, 1, :created_by_user_id)'
            );
            $stmt->execute([
                ':term' => utf8_strtolower($term),
                ':created_by_user_id' => (int) $admin['id'],
            ]);
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 23000) {
                fail('term already exists', 409);
            }
            throw $e;
        }
        ok(['created' => true], 201);
    }

    if ($method === 'DELETE' && count($segments) === 3 && $segments[1] === 'blacklist' && ctype_digit($segments[2])) {
        $stmt = $pdo->prepare('DELETE FROM moderation_blacklist WHERE id = :id');
        $stmt->execute([':id' => (int) $segments[2]]);
        ok(['deleted' => true]);
    }

    if ($method === 'GET' && count($segments) === 2 && $segments[1] === 'reports') {
        $status = utf8_strtolower((string) ($_GET['status'] ?? 'open'));
        if (!in_array($status, ['open', 'reviewed', 'dismissed', 'all'], true)) {
            $status = 'open';
        }
        $limit = max(1, min(100, (int) ($_GET['limit'] ?? 40)));
        $offset = max(0, (int) ($_GET['offset'] ?? 0));

        $sql = 'SELECT r.*, m.title, m.user_id, u.username AS reporter_username
                FROM meme_reports r
                INNER JOIN memes m ON m.id = r.meme_id
                LEFT JOIN users u ON u.id = r.reporter_user_id';
        if ($status !== 'all') {
            $sql .= ' WHERE r.status = :status';
        }
        $sql .= ' ORDER BY r.created_at DESC LIMIT :limit OFFSET :offset';

        $stmt = $pdo->prepare($sql);
        if ($status !== 'all') {
            $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        ok(['items' => $rows]);
    }

    if (($method === 'PATCH' || $method === 'PUT') && count($segments) === 3 && $segments[1] === 'reports' && ctype_digit($segments[2])) {
        $reportId = (int) $segments[2];
        $body = json_input();
        $status = utf8_strtolower(body_string($body, 'status', 16, 'reviewed'));
        if (!in_array($status, ['open', 'reviewed', 'dismissed'], true)) {
            fail('Invalid status', 400);
        }
        $resolutionNote = body_string($body, 'resolution_note', 255, '');

        $stmt = $pdo->prepare(
            'UPDATE meme_reports
             SET status = :status,
                 reviewed_by_user_id = :reviewed_by_user_id,
                 resolution_note = :resolution_note,
                 reviewed_at = NOW()
             WHERE id = :id'
        );
        $stmt->execute([
            ':status' => $status,
            ':reviewed_by_user_id' => (int) $admin['id'],
            ':resolution_note' => $resolutionNote !== '' ? $resolutionNote : null,
            ':id' => $reportId,
        ]);
        ok(['updated' => true]);
    }

    if ($method === 'GET' && count($segments) === 2 && $segments[1] === 'memes') {
        $status = normalize_moderation_status((string) ($_GET['status'] ?? 'pending'));
        $limit = max(1, min(100, (int) ($_GET['limit'] ?? 40)));
        $offset = max(0, (int) ($_GET['offset'] ?? 0));

        $stmt = $pdo->prepare(
            'SELECT m.*, u.username,
                    (SELECT COUNT(*) FROM meme_reports r WHERE r.meme_id = m.id AND r.status = "open") AS open_reports
             FROM memes m
             INNER JOIN users u ON u.id = m.user_id
             WHERE m.moderation_status = :status
             ORDER BY m.updated_at DESC
             LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        ok(['items' => array_map('meme_to_api', $rows)]);
    }

    if (($method === 'PATCH' || $method === 'PUT') && count($segments) === 3 && $segments[1] === 'memes' && ctype_digit($segments[2])) {
        $memeId = (int) $segments[2];
        $body = json_input();
        $status = normalize_moderation_status(body_string($body, 'status', 16, 'pending'));
        $reason = body_string($body, 'reason', 255, '');

        $stmt = $pdo->prepare(
            'UPDATE memes
             SET moderation_status = :status,
                 moderation_reason = :reason,
                 moderated_by_user_id = :moderated_by_user_id,
                 moderated_at = NOW(),
                 updated_at = NOW()
             WHERE id = :id'
        );
        $stmt->execute([
            ':status' => $status,
            ':reason' => $reason !== '' ? $reason : null,
            ':moderated_by_user_id' => (int) $admin['id'],
            ':id' => $memeId,
        ]);
        ok(['updated' => true]);
    }
}

fail('Route not found', 404);
