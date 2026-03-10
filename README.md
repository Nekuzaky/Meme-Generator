# Meme Creator

Meme Creator is a full web app for creating, editing, saving, and sharing memes from trending templates or custom images.

It started as a school project and has since evolved into a more production-oriented product with accounts, public profiles, cloud drafts, moderation, email flows, and a dedicated PHP API.

Live demo: [https://meme.altcore.fr/](https://meme.altcore.fr/)

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: PHP
- Database: MySQL / MariaDB
- Email: SMTP

## Core Features

- Meme creation from templates or custom uploads
- Text, stickers, layers, positioning, and editing tools
- Image editor with brightness, contrast, rotation, zoom, and effects
- Social-ready export formats
- Drafts, autosave, and profile-based storage
- Public meme publishing with moderation
- Email verification and password reset
- Responsive UI with light and dark themes
- Multi-language interface

## Project Structure

```text
my-app/   Frontend application
api/      PHP API, SQL schema, mail system, and deployment docs
```

## Local Development

### Frontend

```bash
cd my-app
npm install
cp .env.example .env
npm run dev
```

Build for production:

```bash
npm run build
```

### API

The API lives in the `api/` directory.

For private server configuration, use local config files that are not committed to Git:

- `api/config.local.php`
- optional local environment-specific secrets

Safe examples are provided here:

- `api/config.php.exemple`
- `api/config.local.php.exemple`

Read the English setup guide:

- `api/CONFIGURATION.md`

## Database Setup

For a fresh production database, import:

```text
api/install_production.sql
```

For existing installations that only need the email auth upgrade, use:

```text
api/migrate_email_auth.sql
```

## Authentication and Email

The current backend includes:

- account registration
- login
- forgot password
- reset password
- email verification
- welcome emails

Email templates are handled in:

```text
api/lib/mail.php
```

## Deployment

Read the deployment checklist before pushing to production:

- `DEPLOYMENT_CHECKLIST.md`

Important:

- never commit real secrets
- rotate exposed credentials immediately
- keep production config outside Git

## Public Product Direction

The app is being shaped toward a public-facing meme platform with:

- better creator onboarding
- richer template discovery
- stronger account flows
- public sharing and moderation
- premium and creator-oriented features

## License

No public license has been defined yet. Add one before open-sourcing or accepting external contributions.
