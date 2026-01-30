# Olive E2E Tests (Playwright)

## Run all tests

```bash
npm run test:e2e
```

Uses `http://localhost:3001` (starts dev server if not running).

## Run with UI

```bash
npm run test:e2e:ui
```

## Authenticated dashboard tests

Four tests (Budget/Splurge toggle, add item, quick add) require a signed-in user. Set env and run:

```bash
TEST_USER_EMAIL=you@example.com TEST_USER_PASSWORD=yourpassword npm run test:e2e
```

Use a real Supabase user; tests will sign in and then run dashboard flows.

## What’s covered

- **Home**: Olive branding, CTAs (Join the Beta, Continue with Kroger, View Kroger Cart), How it Works, FAQ, Kroger family
- **Login**: Form, Continue with Kroger link, `?then=connect` message, sign in / create account toggle, invalid creds stay on login
- **Dashboard (unauthenticated)**: Redirect to login when not signed in
- **Dashboard (authenticated, optional)**: Olive UI, Budget vs Splurge, add/remove item, quick add
