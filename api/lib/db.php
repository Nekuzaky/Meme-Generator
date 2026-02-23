<?php

declare(strict_types=1);

function config(): array
{
    static $config = null;
    if ($config === null) {
        $basePath = __DIR__ . '/../config.php';
        $localPath = __DIR__ . '/../config.local.php';

        $base = is_file($basePath) ? require $basePath : [];
        if (!is_array($base)) {
            $base = [];
        }

        if (is_file($localPath)) {
            $local = require $localPath;
            if (is_array($local)) {
                $base = array_replace_recursive($base, $local);
            }
        }

        $config = $base;
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfg = config()['db'];
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $cfg['host'],
        $cfg['port'],
        $cfg['name'],
        $cfg['charset']
    );

    $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
