# Squirrel Mobile

Expo/React Native companion app for Squirrel. This scaffold targets iPhone, iPad, and Android from one codebase and talks to the Flask API in the repository root.

## What is included

- Login and sign-up
- Synced medication list
- Daily medication check-ins
- Synced task list
- Energy labels and task breakdown steps
- Focus timer
- Visual routines
- Sensory-friendly settings
- Shared support-state sync through `/api/support_state/`
- Tablet-aware iPad layout with wider content, two-column panels, and rotation support

## Demo Account

- Email: `demo@squirrel.app`
- Password: `SquirrelDemo2026!`

## Run locally

1. Start the Flask backend from the repo root:

   ```bash
   flask run --port 5001
   ```

2. Install mobile dependencies:

   ```bash
   cd mobile-app
   npm install
   ```

3. Start Expo:

   ```bash
   npm start
   ```

For the iOS simulator, `http://localhost:5001` should reach the Mac host backend.

For Android emulator, use:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5001 npm start
```

For a physical phone, replace the API base URL with your MacBook's LAN IP, for example:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:5001 npm start
```

## Store-readiness notes

This is a mobile product scaffold, not an App Store submission build yet. Before release, add production auth/session handling, privacy policy, account deletion, app icons, screenshots, subscription flows, and final device QA.
