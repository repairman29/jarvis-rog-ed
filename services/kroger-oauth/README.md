# Kroger OAuth Service

Hosted OAuth callback service for Kroger API with automatic token refresh.

## Features

- **Hosted OAuth callback** - No localhost needed
- **Multi-user support** - Each user gets their own tokens
- **Automatic token refresh** - Weekly cron job keeps tokens alive
- **Supabase storage** - Persistent, scalable token storage

## Deploy to Railway

### 1. Create Supabase Table

Run `supabase-migration.sql` in your Supabase SQL editor.

### 2. Set Environment Variables in Railway

```
KROGER_CLIENT_ID=your_client_id
KROGER_CLIENT_SECRET=your_client_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SERVICE_URL=https://your-app.railway.app
KROGER_SERVICE_SECRET=generate_a_random_secret
```

### 3. Update Kroger Developer Portal

Add the callback URL to your Kroger app:
```
https://your-app.railway.app/callback
```

### 4. Deploy

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## API Endpoints

### Public

- `GET /` - Health check
- `GET /auth/url?user_id=xxx` - Get OAuth URL for a user
- `GET /callback` - OAuth callback (redirected from Kroger)

### Authenticated (requires `X-API-Secret` header)

- `GET /api/status/:userId` - Check if user is connected
- `GET /api/token/:userId` - Get access token for user
- `PUT /api/cart/:userId/add` - Add items to user's cart
- `DELETE /api/token/:userId` - Disconnect user

## Local Development

```bash
npm install

# Create .env file
cat > .env << EOF
KROGER_CLIENT_ID=your_client_id
KROGER_CLIENT_SECRET=your_client_secret
KROGER_SERVICE_SECRET=dev-secret
SERVICE_URL=http://localhost:3000
EOF

npm start
```

## Integration with Jarvis

The Kroger skill can use this service instead of local tokens:

```javascript
// In skill config
KROGER_SERVICE_URL=https://your-app.railway.app
KROGER_SERVICE_SECRET=your_secret
```

When a user tries to add to cart:
1. Skill calls service to get access token
2. If not authorized, service returns auth URL
3. User clicks URL, logs into Kroger
4. Service stores token, user can now add to cart
