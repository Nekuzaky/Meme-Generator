<?php

declare(strict_types=1);

function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (!preg_match('/Bearer\s+(.+)$/i', $header, $matches)) {
        return null;
    }
    return trim($matches[1]);
}

function hash_token(string $token): string
{
    return hash('sha256', $token);
}

function issue_token(PDO $pdo, int $userId): string
{
    $plain = bin2hex(random_bytes(32));
    $hashed = hash_token($plain);
    $ttlDays = (int) (config()['auth']['token_ttl_days'] ?? 30);

    $stmt = $pdo->prepare(
        'INSERT INTO auth_tokens (user_id, token_hash, expires_at) VALUES (:user_id, :token_hash, DATE_ADD(NOW(), INTERVAL :ttl DAY))'
    );
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':token_hash', $hashed, PDO::PARAM_STR);
    $stmt->bindValue(':ttl', $ttlDays, PDO::PARAM_INT);
    $stmt->execute();

    return $plain;
}

function revoke_token(PDO $pdo, string $token): void
{
    $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE token_hash = :token_hash');
    $stmt->execute([':token_hash' => hash_token($token)]);
}

function current_user(PDO $pdo): ?array
{
    $token = bearer_token();
    if (!$token) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT u.id, u.username, u.email, u.created_at
         FROM auth_tokens t
         INNER JOIN users u ON u.id = t.user_id
         WHERE t.token_hash = :token_hash
           AND (t.expires_at IS NULL OR t.expires_at > NOW())
         LIMIT 1'
    );
    $stmt->execute([':token_hash' => hash_token($token)]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function require_user(PDO $pdo): array
{
    $user = current_user($pdo);
    if (!$user) {
        fail('Unauthorized', 401);
    }
    return $user;
}

function is_admin_user(array $user): bool
{
    $admins = config()['security']['admin_emails'] ?? [];
    if (!is_array($admins)) {
        return false;
    }

    $email = utf8_strtolower((string) ($user['email'] ?? ''));
    foreach ($admins as $adminEmail) {
        if ($email === utf8_strtolower((string) $adminEmail)) {
            return true;
        }
    }

    return false;
}

function require_admin(PDO $pdo): array
{
    $user = require_user($pdo);
    if (!is_admin_user($user)) {
        fail('Forbidden', 403);
    }
    return $user;
}
