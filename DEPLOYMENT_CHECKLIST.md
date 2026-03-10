# Deployment Checklist

## Before Push

- Confirm `api/config.local.php` is not tracked by Git.
- Confirm `my-app/.env` is not tracked by Git.
- Rotate any SMTP/IMAP password that has been exposed.
- Verify `api/config.local.php` contains the production DB actually used by the API.
- Verify `api/config.local.php` contains the new mail password after rotation.

## Before Production Deploy

- Rebuild frontend with `npm run build` in `my-app/`.
- Deploy the full `api/` folder.
- Deploy the new frontend `my-app/dist/`.
- Ensure Apache rewrite rules are present for both frontend and API.
- Make sure PHP can write sessions/temp if your host requires it.

## Database

- For a fresh production database: import `api/install_production.sql`.
- For an existing production database: apply targeted migrations first if needed.
- Confirm these tables exist:
  - `users`
  - `auth_tokens`
  - `auth_email_tokens`
  - `memes`
  - `meme_versions`
  - `meme_favorites`
  - `meme_reports`
  - `moderation_blacklist`
  - `api_rate_limits`
  - `consented_visits`

## Production Smoke Tests

- `GET /api/health.php`
- Register a new account
- Receive welcome email
- Verify email from mail link
- Login
- Save a meme
- Autosave a meme
- Publish a public meme from a verified account
- Confirm public verified meme becomes `approved`
- Test password reset email
- Test image export

## Security

- Keep only example config files in Git.
- Keep real passwords only in `config.local.php`.
- Use a long random `security.ip_hash_secret`.
- Restrict `security.admin_emails` to real admins only.
- Rotate credentials immediately if they were pasted into chat, screenshots, tickets, or commits.
