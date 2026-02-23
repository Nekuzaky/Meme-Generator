<?php

declare(strict_types=1);

function apply_cors(): void
{
    $cors = config()['cors'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowOrigins = $cors['allow_origins'] ?? ['*'];

    if (in_array('*', $allowOrigins, true)) {
        header('Access-Control-Allow-Origin: *');
    } elseif ($origin !== '' && in_array($origin, $allowOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } elseif (!empty($allowOrigins)) {
        header('Access-Control-Allow-Origin: ' . $allowOrigins[0]);
    }

    header('Access-Control-Allow-Methods: ' . $cors['allow_methods']);
    header('Access-Control-Allow-Headers: ' . $cors['allow_headers']);
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
    header('Content-Type: application/json; charset=utf-8');
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $parsed = json_decode($raw, true);
    return is_array($parsed) ? $parsed : [];
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);

    if (function_exists('ob_get_level') && function_exists('ob_clean')) {
        $level = ob_get_level();
        if (is_int($level) && $level > 0) {
            @ob_clean();
        }
    }

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        http_response_code(500);
        $json = '{"ok":false,"error":"JSON encode failed"}';
    }
    echo $json;
    exit;
}

function fail(string $message, int $status = 400, array $extra = []): never
{
    json_response(array_merge(['ok' => false, 'error' => $message], $extra), $status);
}

function ok(array $data = [], int $status = 200): never
{
    json_response(array_merge(['ok' => true], $data), $status);
}

function route_segments(): array
{
    $forced = $_GET['_path'] ?? '';
    if (is_string($forced) && trim($forced) !== '') {
        $parts = array_values(array_filter(explode('/', trim($forced, '/'))));
        if (!empty($parts) && $parts[0] === 'api') {
            array_shift($parts);
        }
        if (!empty($parts) && $parts[0] === 'index.php') {
            array_shift($parts);
        }
        return $parts;
    }

    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    $parts = array_values(array_filter(explode('/', trim($path, '/'))));
    if (!empty($parts) && $parts[0] === 'api') {
        array_shift($parts);
    }
    if (!empty($parts) && $parts[0] === 'index.php') {
        array_shift($parts);
    }
    return $parts;
}
