<?php

declare(strict_types=1);

function client_ip(): string
{
    $candidates = [];
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        foreach (explode(',', $forwarded) as $chunk) {
            $candidates[] = trim($chunk);
        }
    }
    $candidates[] = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

    foreach ($candidates as $candidate) {
        if ($candidate !== '' && filter_var($candidate, FILTER_VALIDATE_IP)) {
            return $candidate;
        }
    }

    return '0.0.0.0';
}

function client_ip_hash(): string
{
    $secret = (string) (config()['security']['ip_hash_secret'] ?? '');
    if ($secret === '') {
        $secret = 'fallback-change-me';
    }
    return hash_hmac('sha256', client_ip(), $secret);
}

function utf8_strlen(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }
    return strlen($value);
}

function utf8_strtolower(string $value): string
{
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($value, 'UTF-8');
    }
    return strtolower($value);
}

function utf8_substr(string $value, int $start, ?int $length = null): string
{
    if (function_exists('mb_substr')) {
        return $length === null
            ? mb_substr($value, $start, null, 'UTF-8')
            : mb_substr($value, $start, $length, 'UTF-8');
    }

    $result = $length === null
        ? substr($value, $start)
        : substr($value, $start, $length);
    return $result === false ? '' : $result;
}

function limit_string(?string $value, int $max): ?string
{
    if ($value === null) {
        return null;
    }
    $trimmed = trim($value);
    if ($trimmed === '') {
        return null;
    }
    return utf8_substr($trimmed, 0, $max);
}

function assert_rate_limit(
    PDO $pdo,
    string $action,
    int $maxHits,
    int $windowSeconds,
    int $blockSeconds
): void {
    $rateKey = hash('sha256', $action . '|' . client_ip_hash());
    $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));

    $stmt = $pdo->prepare(
        'SELECT rate_key, hits, window_start, blocked_until
         FROM api_rate_limits
         WHERE rate_key = :rate_key
         LIMIT 1'
    );
    $stmt->execute([':rate_key' => $rateKey]);
    $row = $stmt->fetch();

    if (!$row) {
        $insert = $pdo->prepare(
            'INSERT INTO api_rate_limits (rate_key, hits, window_start, blocked_until)
             VALUES (:rate_key, 1, NOW(), NULL)'
        );
        $insert->execute([':rate_key' => $rateKey]);
        return;
    }

    $blockedUntil = $row['blocked_until'] ? new DateTimeImmutable($row['blocked_until']) : null;
    if ($blockedUntil && $blockedUntil > $now) {
        fail('Too many requests, please retry later.', 429);
    }

    $windowStart = new DateTimeImmutable((string) $row['window_start']);
    $windowDiff = $now->getTimestamp() - $windowStart->getTimestamp();

    if ($windowDiff > $windowSeconds) {
        $reset = $pdo->prepare(
            'UPDATE api_rate_limits
             SET hits = 1, window_start = NOW(), blocked_until = NULL
             WHERE rate_key = :rate_key'
        );
        $reset->execute([':rate_key' => $rateKey]);
        return;
    }

    $hits = (int) $row['hits'] + 1;
    if ($hits > $maxHits) {
        $block = $pdo->prepare(
            'UPDATE api_rate_limits
             SET hits = :hits,
                 blocked_until = DATE_ADD(NOW(), INTERVAL :block_seconds SECOND)
             WHERE rate_key = :rate_key'
        );
        $block->bindValue(':hits', $hits, PDO::PARAM_INT);
        $block->bindValue(':block_seconds', $blockSeconds, PDO::PARAM_INT);
        $block->bindValue(':rate_key', $rateKey, PDO::PARAM_STR);
        $block->execute();
        fail('Too many requests, please retry later.', 429);
    }

    $update = $pdo->prepare(
        'UPDATE api_rate_limits
         SET hits = :hits, blocked_until = NULL
         WHERE rate_key = :rate_key'
    );
    $update->bindValue(':hits', $hits, PDO::PARAM_INT);
    $update->bindValue(':rate_key', $rateKey, PDO::PARAM_STR);
    $update->execute();
}
