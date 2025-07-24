import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import TelegramBot from 'node-telegram-bot-api';
import { WebClient } from '@slack/web-api';
import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import logger from '../logger';

export interface ForwardingService {
  name: string;
  enabled: boolean;
  connected: boolean;
  forward(message: string, from: string): Promise<void>;
  connect?(config: any): Promise<void>;
  test?(): Promise<boolean>;
  getConfigRequirements?(): any;
}

export interface MessageRoute {
  id: string;
  from: string;
  to: string;
  enabled: boolean;
  createdAt: Date;
}

export class EmailForwarder implements ForwardingService {
  name = 'Email';
  enabled: boolean;
  connected: boolean = false;
  private transporter?: nodemailer.Transporter;
  private target: string;

  constructor() {
    this.enabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.FORWARD_EMAIL_TO);
    this.target = process.env.FORWARD_EMAIL_TO!;
    
    if (this.enabled) {
      this.setupTransporter();
    }
  }

  private setupTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.connected = true;
  }

  async connect(config: { host: string; port: number; user: string; pass: string; to: string }) {
    // Update environment or instance variables
    process.env.SMTP_HOST = config.host;
    process.env.SMTP_PORT = config.port.toString();
    process.env.SMTP_USER = config.user;
    process.env.SMTP_PASS = config.pass;
    process.env.FORWARD_EMAIL_TO = config.to;
    
    this.target = config.to;
    this.setupTransporter();
    this.enabled = true;
    
    // Test the connection
    await this.test();
  }

  async test(): Promise<boolean> {
    if (!this.transporter) throw new Error('Email not configured');
    
    try {
      await this.transporter.verify();
      this.connected = true;
      return true;
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  getConfigRequirements() {
    return {
      fields: [
        { name: 'host', type: 'text', label: 'SMTP Host', required: true, placeholder: 'smtp.gmail.com' },
        { name: 'port', type: 'number', label: 'SMTP Port', required: true, placeholder: '587' },
        { name: 'user', type: 'email', label: 'Email Address', required: true, placeholder: 'your@email.com' },
        { name: 'pass', type: 'password', label: 'Email Password/App Password', required: true },
        { name: 'to', type: 'email', label: 'Forward To Email', required: true, placeholder: 'forward@email.com' }
      ],
      instructions: 'For Gmail, use an App Password instead of your regular password. Enable 2FA first.'
    };
  }

  async forward(message: string, from: string): Promise<void> {
    if (!this.enabled || !this.transporter) throw new Error('Email forwarding not configured');
    
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: this.target,
      subject: `Forwarded message from ${from}`,
      text: `From: ${from}

${message}`,
    });
    logger.info(`Message forwarded to email: ${this.target}`);
  }
}

export class SMSForwarder implements ForwardingService {
  name = 'SMS';
  enabled: boolean;
  connected: boolean = false;
  private twilio?: Twilio;
  private fromNumber: string;
  private target: string;

  constructor() {
    this.enabled = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.FORWARD_SMS_TO && process.env.SKIP_TWILIO !== 'true');
    this.target = process.env.FORWARD_SMS_TO!;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER!;
    
    if (this.enabled) {
      this.setupTwilio();
    }
  }

  private setupTwilio() {
    this.twilio = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    this.connected = true;
  }

  async connect(config: { accountSid: string; authToken: string; fromNumber: string; to: string }) {
    process.env.TWILIO_ACCOUNT_SID = config.accountSid;
    process.env.TWILIO_AUTH_TOKEN = config.authToken;
    process.env.TWILIO_FROM_NUMBER = config.fromNumber;
    process.env.FORWARD_SMS_TO = config.to;
    
    this.target = config.to;
    this.fromNumber = config.fromNumber;
    this.setupTwilio();
    this.enabled = true;
    
    await this.test();
  }

  async test(): Promise<boolean> {
    if (!this.twilio) throw new Error('Twilio not configured');
    
    try {
      // Test by fetching account info
      await this.twilio.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
      this.connected = true;
      return true;
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  getConfigRequirements() {
    return {
      fields: [
        { name: 'accountSid', type: 'text', label: 'Account SID', required: true, placeholder: 'ACxxxxxxxx' },
        { name: 'authToken', type: 'password', label: 'Auth Token', required: true },
        { name: 'fromNumber', type: 'tel', label: 'From Phone Number', required: true, placeholder: '+1234567890' },
        { name: 'to', type: 'tel', label: 'Forward To Number', required: true, placeholder: '+1234567890' }
      ],
      instructions: 'Get these credentials from your Twilio Console. The From Number must be a Twilio phone number.'
    };
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
  connected: boolean = false;
  private client?: Client;
  private channelId: string;

  constructor() {
    this.enabled = !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID);
    this.channelId = process.env.DISCORD_CHANNEL_ID!;
    
    if (this.enabled) {
      this.setupClient();
    }
  }

  private async setupClient() {
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
    await this.client.login(process.env.DISCORD_BOT_TOKEN);
    this.connected = true;
  }

  async connect(config: { botToken: string; channelId: string }) {
    process.env.DISCORD_BOT_TOKEN = config.botToken;
    process.env.DISCORD_CHANNEL_ID = config.channelId;
    
    this.channelId = config.channelId;
    await this.setupClient();
    this.enabled = true;
    
    await this.test();
  }

  async test(): Promise<boolean> {
    if (!this.client || !this.client.isReady()) throw new Error('Discord bot not ready');
    
    try {
      const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
      if (!channel) throw new Error('Channel not found');
      this.connected = true;
      return true;
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  getConfigRequirements() {
    return {
      fields: [
        { name: 'botToken', type: 'password', label: 'Bot Token', required: true, placeholder: 'YOUR_BOT_TOKEN' },
        { name: 'channelId', type: 'text', label: 'Channel ID', required: true, placeholder: '1234567890' }
      ],
      instructions: 'Create a Discord application and bot at https://discord.com/developers/applications. Copy the bot token and the channel ID where messages should be forwarded.'
    };
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
  connected: boolean = false;
  private bot?: TelegramBot;
  private chatId: string;

  constructor() {
    this.enabled = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
    this.chatId = process.env.TELEGRAM_CHAT_ID!;
    
    if (this.enabled) {
      this.setupBot();
    }
  }

  private setupBot() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });
    this.connected = true;
  }

  async connect(config: { botToken: string; chatId: string }) {
    process.env.TELEGRAM_BOT_TOKEN = config.botToken;
    process.env.TELEGRAM_CHAT_ID = config.chatId;
    
    this.chatId = config.chatId;
    this.setupBot();
    this.enabled = true;
    
    await this.test();
  }

  async test(): Promise<boolean> {
    if (!this.bot) throw new Error('Telegram bot not configured');
    
    try {
      await this.bot.getChat(this.chatId);
      this.connected = true;
      return true;
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  getConfigRequirements() {
    return {
      fields: [
        { name: 'botToken', type: 'password', label: 'Bot Token', required: true, placeholder: 'YOUR_BOT_TOKEN' },
        { name: 'chatId', type: 'text', label: 'Chat ID', required: true, placeholder: '123456789 or @username' }
      ],
      instructions: 'Create a bot with @BotFather on Telegram to get the bot token. For chat ID, message @userinfobot to get your chat ID.'
    };
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
  connected: boolean = false;
  private client?: WebClient;
  private channel: string;

  constructor() {
    this.enabled = !!(process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL);
    this.channel = process.env.SLACK_CHANNEL!;
    
    if (this.enabled) {
      this.setupClient();
    }
  }

  private setupClient() {
    this.client = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.connected = true;
  }

  async connect(config: { botToken: string; channel: string }) {
    process.env.SLACK_BOT_TOKEN = config.botToken;
    process.env.SLACK_CHANNEL = config.channel;
    
    this.channel = config.channel;
    this.setupClient();
    this.enabled = true;
    
    await this.test();
  }

  async test(): Promise<boolean> {
    if (!this.client) throw new Error('Slack client not configured');
    
    try {
      await this.client.auth.test();
      this.connected = true;
      return true;
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  getConfigRequirements() {
    return {
      fields: [
        { name: 'botToken', type: 'password', label: 'Bot Token', required: true, placeholder: 'xoxb-your-token' },
        { name: 'channel', type: 'text', label: 'Channel', required: true, placeholder: '#general or C1234567890' }
      ],
      instructions: 'Create a Slack app and bot at https://api.slack.com/apps. Add the bot to your workspace and copy the Bot User OAuth Token.'
    };
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
  connected: boolean = false;
  private apiKey: string;
  private target: string;

  constructor() {
    this.enabled = !!(process.env.TEXTBELT_API_KEY && process.env.FORWARD_SMS_TO);
    this.apiKey = process.env.TEXTBELT_API_KEY!;
    this.target = process.env.FORWARD_SMS_TO!;
    this.connected = this.enabled;
  }

  async connect(config: { apiKey: string; to: string }) {
    process.env.TEXTBELT_API_KEY = config.apiKey;
    process.env.FORWARD_SMS_TO = config.to;
    
    this.apiKey = config.apiKey;
    this.target = config.to;
    this.enabled = true;
    
    await this.test();
  }

  async test(): Promise<boolean> {
    if (!this.enabled) throw new Error('Textbelt not configured');
    
    try {
      // Test with quota check
      const response = await fetch(`https://textbelt.com/quota/${this.apiKey}`);
      const result = await response.json();
      if (result.quotaRemaining !== undefined) {
        this.connected = true;
        return true;
      }
      throw new Error('Invalid API key');
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  getConfigRequirements() {
    return {
      fields: [
        { name: 'apiKey', type: 'password', label: 'API Key', required: true, placeholder: 'YOUR_API_KEY' },
        { name: 'to', type: 'tel', label: 'Forward To Number', required: true, placeholder: '+1234567890' }
      ],
      instructions: 'Get an API key from https://textbelt.com/. Free accounts get 1 text per day, paid accounts get more.'
    };
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
  private routes: MessageRoute[] = [];

  getAvailableServices() {
    return this.services.map(s => ({ 
      name: s.name, 
      enabled: s.enabled, 
      connected: s.connected 
    }));
  }

  async connectService(serviceName: string, config: any): Promise<any> {
    const service = this.services.find(s => s.name === serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    if (!service.connect) {
      throw new Error(`Service ${serviceName} does not support runtime connection`);
    }
    
    await service.connect(config);
    return { connected: service.connected, enabled: service.enabled };
  }

  getForwarder(serviceName: string): ForwardingService | undefined {
    return this.services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
  }

  async testService(serviceName: string): Promise<any> {
    const service = this.services.find(s => s.name === serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    if (!service.test) {
      throw new Error(`Service ${serviceName} does not support testing`);
    }
    
    const result = await service.test();
    return { connected: result, enabled: service.enabled };
  }

  getServiceConfig(serviceName: string): any {
    const service = this.services.find(s => s.name === serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    if (!service.getConfigRequirements) {
      throw new Error(`Service ${serviceName} does not provide configuration requirements`);
    }
    
    return service.getConfigRequirements();
  }

  async forwardToAll(message: string, from: string, excludeServices: string[] = []): Promise<void> {
    const promises = this.services
      .filter(s => s.enabled && s.connected && !excludeServices.includes(s.name))
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
    if (!service || !service.enabled || !service.connected) {
      throw new Error(`Service ${serviceName} not available or not connected`);
    }
    
    await service.forward(message, from);
  }

  // Route management methods
  createRoute(from: string, to: string, enabled: boolean = true): MessageRoute {
    // Validate services exist
    const fromService = this.services.find(s => s.name.toLowerCase() === from.toLowerCase());
    const toService = this.services.find(s => s.name.toLowerCase() === to.toLowerCase());
    
    if (!fromService) {
      throw new Error(`Source service '${from}' not found`);
    }
    if (!toService) {
      throw new Error(`Target service '${to}' not found`);
    }
    
    const route: MessageRoute = {
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      enabled,
      createdAt: new Date()
    };
    
    this.routes.push(route);
    logger.info(`Route created: ${from} -> ${to}`);
    return route;
  }

  getRoutes(): MessageRoute[] {
    return [...this.routes];
  }

  deleteRoute(routeId: string): void {
    const index = this.routes.findIndex(r => r.id === routeId);
    if (index === -1) {
      throw new Error(`Route with ID ${routeId} not found`);
    }
    
    const route = this.routes[index];
    this.routes.splice(index, 1);
    logger.info(`Route deleted: ${route.from} -> ${route.to}`);
  }

  async routeMessage(sourceService: string, message: string, from: string): Promise<void> {
    // Find all routes from this source service
    const applicableRoutes = this.routes.filter(r => 
      r.enabled && r.from.toLowerCase() === sourceService.toLowerCase()
    );
    
    if (applicableRoutes.length === 0) {
      logger.info(`No routes configured for ${sourceService}, message not forwarded`);
      return;
    }
    
    // Forward to all target services
    const promises = applicableRoutes.map(async (route) => {
      try {
        await this.forwardTo(route.to, message, from);
        logger.info(`Message routed from ${route.from} to ${route.to}`);
      } catch (error) {
        logger.error(`Failed to route message from ${route.from} to ${route.to}: ${error}`);
      }
    });
    
    await Promise.all(promises);
  }
}
