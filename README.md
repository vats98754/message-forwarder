# MessageForge - Universal Message Bridge 🚀

A modern message forwarding app that connects different communication services together. Forward messages between Email, SMS, Discord, Slack, and more.

## Features

- **Universal Routing**: Connect any service to any other (Email ↔ SMS ↔ Discord ↔ Slack)
- **OAuth Authentication**: Secure login with Google, Discord, and Slack
- **Route Management**: Create custom forwarding rules between services
- **Real-time Forwarding**: Instant message delivery across platforms
- **Clean UI**: Modern design with glass morphism effects
- **Demo**: Try it at [GitHub Pages](https://vats98754.github.io/message-forwarder/)## Supported Services

| Service | Setup | Status |
|---------|-------|--------|
| Email | SMTP credentials | ✅ |
| SMS | Twilio API | ✅ |
| Discord | OAuth2 or Bot token | ✅ |
| Telegram | Bot token | ✅ |
| Slack | OAuth2 | ✅ |
| Textbelt | API key | ✅ |## Getting Started

### 1. Installation

```bash
git clone https://github.com/vats98754/message-forwarder.git
cd message-forwarder
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Configure OAuth Apps

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable Google+ API
3. Create OAuth2 credentials
4. Add callback: `http://localhost:3000/auth/google/callback`

**Discord:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create app → OAuth2 → Add redirect: `http://localhost:3000/auth/discord/callback`

**Slack:**
1. Go to [Slack API](https://api.slack.com/apps)
2. Create app → OAuth & Permissions
3. Add redirect: `http://localhost:3000/auth/slack/callback`
4. Add scopes: `chat:write`, `channels:read`, `groups:read`### 4. Run the App

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Open `http://localhost:3000` and start connecting services!

## How It Works

1. Sign in with Google
2. Connect your services (Discord, Slack, etc.)
3. Create forwarding routes (e.g., Discord → Email)
4. Messages automatically forward between services

## Examples

**Discord to Email:** Messages from Discord channel get emailed to you

**SMS to Slack:** Text messages appear in your Slack channel

**Email to Discord:** Important emails post to Discord server## Development

```
src/
├── index.ts              # Main server
├── services/
│   ├── auth.ts          # OAuth handling
│   └── forwarders.ts    # Message forwarding
└── public/              # Frontend files
```

## API

- `GET /api/user` - Current user
- `GET /api/services` - Connected services
- `GET /api/routes` - Message routes
- `POST /api/routes` - Create route
- `DELETE /api/routes/:id` - Delete route

## License

MIT