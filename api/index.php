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
        'version' => '1.0.0',
        'routes' => [
            'POST /api/auth/register',
            'POST /api/auth/login',
            'POST /api/auth/logout',
            'GET  /api/me',
            'GET  /api/memes/public',
            'GET  /api/memes',
            'POST /api/memes',
            'GET  /api/memes/{id}',
            'PUT  /api/memes/{id}',
            'DELETE /api/memes/{id}',
            'POST /api/memes/{id}/favorite',
            'DELETE /api/memes/{id}/favorite',
            'GET  /api/me/favorites',
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
        'favorites_count' => isset($row['favorites_count']) ? (int) $row['favorites_count'] : null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
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

if ($segments[0] === 'memes') {
    if ($method === 'GET' && count($segments) === 2 && $segments[1] === 'public') {
        $limit = max(1, min(100, (int) ($_GET['limit'] ?? 20)));
        $offset = max(0, (int) ($_GET['offset'] ?? 0));
        $stmt = $pdo->prepare(
            'SELECT m.*, u.username,
                    (SELECT COUNT(*) FROM meme_favorites mf WHERE mf.meme_id = m.id) AS favorites_count
             FROM memes m
             INNER JOIN users u ON u.id = m.user_id
             WHERE m.is_public = 1
             ORDER BY m.created_at DESC
             LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        ok(['items' => array_map('meme_to_api', $rows)]);
    }

    if ($method === 'GET' && count($segments) === 1) {
        $user = require_user($pdo);
        $stmt = $pdo->prepare(
            'SELECT m.*,
                    (SELECT COUNT(*) FROM meme_favorites mf WHERE mf.meme_id = m.id) AS favorites_count
             FROM memes m
             WHERE m.user_id = :user_id
             ORDER BY m.created_at DESC'
        );
        $stmt->execute([':user_id' => (int) $user['id']]);
        $rows = $stmt->fetchAll();
        ok(['items' => array_map('meme_to_api', $rows)]);
    }

    if ($method === 'POST' && count($segments) === 1) {
        assert_rate_limit($pdo, 'memes_create', 60, 3600, 600);
        $user = require_user($pdo);
        $body = json_input();

        $title = trim((string) ($body['title'] ?? 'Untitled meme'));
        $description = trim((string) ($body['description'] ?? ''));
        $sourceImageUrl = trim((string) ($body['source_image_url'] ?? ''));
        $generatedImageUrl = trim((string) ($body['generated_image_url'] ?? ''));
        $payload = $body['payload'] ?? null;
        $tags = $body['tags'] ?? [];
        $isPublic = body_bool($body, 'is_public', false) ? 1 : 0;

        if ($title === '') {
            $title = 'Untitled meme';
        }
        if (!is_array($tags)) {
            $tags = [];
        }

        $stmt = $pdo->prepare(
            'INSERT INTO memes
                (user_id, title, description, source_image_url, generated_image_url, payload_json, tags_json, is_public)
             VALUES
                (:user_id, :title, :description, :source_image_url, :generated_image_url, :payload_json, :tags_json, :is_public)'
        );
        $stmt->execute([
            ':user_id' => (int) $user['id'],
            ':title' => $title,
            ':description' => $description !== '' ? $description : null,
            ':source_image_url' => $sourceImageUrl !== '' ? $sourceImageUrl : null,
            ':generated_image_url' => $generatedImageUrl !== '' ? $generatedImageUrl : null,
            ':payload_json' => $payload !== null ? json_encode($payload, JSON_UNESCAPED_UNICODE) : null,
            ':tags_json' => json_encode(array_values($tags), JSON_UNESCAPED_UNICODE),
            ':is_public' => $isPublic,
        ]);

        $id = (int) $pdo->lastInsertId();
        ok(['id' => $id], 201);
    }

    if (count($segments) >= 2 && ctype_digit($segments[1])) {
        $memeId = (int) $segments[1];

        if ($method === 'GET' && count($segments) === 2) {
            $viewer = current_user($pdo);
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
            if (!$row) {
                fail('Meme not found', 404);
            }
            $canView = ((int) $row['is_public'] === 1)
                || ($viewer && (int) $viewer['id'] === (int) $row['user_id']);
            if (!$canView) {
                fail('Forbidden', 403);
            }
            ok(['item' => meme_to_api($row)]);
        }

        if ($method === 'PUT' || $method === 'PATCH' || $method === 'DELETE') {
            $user = require_user($pdo);
            $ownStmt = $pdo->prepare('SELECT user_id FROM memes WHERE id = :id LIMIT 1');
            $ownStmt->execute([':id' => $memeId]);
            $owner = $ownStmt->fetch();
            if (!$owner) {
                fail('Meme not found', 404);
            }
            if ((int) $owner['user_id'] !== (int) $user['id']) {
                fail('Forbidden', 403);
            }
        }

        if (($method === 'PUT' || $method === 'PATCH') && count($segments) === 2) {
            assert_rate_limit($pdo, 'memes_update', 180, 3600, 600);
            $body = json_input();
            $fields = [];
            $params = [':id' => $memeId];

            if (array_key_exists('title', $body)) {
                $fields[] = 'title = :title';
                $params[':title'] = trim((string) $body['title']) ?: 'Untitled meme';
            }
            if (array_key_exists('description', $body)) {
                $fields[] = 'description = :description';
                $description = trim((string) $body['description']);
                $params[':description'] = $description !== '' ? $description : null;
            }
            if (array_key_exists('source_image_url', $body)) {
                $fields[] = 'source_image_url = :source_image_url';
                $url = trim((string) $body['source_image_url']);
                $params[':source_image_url'] = $url !== '' ? $url : null;
            }
            if (array_key_exists('generated_image_url', $body)) {
                $fields[] = 'generated_image_url = :generated_image_url';
                $url = trim((string) $body['generated_image_url']);
                $params[':generated_image_url'] = $url !== '' ? $url : null;
            }
            if (array_key_exists('payload', $body)) {
                $fields[] = 'payload_json = :payload_json';
                $params[':payload_json'] = $body['payload'] !== null
                    ? json_encode($body['payload'], JSON_UNESCAPED_UNICODE)
                    : null;
            }
            if (array_key_exists('tags', $body)) {
                $fields[] = 'tags_json = :tags_json';
                $tags = is_array($body['tags']) ? array_values($body['tags']) : [];
                $params[':tags_json'] = json_encode($tags, JSON_UNESCAPED_UNICODE);
            }
            if (array_key_exists('is_public', $body)) {
                $fields[] = 'is_public = :is_public';
                $params[':is_public'] = body_bool($body, 'is_public', false) ? 1 : 0;
            }

            if (empty($fields)) {
                fail('Nothing to update');
            }

            $sql = 'UPDATE memes SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            ok(['updated' => true]);
        }

        if ($method === 'DELETE' && count($segments) === 2) {
            assert_rate_limit($pdo, 'memes_delete', 80, 3600, 600);
            $stmt = $pdo->prepare('DELETE FROM memes WHERE id = :id');
            $stmt->execute([':id' => $memeId]);
            ok(['deleted' => true]);
        }

        if (($method === 'POST' || $method === 'DELETE') && count($segments) === 3 && $segments[2] === 'favorite') {
            $user = require_user($pdo);

            if ($method === 'POST') {
                $stmt = $pdo->prepare(
                    'INSERT IGNORE INTO meme_favorites (user_id, meme_id) VALUES (:user_id, :meme_id)'
                );
                $stmt->execute([
                    ':user_id' => (int) $user['id'],
                    ':meme_id' => $memeId,
                ]);
                ok(['favorited' => true]);
            }

            if ($method === 'DELETE') {
                $stmt = $pdo->prepare(
                    'DELETE FROM meme_favorites WHERE user_id = :user_id AND meme_id = :meme_id'
                );
                $stmt->execute([
                    ':user_id' => (int) $user['id'],
                    ':meme_id' => $memeId,
                ]);
                ok(['favorited' => false]);
            }
        }
    }
}

fail('Route not found', 404);
