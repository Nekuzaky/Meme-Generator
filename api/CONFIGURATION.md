# API Configuration Guide

This document explains which files are safe to commit and which files must stay private.

## Safe To Commit

- `api/config.php.exemple`
- `api/config.local.php.exemple`
- `api/README.md`
- `api/install_production.sql`

These files should only contain placeholders or non-sensitive defaults.

## Must Never Be Committed

- `api/config.php`
- `api/config.local.php`
- any file containing real database passwords
- any file containing real SMTP or IMAP passwords
- any file containing API secrets or admin-only tokens

## Recommended Setup

1. Copy `config.php.exemple` to `config.php`
2. Copy `config.local.php.exemple` to `config.local.php`
3. Keep real secrets only in `config.local.php`
4. Keep `config.local.php` ignored by Git

## Important Keys

### Database

- `db.host`
- `db.port`
- `db.name`
- `db.user`
- `db.pass`

These must match the exact database used by your production API.

### App

- `app.public_base_url`

Used for canonical URLs, OG rendering, and email links.

### Mail

- `mail.enabled`
- `mail.from_email`
- `mail.smtp.host`
- `mail.smtp.port`
- `mail.smtp.username`
- `mail.smtp.password`

### Security

- `security.ip_hash_secret`
- `security.admin_emails`

Use a long random secret in production. Do not reuse placeholders.

## If Credentials Were Exposed

Rotate them immediately:

- mailbox password
- SMTP password
- IMAP password
- database password if it was exposed too

Then update `config.local.php` and redeploy the API.
