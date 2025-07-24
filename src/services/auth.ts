import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as DiscordStrategy } from 'passport-discord';
import logger from '../logger';

export interface ServiceConnection {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  config?: any;
  accessToken?: string;
  refreshToken?: string;
  profile?: any;
}

export class AuthManager {
  private connections = new Map<string, ServiceConnection>();
  private isDevelopmentMode = process.env.NODE_ENV === 'development';

  constructor() {
    this.setupPassportStrategies();
    this.setupPassportSerialization();
    logger.info('AuthManager initialized');
  }

  private setupPassportStrategies() {
    logger.info('Setting up Passport strategies...');
    
    // Helper function to check if credentials are real (not test placeholders)
    const isValidCredential = (value: string | undefined) => {
      return value && !value.startsWith('test_') && !value.includes('your_') && value.length > 10;
    };
    
    // Always register strategies, even if env vars aren't set (for dev mode)
    this.setupGoogleStrategy();
    this.setupDiscordStrategy();
    this.setupSlackStrategy();
  }

  private setupGoogleStrategy() {
    const isValidCredential = (value: string | undefined) => {
      return value && !value.startsWith('test_') && !value.includes('your_') && value.length > 10;
    };

    if (isValidCredential(process.env.GOOGLE_CLIENT_ID) && isValidCredential(process.env.GOOGLE_CLIENT_SECRET)) {
      try {
        passport.use('google', new GoogleStrategy({
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: '/auth/google/callback'
        }, (accessToken, refreshToken, profile, done) => {
          const connection: ServiceConnection = {
            id: `google_${profile.id}`,
            name: 'Google',
            type: 'google',
            connected: true,
            accessToken,
            refreshToken,
            profile
          };
          this.connections.set(connection.id, connection);
          logger.info(`Google connection established for ${profile.displayName}`);
          return done(null, { ...profile, accessToken, refreshToken, service: 'google' });
        }));
        logger.info('✅ Google OAuth strategy configured successfully');
      } catch (error) {
        logger.error('❌ Failed to configure Google OAuth strategy:', error);
        this.setupMockGoogleStrategy();
      }
    } else {
      logger.warn('⚠️ Google OAuth not configured - setting up mock strategy');
      this.setupMockGoogleStrategy();
    }
  }

  private setupDiscordStrategy() {
    const isValidCredential = (value: string | undefined) => {
      return value && !value.startsWith('test_') && !value.includes('your_') && value.length > 10;
    };

    if (isValidCredential(process.env.DISCORD_CLIENT_ID) && isValidCredential(process.env.DISCORD_CLIENT_SECRET)) {
      try {
        logger.info('Attempting to configure Discord OAuth strategy...');
        passport.use('discord', new DiscordStrategy({
          clientID: process.env.DISCORD_CLIENT_ID!,
          clientSecret: process.env.DISCORD_CLIENT_SECRET!,
          callbackURL: '/auth/discord/callback',
          scope: ['identify', 'email']
        }, (accessToken, refreshToken, profile, done) => {
          const connection: ServiceConnection = {
            id: `discord_${profile.id}`,
            name: 'Discord',
            type: 'discord',
            connected: true,
            accessToken,
            refreshToken,
            profile
          };
          this.connections.set(connection.id, connection);
          logger.info(`Discord connection established for ${profile.username}`);
          return done(null, { ...profile, accessToken, refreshToken, service: 'discord' });
        }));
        logger.info('✅ Discord OAuth strategy configured successfully');
      } catch (error) {
        logger.error('❌ Failed to configure Discord OAuth strategy:', error);
        this.setupMockDiscordStrategy();
      }
    } else {
      logger.warn('⚠️ Discord OAuth not configured - setting up mock strategy');
      logger.info(`Discord Client ID present: ${!!process.env.DISCORD_CLIENT_ID}, length: ${process.env.DISCORD_CLIENT_ID?.length}`);
      this.setupMockDiscordStrategy();
    }
  }

  private setupSlackStrategy() {
    const isValidCredential = (value: string | undefined) => {
      return value && !value.startsWith('test_') && !value.includes('your_') && value.length > 10;
    };

    if (isValidCredential(process.env.SLACK_CLIENT_ID) && isValidCredential(process.env.SLACK_CLIENT_SECRET)) {
      logger.info('✅ Slack OAuth strategy configured (manual implementation)');
    } else {
      logger.warn('⚠️ Slack OAuth not configured - missing valid SLACK_CLIENT_ID or SLACK_CLIENT_SECRET');
    }
  }

  private setupMockGoogleStrategy() {
    passport.use('google', {
      authenticate: (req: any) => {
        req.redirect('/?error=google_not_configured');
      }
    } as any);
    logger.info('🔧 Mock Google strategy registered');
  }

  private setupMockDiscordStrategy() {
    passport.use('discord', {
      authenticate: (req: any) => {
        req.redirect('/?error=discord_not_configured');
      }
    } as any);
    logger.info('🔧 Mock Discord strategy registered');
  }

  private setupPassportSerialization() {
    passport.serializeUser((user: any, done) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
      done(null, user);
    });
  }

  getUserConnections(userId: string): ServiceConnection[] {
    return Array.from(this.connections.values()).filter(conn => 
      conn.profile?.id === userId || conn.id.includes(userId)
    );
  }

  getConnection(connectionId: string): ServiceConnection | undefined {
    return this.connections.get(connectionId);
  }

  updateConnection(connectionId: string, updates: Partial<ServiceConnection>) {
    const existing = this.connections.get(connectionId);
    if (existing) {
      this.connections.set(connectionId, { ...existing, ...updates });
    }
  }

  removeConnection(connectionId: string) {
    this.connections.delete(connectionId);
  }

  getAllConnections(): ServiceConnection[] {
    return Array.from(this.connections.values());
  }

  // Manual service connection (for services that don't use OAuth)
  addManualConnection(service: string, config: any, userId?: string): ServiceConnection {
    const connectionId = `${service}_${userId || Date.now()}`;
    const connection: ServiceConnection = {
      id: connectionId,
      name: service.charAt(0).toUpperCase() + service.slice(1),
      type: service,
      connected: true,
      config
    };
    this.connections.set(connectionId, connection);
    logger.info(`Manual connection added for ${service}`);
    return connection;
  }

  // Check if user has permission to access a connection
  canUserAccessConnection(userId: string, connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;
    
    // Check if the connection belongs to the user
    return connection.profile?.id === userId || connection.id.includes(userId);
  }

  // Get available strategies for current configuration
  getAvailableStrategies(): string[] {
    const strategies: string[] = [];
    
    // Helper function to check if credentials are real
    const isValidCredential = (value: string | undefined) => {
      return value && !value.startsWith('test_') && !value.includes('your_');
    };
    
    if (isValidCredential(process.env.GOOGLE_CLIENT_ID)) {
      strategies.push('google');
    } else if (this.isDevelopmentMode) {
      strategies.push('google-mock');
    }
    
    if (isValidCredential(process.env.DISCORD_CLIENT_ID)) {
      strategies.push('discord');
    } else if (this.isDevelopmentMode) {
      strategies.push('discord-mock');
    }
    
    if (isValidCredential(process.env.SLACK_CLIENT_ID)) {
      strategies.push('slack');
    }
    
    return strategies;
  }
}

// Export singleton instance
export const authManager = new AuthManager();
