# Message Forwarder

A minimal open-source message forwarding app built in TypeScript.

## Features
- Forward incoming SMS to a configured number (via Twilio)
- Forward incoming emails to a configured address (via SMTP)
- Easy configuration via `.env`
- Simple web UI

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd message-forwarder
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your credentials.
4. Build the project:
   ```bash
   npm run build
   ```
5. Start the server:
   ```bash
   npm start
   ```

Or in development mode:
```bash
npm run dev
```

## Usage
- Configure your Twilio webhook for SMS to `POST /api/sms`
- Configure your email webhook to `POST /api/email`
- Open `http://localhost:3000` for the simple UI

## License
MIT
