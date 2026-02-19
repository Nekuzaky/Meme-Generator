# Meme Generator API (PHP)

API backend for `meme.altcore.fr/api/`.

## Setup

1. Import `insert_in_your_db.sql` into your MySQL database.
2. Deploy this folder as `/api`.
3. Ensure PHP has PDO MySQL enabled.
4. If using Apache, keep `.htaccess` for routing.
5. Copy `config.php.exemple` to `config.php` and fill credentials.

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
- `GET /api/memes/{id}`
- `PUT /api/memes/{id}` (owner)
- `DELETE /api/memes/{id}` (owner)
- `POST /api/memes/{id}/favorite` (auth)
- `DELETE /api/memes/{id}/favorite` (auth)
- `GET /api/me/favorites` (auth)

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
