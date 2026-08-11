# Squirrel! Dashboard

Squirrel is a calm, sensory-friendly dashboard for tasks, medications, school,
search, and daily planning. Its Google Calendar integration can show upcoming
events and create or update events on calendars the connected user owns.

## Google Calendar setup

1. In Google Cloud Console, enable the **Google Calendar API**.
2. Configure the OAuth consent screen. While the app is in Testing, add Alex's
   Google account as a test user.
3. Add this scope to the consent screen:

   `https://www.googleapis.com/auth/calendar.events.owned`

4. Create an OAuth 2.0 client with application type **Web application**.
5. Add this exact authorized redirect URI:

   `https://squirrel-dashboard-preview.ahertel87.chatgpt.site/api/calendar/oauth/callback`

6. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to the site's production
   runtime environment. Mark the client secret as secret.
7. Add a 32-byte, base64-encoded `GOOGLE_TOKEN_ENCRYPTION_KEY` as a secret. Keep
   the same value across deployments so existing connections remain readable.

The source template is in `.env.example`. Never commit real credentials.

## Security model

- OAuth uses Google's server-side authorization-code flow with offline access.
- A short-lived, single-use state value protects the callback against CSRF.
- Access and refresh tokens are encrypted with AES-256-GCM before D1 storage.
- Calendar connections are keyed to the stable authenticated Squirrel user ID.
- Browser code never receives Google access tokens or the OAuth client secret.
- The app requests only the owned-event scope, not calendar settings, sharing,
  contacts, Drive, or unrestricted calendar administration.

## Local development

Use Node.js 22 or newer, copy `.env.example` to `.env.local`, fill in local test
credentials, and add the local callback URL to the same Google OAuth client.

```bash
npm install
npm run db:generate
npm run dev
```

Useful checks:

```bash
npm run lint
npm test
```
