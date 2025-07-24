import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import TelegramBot from 'node-telegram-bot-api';
import { WebClient } from '@slack/web-api';
import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import logger from '../logger';

export interface ForwardingService {
  name: string;
  enabled: boolean;
  forward(message: string, from: string): Promise<void>;
}

export class EmailForwarder implements ForwardingService {
  name = 'Email';
  enabled: boolean;
  private transporter?: nodemailer.Transporter;
  private target: string;

  constructor() {
    this.enabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.FORWARD_EMAIL_TO);
    this.target = process.env.FORWARD_EMAIL_TO!;
    
    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async forward(message: string, from: string): Promise<void> {
    if (!this.enabled || !this.transporter) throw new Error('Email forwarding not configured');
    
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: this.target,
      subject: `Forwarded message from ${from}`,
      text: `From: ${from}\n\n${message}`,
    });
    logger.info(`Message forwarded to email: ${this.target}`);
  }
}

export class SMSForwarder implements ForwardingService {
  name = 'SMS';
  enabled: boolean;
  private twilio?: Twilio;
  private fromNumber: string;
  private target: string;

  constructor() {
    this.enabled = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.FORWARD_SMS_TO && process.env.SKIP_TWILIO !== 'true');
    this.target = process.env.FORWARD_SMS_TO!;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER!;
    
    if (this.enabled) {
      this.twilio = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
  }

  async forward(message: string, from: string): Promise<void> {
    if (!this.enabled || !this.twilio) throw new Error('SMS forwarding not configured');
    
    await this.twilio.messages.create({
      body: `Forwarded from ${from}: ${message}`,
      from: this.fromNumber,
      to: this.target,
    });
    logger.info(`Message forwarded to SMS: ${this.target}`);
  }
}

export class DiscordForwarder implements ForwardingService {
  name = 'Discord';
  enabled: boolean;
  private client?: Client;
  private channelId: string;

  constructor() {
    this.enabled = !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID);
    this.channelId = process.env.DISCORD_CHANNEL_ID!;
    
    if (this.enabled) {
      this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
      this.client.login(process.env.DISCORD_BOT_TOKEN);
    }
  }

  async forward(message: string, from: string): Promise<void> {
    if (!this.enabled || !this.client) throw new Error('Discord forwarding not configured');
    
    const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
    await channel.send(`**Forwarded from ${from}:**\n${message}`);
    logger.info(`Message forwarded to Discord channel: ${this.channelId}`);
  }
}

export class TelegramForwarder implements ForwardingService {
  name = 'Telegram';
  enabled: boolean;
  private bot?: TelegramBot;
  private chatId: string;

  constructor() {
    this.enabled = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
    this.chatId = process.env.TELEGRAM_CHAT_ID!;
    
    if (this.enabled) {
      this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });
    }
  }

  async forward(message: string, from: string): Promise<void> {
    if (!this.enabled || !this.bot) throw new Error('Telegram forwarding not configured');
    
    await this.bot.sendMessage(this.chatId, `*Forwarded from ${from}:*\n${message}`, { parse_mode: 'Markdown' });
    logger.info(`Message forwarded to Telegram chat: ${this.chatId}`);
  }
}

export class SlackForwarder implements ForwardingService {
  name = 'Slack';
  enabled: boolean;
  private client?: WebClient;
  private channel: string;

  constructor() {
    this.enabled = !!(process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL);
    this.channel = process.env.SLACK_CHANNEL!;
    
    if (this.enabled) {
      this.client = new WebClient(process.env.SLACK_BOT_TOKEN);
    }
  }

  async forward(message: string, from: string): Promise<void> {
    if (!this.enabled || !this.client) throw new Error('Slack forwarding not configured');
    
    await this.client.chat.postMessage({
      channel: this.channel,
      text: `*Forwarded from ${from}:*\n${message}`,
    });
    logger.info(`Message forwarded to Slack channel: ${this.channel}`);
  }
}

export class TextbeltForwarder implements ForwardingService {
  name = 'Textbelt';
  enabled: boolean;
  private apiKey: string;
  private target: string;

  constructor() {
    this.enabled = !!(process.env.TEXTBELT_API_KEY && process.env.FORWARD_SMS_TO);
    this.apiKey = process.env.TEXTBELT_API_KEY!;
    this.target = process.env.FORWARD_SMS_TO!;
  }

  async forward(message: string, from: string): Promise<void> {
    if (!this.enabled) throw new Error('Textbelt forwarding not configured');
    
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: this.target,
        message: `Forwarded from ${from}: ${message}`,
        key: this.apiKey,
      }),
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(`Textbelt error: ${result.error}`);
    }
    
    logger.info(`Message forwarded via Textbelt to: ${this.target}`);
  }
}

export class ForwardingManager {
  private services: ForwardingService[] = [
    new EmailForwarder(),
    new SMSForwarder(),
    new TextbeltForwarder(),
    new DiscordForwarder(),
    new TelegramForwarder(),
    new SlackForwarder(),
  ];

  getAvailableServices() {
    return this.services.map(s => ({ name: s.name, enabled: s.enabled }));
  }

  async forwardToAll(message: string, from: string, excludeServices: string[] = []): Promise<void> {
    const promises = this.services
      .filter(s => s.enabled && !excludeServices.includes(s.name))
      .map(async (service) => {
        try {
          await service.forward(message, from);
        } catch (error) {
          logger.error(`Failed to forward to ${service.name}: ${error}`);
        }
      });

    await Promise.all(promises);
  }

  async forwardTo(serviceName: string, message: string, from: string): Promise<void> {
    const service = this.services.find(s => s.name === serviceName);
    if (!service || !service.enabled) {
      throw new Error(`Service ${serviceName} not available`);
    }
    
    await service.forward(message, from);
  }
}
