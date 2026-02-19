<?php

declare(strict_types=1);

function apply_cors(): void
{
    $cors = config()['cors'];
    header('Access-Control-Allow-Origin: ' . $cors['allow_origin']);
    header('Access-Control-Allow-Methods: ' . $cors['allow_methods']);
    header('Access-Control-Allow-Headers: ' . $cors['allow_headers']);
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
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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
