<?php

declare(strict_types=1);

function mail_cfg(): array
{
    $cfg = config()['mail'] ?? [];
    $smtp = $cfg['smtp'] ?? [];
    $imap = $cfg['imap'] ?? [];

    return [
        'enabled' => (bool) ($cfg['enabled'] ?? false),
        'from_email' => trim((string) ($cfg['from_email'] ?? '')),
        'from_name' => trim((string) ($cfg['from_name'] ?? 'Meme Generator')),
        'support_to' => trim((string) ($cfg['support_to'] ?? '')),
        'reply_to' => trim((string) ($cfg['reply_to'] ?? '')),
        'smtp' => [
            'host' => trim((string) ($smtp['host'] ?? '')),
            'port' => max(1, (int) ($smtp['port'] ?? 587)),
            'username' => trim((string) ($smtp['username'] ?? '')),
            'password' => (string) ($smtp['password'] ?? ''),
            'encryption' => strtolower(trim((string) ($smtp['encryption'] ?? 'starttls'))),
            'timeout' => max(5, (int) ($smtp['timeout'] ?? 15)),
        ],
        // Kept for future incoming mailbox integrations.
        'imap' => [
            'host' => trim((string) ($imap['host'] ?? '')),
            'port' => max(1, (int) ($imap['port'] ?? 993)),
            'username' => trim((string) ($imap['username'] ?? '')),
            'password' => (string) ($imap['password'] ?? ''),
            'encryption' => strtolower(trim((string) ($imap['encryption'] ?? 'ssl'))),
        ],
    ];
}

function mail_validate_email(string $email): bool
{
    if (str_contains($email, "\r") || str_contains($email, "\n")) {
        return false;
    }
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function mail_header_value(string $value): string
{
    $clean = str_replace(["\r", "\n"], ' ', trim($value));
    return preg_replace('/\s+/', ' ', $clean) ?? $clean;
}

function mail_encode_header(string $value): string
{
    $clean = mail_header_value($value);
    if ($clean === '') {
        return '';
    }

    if (preg_match('/^[\x20-\x7E]+$/', $clean) === 1) {
        return $clean;
    }

    return '=?UTF-8?B?' . base64_encode($clean) . '?=';
}

function smtp_read_response($socket): string
{
    $response = '';
    while (!feof($socket)) {
        $line = fgets($socket, 4096);
        if ($line === false) {
            break;
        }
        $response .= $line;
        // End of multi-line SMTP response: "250 " instead of "250-".
        if (preg_match('/^\d{3}\s/', $line) === 1) {
            break;
        }
    }

    return trim($response);
}

function smtp_response_code(string $response): int
{
    if (preg_match('/^(\d{3})/', $response, $m) !== 1) {
        return 0;
    }
    return (int) $m[1];
}

function smtp_write($socket, string $line): void
{
    $bytes = fwrite($socket, $line . "\r\n");
    if ($bytes === false) {
        throw new RuntimeException('SMTP write failed');
    }
}

function smtp_command($socket, string $line, array $allowedCodes): string
{
    smtp_write($socket, $line);
    $response = smtp_read_response($socket);
    $code = smtp_response_code($response);
    if (!in_array($code, $allowedCodes, true)) {
        throw new RuntimeException('SMTP error on "' . $line . '": ' . $response);
    }
    return $response;
}

function smtp_open(array $smtp): array
{
    $host = $smtp['host'];
    $port = (int) $smtp['port'];
    $timeout = (int) $smtp['timeout'];
    $enc = $smtp['encryption'];

    if ($host === '' || $port <= 0) {
        throw new RuntimeException('SMTP host/port missing');
    }

    $transport = $enc === 'ssl' ? 'ssl://' : 'tcp://';
    $remote = $transport . $host . ':' . $port;

    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'allow_self_signed' => false,
        ],
    ]);

    $errno = 0;
    $errstr = '';
    $socket = @stream_socket_client(
        $remote,
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if ($socket === false) {
        throw new RuntimeException('SMTP connection failed: ' . $errstr . ' (' . $errno . ')');
    }

    stream_set_timeout($socket, $timeout);

    $hello = preg_replace('/[^a-zA-Z0-9\.\-]/', '', parse_url(config()['app']['public_base_url'] ?? '', PHP_URL_HOST) ?? '');
    if (!is_string($hello) || $hello === '') {
        $hello = 'meme.altcore.fr';
    }

    $greeting = smtp_read_response($socket);
    if (!in_array(smtp_response_code($greeting), [220], true)) {
        fclose($socket);
        throw new RuntimeException('SMTP greeting failed: ' . $greeting);
    }

    smtp_command($socket, 'EHLO ' . $hello, [250]);

    if ($enc === 'starttls') {
        smtp_command($socket, 'STARTTLS', [220]);
        $cryptoOk = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if ($cryptoOk !== true) {
            fclose($socket);
            throw new RuntimeException('Unable to enable STARTTLS');
        }
        smtp_command($socket, 'EHLO ' . $hello, [250]);
    }

    $username = (string) ($smtp['username'] ?? '');
    $password = (string) ($smtp['password'] ?? '');
    if ($username !== '') {
        smtp_command($socket, 'AUTH LOGIN', [334]);
        smtp_command($socket, base64_encode($username), [334]);
        smtp_command($socket, base64_encode($password), [235]);
    }

    return [$socket, $hello];
}

function smtp_send_email(array $smtp, array $message): void
{
    [$socket] = smtp_open($smtp);

    try {
        smtp_command($socket, 'MAIL FROM:<' . $message['from_email'] . '>', [250]);
        smtp_command($socket, 'RCPT TO:<' . $message['to_email'] . '>', [250, 251]);
        smtp_command($socket, 'DATA', [354]);

        $data = str_replace("\r\n", "\n", $message['data']);
        $data = str_replace("\r", "\n", $data);
        $data = str_replace("\n", "\r\n", $data);
        // SMTP transparency.
        $data = preg_replace('/(^|\r\n)\./', '$1..', $data) ?? $data;

        smtp_write($socket, $data . "\r\n.");
        $response = smtp_read_response($socket);
        if (!in_array(smtp_response_code($response), [250], true)) {
            throw new RuntimeException('SMTP DATA failed: ' . $response);
        }

        try {
            smtp_command($socket, 'QUIT', [221, 250]);
        } catch (Throwable $e) {
            // Ignore quit errors.
        }
    } finally {
        fclose($socket);
    }
}

function send_app_email(array $payload): void
{
    $cfg = mail_cfg();
    if (!$cfg['enabled']) {
        throw new RuntimeException('Mail service is disabled');
    }

    $fromEmail = mail_header_value((string) ($payload['from_email'] ?? $cfg['from_email']));
    $fromName = mail_header_value((string) ($payload['from_name'] ?? $cfg['from_name']));
    $toEmail = mail_header_value((string) ($payload['to_email'] ?? ''));
    $toName = mail_header_value((string) ($payload['to_name'] ?? ''));
    $replyTo = mail_header_value((string) ($payload['reply_to'] ?? $cfg['reply_to']));
    $subject = mail_header_value((string) ($payload['subject'] ?? ''));
    $text = (string) ($payload['text'] ?? '');
    $html = (string) ($payload['html'] ?? nl2br(htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')));

    if (!mail_validate_email($fromEmail) || !mail_validate_email($toEmail)) {
        throw new RuntimeException('Invalid sender or recipient email');
    }
    if ($replyTo !== '' && !mail_validate_email($replyTo)) {
        throw new RuntimeException('Invalid reply-to email');
    }
    if ($subject === '') {
        throw new RuntimeException('Missing email subject');
    }

    $fromHeader = mail_encode_header($fromName);
    $toHeader = $toName !== '' ? mail_encode_header($toName) . ' <' . $toEmail . '>' : '<' . $toEmail . '>';
    $subjectHeader = mail_encode_header($subject);

    $domain = substr(strrchr($fromEmail, '@') ?: '', 1);
    if ($domain === '') {
        $domain = 'meme.altcore.fr';
    }
    $messageId = '<' . bin2hex(random_bytes(12)) . '@' . $domain . '>';
    $boundary = 'bnd_' . bin2hex(random_bytes(16));

    $headers = [
        'Date: ' . gmdate('D, d M Y H:i:s O'),
        'Message-ID: ' . $messageId,
        'From: ' . ($fromHeader !== '' ? $fromHeader . ' ' : '') . '<' . $fromEmail . '>',
        'To: ' . $toHeader,
        'Subject: ' . $subjectHeader,
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];
    if ($replyTo !== '') {
        $headers[] = 'Reply-To: <' . $replyTo . '>';
    }

    $data = implode("\r\n", $headers)
        . "\r\n\r\n"
        . '--' . $boundary . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n\r\n"
        . $text . "\r\n\r\n"
        . '--' . $boundary . "\r\n"
        . "Content-Type: text/html; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n\r\n"
        . $html . "\r\n\r\n"
        . '--' . $boundary . "--\r\n";

    smtp_send_email($cfg['smtp'], [
        'from_email' => $fromEmail,
        'to_email' => $toEmail,
        'data' => $data,
    ]);
}
