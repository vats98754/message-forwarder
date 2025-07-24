# 🚀 Message Forwarder

A modern, universal message forwarding application that bridges all your communication channels. Forward messages seamlessly between SMS, Email, Discord, Telegram, Slack, and more.

![Demo](https://via.placeholder.com/800x400/667eea/ffffff?text=Message+Forwarder+Demo)

## ✨ Features

- 📧 **Email Forwarding** - SMTP/Gmail integration
- 📱 **SMS/MMS** - Twilio & Textbelt support  
- 💬 **Discord** - Bot integration with channels
- 📢 **Telegram** - Bot messaging
- 💼 **Slack** - Workspace integration
- 🔐 **Google OAuth** - Secure authentication
- 🎨 **Modern UI** - Responsive, glass-morphism design
- 📊 **Real-time Status** - Service health monitoring
- 🔄 **Broadcast Mode** - Send to all services at once
- 🛡️ **Type-Safe** - Built with TypeScript

## 🌐 Live Demo

Check out the live demo: [Message Forwarder Demo](https://vats98754.github.io/message-forwarder)

> **Note**: The demo shows the frontend interface. Full functionality requires running the backend locally.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Various API keys (see Configuration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vats98754/message-forwarder.git
   cd message-forwarder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Build and run**
   ```bash
   npm run build
   npm start
   ```

Visit `http://localhost:3000` to access the application.

## ⚙️ Configuration

### Required Environment Variables

```bash
# Server Configuration
PORT=3000
SESSION_SECRET=your_random_secret_key

# Email (SMTP) - Required for email forwarding
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FORWARD_EMAIL_TO=destination@example.com

# Google OAuth (Optional - for authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
FORWARD_SMS_TO=+1987654321
SKIP_TWILIO=true  # Set to true for development

# Textbelt SMS (Free alternative to Twilio)
TEXTBELT_API_KEY=your_textbelt_key

# Discord Bot (Optional)
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=your_channel_id

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Slack Bot (Optional)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL=#your-channel
```

### Service Setup Guides

<details>
<summary>📧 Gmail Setup</summary>

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings → Security → App passwords
   - Generate password for "Mail"
   - Use this as `SMTP_PASS`

</details>

<details>
<summary>📱 Twilio Setup</summary>

1. Create account at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token from dashboard
3. Buy a phone number or use trial number
4. Set webhook URL to `https://yourapp.com/api/sms`

</details>

<details>
<summary>💬 Discord Bot Setup</summary>

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application → Bot
3. Copy Bot Token
4. Invite bot to your server with "Send Messages" permission
5. Get Channel ID (Developer Mode → Right-click channel → Copy ID)

</details>

<details>
<summary>📢 Telegram Bot Setup</summary>

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create new bot with `/newbot`
3. Get bot token
4. Get your chat ID by messaging [@userinfobot](https://t.me/userinfobot)

</details>

<details>
<summary>💼 Slack Bot Setup</summary>

1. Go to [Slack API](https://api.slack.com/apps)
2. Create New App → From scratch
3. Add Bot Token Scopes: `chat:write`, `channels:read`
4. Install app to workspace
5. Copy Bot User OAuth Token

</details>

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/services` | List available services and their status |
| `POST` | `/api/forward/:service` | Forward message to specific service |
| `POST` | `/api/broadcast` | Broadcast message to all enabled services |
| `POST` | `/api/sms` | Legacy SMS webhook (Twilio) |
| `POST` | `/api/email` | Legacy email webhook |
| `GET` | `/api/user` | Get current user authentication status |

### Examples

**Forward to Discord:**
```bash
curl -X POST http://localhost:3000/api/forward/Discord \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World!", "from": "user@example.com"}'
```

**Broadcast to all services:**
```bash
curl -X POST http://localhost:3000/api/broadcast \
  -H "Content-Type: application/json" \
  -d '{"message": "Emergency alert!", "from": "system@example.com"}'
```

## 🏗️ Architecture

```
src/
├── index.ts              # Express server & routes
├── logger.ts             # Winston logging configuration  
├── services/
│   └── forwarders.ts     # Service implementations
├── types/express/
│   └── index.d.ts        # TypeScript declarations
└── public/
    ├── index.html        # Modern frontend interface
    └── app.js            # Frontend JavaScript
```

### Technology Stack

- **Backend**: Node.js, Express, TypeScript
- **Authentication**: Passport.js, Google OAuth2
- **Logging**: Winston
- **Frontend**: Vanilla JS, TailwindCSS
- **Deployment**: GitHub Actions, GitHub Pages

## 🚢 Deployment

### Local Development

```bash
npm run dev    # Start with ts-node
npm run build  # Compile TypeScript
npm start      # Run compiled version
```

### Production Deployment

1. **Heroku**
   ```bash
   heroku create your-app-name
   heroku config:set SESSION_SECRET=your_secret
   # Set other environment variables
   git push heroku main
   ```

2. **Railway**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **DigitalOcean App Platform**
   - Connect GitHub repository
   - Set environment variables in dashboard
   - Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] WhatsApp Business API integration
- [ ] Twitter/X API support
- [ ] Message templates and scheduling
- [ ] Web dashboard for configuration
- [ ] Docker containerization
- [ ] Kubernetes deployment configs
- [ ] Message filtering and routing rules
- [ ] Analytics and reporting
- [ ] Multi-tenant support

## ⭐ Support

If you find this project helpful, please give it a star on GitHub!

---

Built with ❤️ by [vats98754](https://github.com/vats98754)
