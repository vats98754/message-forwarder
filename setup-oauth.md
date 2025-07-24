# OAuth Setup Guide

To get your message forwarder working with real OAuth authentication, you need to create OAuth applications for each service.

## 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API or People API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
7. Copy your Client ID and Client Secret

## 2. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "Message Forwarder")
4. Go to "OAuth2" → "General"
5. Add redirect URL: `http://localhost:3000/auth/discord/callback`
6. Copy your Client ID and Client Secret

## 3. Slack OAuth Setup

1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Choose app name and workspace
4. Go to "OAuth & Permissions"
5. Add redirect URL: `http://localhost:3000/auth/slack/callback`
6. Add OAuth Scopes:
   - `channels:read`
   - `channels:write`
   - `chat:write`
   - `users:read`
7. Copy your Client ID and Client Secret

## 4. Update Your .env File

Replace the test values in your `.env` file with the real credentials:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here

# Discord OAuth
DISCORD_CLIENT_ID=your_actual_discord_client_id_here
DISCORD_CLIENT_SECRET=your_actual_discord_client_secret_here

# Slack OAuth
SLACK_CLIENT_ID=your_actual_slack_client_id_here
SLACK_CLIENT_SECRET=your_actual_slack_client_secret_here

# Server Configuration
PORT=3000
SESSION_SECRET=your_session_secret_here
NODE_ENV=development
```

## 5. Test Your Setup

1. Run `npm run dev`
2. Go to `http://localhost:3000`
3. Try connecting each service
4. You should be redirected to the OAuth provider and then back to your app

## For Development Testing (Quick Start)

If you want to test with demo credentials first, I can help you set up a basic test environment with mock authentication.
