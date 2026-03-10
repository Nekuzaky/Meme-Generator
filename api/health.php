<?php

declare(strict_types=1);

require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/http.php';

apply_cors();

$healthToken = trim((string) (config()['security']['healthcheck_token'] ?? ''));
$providedToken = trim((string) ($_GET['token'] ?? ''));
if ($healthToken === '' || $providedToken === '' || !hash_equals($healthToken, $providedToken)) {
    fail_public(404);
}

$dbStatus = 'down';
$dbError = null;

try {
    $pdo = db();
    $pdo->query('SELECT 1');
    $dbStatus = 'up';
} catch (Throwable $e) {
    $dbError = $e->getMessage();
}

$cfg = config();
$publicBaseUrl = (string) ($cfg['app']['public_base_url'] ?? '');
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

json_response([
    'ok' => $dbStatus === 'up',
    'service' => 'API Health',
    'db' => [
        'status' => $dbStatus,
    ],
], $dbStatus === 'up' ? 200 : 503);
