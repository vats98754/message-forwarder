# Message Forwarder

A free, modern, and easy-to-use open source Android app for forwarding messages from various sources (SMS, MMS, email, social media notifications) to different destinations.

## Features

- **Universal Message Forwarding**: Forward SMS, MMS, and notifications from popular apps
- **Multiple Sources**: Support for SMS, WhatsApp, Telegram, Instagram, Facebook Messenger, Discord, Slack, and more
- **Flexible Destinations**: Forward to email, webhooks, or Telegram bots
- **Smart Filtering**: Filter by sender, keywords, or specific apps
- **Modern UI**: Beautiful Material Design 3 interface
- **Privacy First**: All processing happens locally on your device
- **Free & Open Source**: No ads, no tracking, no data collection

## Supported Sources

- SMS & MMS messages
- WhatsApp notifications
- Telegram notifications  
- Instagram notifications
- Facebook Messenger notifications
- Discord notifications
- Slack notifications
- All app notifications (configurable)

## Forwarding Destinations

- **Email**: Forward messages to any email address
- **Webhooks**: Send JSON payloads to custom endpoints
- **Telegram**: Forward to Telegram bots/channels

## Requirements

- Android 7.0 (API level 24) or higher
- SMS permission for SMS/MMS forwarding
- Notification access permission for app notifications

## Installation

### From APK (Recommended)
1. Download the latest APK from the [Releases](https://github.com/yourusername/message-forwarder/releases) page
2. Install the APK on your Android device
3. Grant the required permissions when prompted

### From Source
1. Clone this repository
2. Open in Android Studio
3. Build and install on your device

## Setup

1. **Install the app** and open it
2. **Grant permissions** when prompted:
   - SMS permissions for SMS/MMS forwarding
   - Notification access for app notifications
3. **Create forwarding rules**:
   - Tap the + button to create a new rule
   - Select message source (SMS, WhatsApp, etc.)
   - Configure filters (optional)
   - Set forwarding destination(s)
   - Save the rule
4. **Test your setup** by sending a test message

## Usage Examples

### Forward WhatsApp messages to Email
1. Create a new rule
2. Select "WhatsApp" as source
3. Enter your email address
4. Save the rule

### Forward urgent SMS to Telegram
1. Create a new rule
2. Select "SMS" as source
3. Add "urgent" as a keyword filter
4. Enter your Telegram bot token and chat ID
5. Save the rule

### Forward all notifications to a webhook
1. Create a new rule
2. Select "All Notifications" as source
3. Enter your webhook URL
4. Save the rule

## Privacy & Security

- **Local Processing**: All message processing happens on your device
- **No Data Collection**: We don't collect, store, or transmit your personal data
- **Open Source**: Full source code is available for audit
- **Minimal Permissions**: Only requests permissions necessary for functionality

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Support

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions or share ideas
- **Email**: support@messageforwarder.app

## Roadmap

- [ ] Email source support
- [ ] Custom notification templates
- [ ] Scheduling and rate limiting
- [ ] Backup/restore rules
- [ ] Multi-language support
- [ ] Dark/light theme toggle

## Disclaimer

This app processes sensitive message data. Please ensure you comply with all applicable laws and regulations regarding message forwarding and privacy in your jurisdiction.

---

Made with ❤️ for the open source community

## Getting Started

### Prerequisites

- Android Studio
- Kotlin support

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/message-forwarder.git
   ```

2. Open the project in Android Studio.

3. Sync the project with Gradle files.

4. Build and run the application on an Android device or emulator.

### Usage

- Launch the app and navigate to the settings to configure permissions.
- Create forwarding rules in the rules section.
- The app will automatically forward messages based on the defined rules.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.