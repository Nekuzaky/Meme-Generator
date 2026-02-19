# Meme Generator API (PHP)

API backend for `meme.altcore.fr/api/`.

## Setup

1. Import `schema.sql` into your MySQL database.
2. Deploy this folder as `/api`.
3. Ensure PHP has PDO MySQL enabled.
4. If using Apache, keep `.htaccess` for routing.
5. Copy `config.php.exemple` to `config.php` and fill credentials.
6. Set a long random value for `security.ip_hash_secret` in `config.php`.
7. Set `security.admin_emails` for moderation access.
8. Optional AI: set `ai.openai_api_key` (fallback local generator works without key).

## Auth flow

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout` (Bearer token)
- `GET /api/me` (Bearer token)

Use header:

```http
Authorization: Bearer <token>
```

## Meme routes

- `GET /api/memes/public`
- `GET /api/memes` (mine, auth)
- `POST /api/memes` (auth)
- `POST /api/memes/autosave` (auth)
- `GET /api/memes/{id}`
- `PUT /api/memes/{id}` (owner)
- `DELETE /api/memes/{id}` (owner)
- `POST /api/memes/{id}/favorite` (auth)
- `DELETE /api/memes/{id}/favorite` (auth)
- `POST /api/memes/{id}/report` (auth)
- `GET /api/memes/{id}/versions` (owner/admin)
- `POST /api/memes/{id}/versions` (owner/admin)
- `POST /api/memes/{id}/restore/{version_id}` (owner/admin)
- `GET /api/me/favorites` (auth)
- `POST /api/telemetry/visit` (consent required)
- `POST /api/ai/meme-suggestions`

## Moderation routes (admin)

- `GET /api/moderation/memes?status=pending`
- `PATCH /api/moderation/memes/{id}` with `status: pending|approved|rejected`
- `GET /api/moderation/reports?status=open`
- `PATCH /api/moderation/reports/{id}` with `status: open|reviewed|dismissed`
- `GET /api/moderation/blacklist`
- `POST /api/moderation/blacklist`
- `DELETE /api/moderation/blacklist/{id}`

## Security notes

- Tokens are random and only stored as SHA-256 hashes.
- Authentication and write actions are rate-limited.
- API sends security headers (`nosniff`, `frame deny`, HSTS on HTTPS).
- Telemetry stores `ip_hash` (HMAC) instead of raw IP.
- Public feed only shows `is_public=1` and `moderation_status=approved`.

## Example payload (create meme)

```json
{
  "title": "Drake format",
  "description": "Version avec stickers",
  "source_image_url": "https://i.imgflip.com/30b1gx.jpg",
  "generated_image_url": "https://cdn.example.com/meme.png",
  "payload": {
    "boxes": [],
    "textLayers": [],
    "stickers": []
  },
  "tags": ["reaction", "classic"],
  "is_public": true
}
```
