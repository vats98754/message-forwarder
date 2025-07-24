import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import logger from './logger';
import session from 'express-session';
import passport from 'passport';
import { ForwardingManager } from './services/forwarders';
import { authManager } from './services/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const forwardingManager = new ForwardingManager();

// Initialize authentication manager (this sets up passport strategies)
const auth = authManager;

// Passport config
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

app.use(express.json());
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'fallback-secret-key', 
  resave: false, 
  saveUninitialized: false 
}));
app.use(passport.initialize());
app.use(passport.session());

// log every request
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Serve UI root
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, '../src/public/index.html'));
});
app.use(express.static(path.resolve(__dirname, '../src/public')));

// Authentication routes
app.get('/auth/google', (req: Request, res: Response, next: NextFunction) => {
  const availableStrategies = authManager.getAvailableStrategies();
  
  if (availableStrategies.includes('google')) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  } else if (availableStrategies.includes('google-mock')) {
    passport.authenticate('google-mock', { successRedirect: '/?connected=google&demo=true' })(req, res, next);
  } else {
    return res.redirect('/?error=google_not_configured');
  }
});

app.get('/auth/google/callback', (req: Request, res: Response, next: NextFunction) => {
  const availableStrategies = authManager.getAvailableStrategies();
  
  if (availableStrategies.includes('google')) {
    passport.authenticate('google', { failureRedirect: '/?error=auth_failed' })(req, res, next);
  } else {
    res.redirect('/?connected=google&demo=true');
  }
}, (req: Request, res: Response) => {
  res.redirect('/?connected=google');
});

app.get('/auth/discord', (req: Request, res: Response, next: NextFunction) => {
  const availableStrategies = authManager.getAvailableStrategies();
  
  if (availableStrategies.includes('discord')) {
    passport.authenticate('discord')(req, res, next);
  } else if (availableStrategies.includes('discord-mock')) {
    passport.authenticate('discord-mock', { successRedirect: '/?connected=discord&demo=true' })(req, res, next);
  } else {
    return res.redirect('/?error=discord_not_configured');
  }
});

app.get('/auth/discord/callback', (req: Request, res: Response, next: NextFunction) => {
  const availableStrategies = authManager.getAvailableStrategies();
  
  if (availableStrategies.includes('discord')) {
    passport.authenticate('discord', { failureRedirect: '/?error=auth_failed' })(req, res, next);
  } else {
    res.redirect('/?connected=discord&demo=true');
  }
}, (req: Request, res: Response) => {
  res.redirect('/?connected=discord');
});

// Slack OAuth (manual implementation)
app.get('/auth/slack', (req: Request, res: Response) => {
  if (!process.env.SLACK_CLIENT_ID) {
    return res.redirect('/?error=slack_not_configured');
  }
  
  const scopes = 'chat:write,channels:read,groups:read,im:read,mpim:read';
  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(process.env.SLACK_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/slack/callback`)}`;
  res.redirect(slackAuthUrl);
});

app.get('/auth/slack/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.redirect('/?error=slack_auth_denied');
  }
  
  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: process.env.SLACK_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/slack/callback`
      })
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error);
    }
    
    // Store Slack connection
    authManager.addManualConnection('slack', {
      accessToken: data.access_token,
      teamId: data.team.id,
      teamName: data.team.name,
      userId: data.authed_user.id,
      botUserId: data.bot_user_id
    }, req.user?.id);
    
    res.redirect('/?connected=slack');
  } catch (error) {
    logger.error('Slack OAuth error:', error);
    res.redirect('/?error=slack_auth_failed');
  }
});

app.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});
// User info
app.get('/api/user', (req: Request, res: Response) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const user = req.user;
    res.json({ 
      authenticated: true, 
      user: {
        id: user?.id,
        name: user?.displayName,
        email: user?.emails?.[0]?.value,
        service: user?.service
      },
      connections: authManager.getUserConnections(user?.id || '')
    });
  } else {
    res.json({ authenticated: false, connections: [] });
  }
});

// Service connections API
app.get('/api/connections', (req: Request, res: Response) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const connections = authManager.getUserConnections(req.user?.id || '');
  res.json({ connections });
});

// Connect manual service (Email, SMS, Telegram Bot)
app.post('/api/services/:service/connect', async (req: Request, res: Response) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const service = req.params.service.toLowerCase();
  const config = req.body;
  
  try {
    // Get the appropriate forwarder
    const forwarder = forwardingManager.getForwarder(service);
    if (!forwarder) {
      return res.status(400).json({ error: 'Service not supported' });
    }
    
    // Test connection
    if (forwarder.connect) {
      await forwarder.connect(config);
    }
    
    // Save connection
    const connection = authManager.addManualConnection(service, config, req.user?.id);
    
    res.json({ success: true, connection });
  } catch (error) {
    logger.error(`Failed to connect ${service}:`, error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get service configuration requirements
app.get('/api/services/:service/config', (req: Request, res: Response) => {
  const service = req.params.service.toLowerCase();
  const forwarder = forwardingManager.getForwarder(service);
  
  if (!forwarder || !forwarder.getConfigRequirements) {
    return res.status(404).json({ error: 'Service not found or does not require configuration' });
  }
  
  res.json(forwarder.getConfigRequirements());
});

// Service connection endpoints
app.post('/api/services/:service/connect', async (req: Request, res: Response) => {
  const { service } = req.params;
  const config = req.body;
  
  try {
    const result = await forwardingManager.connectService(service, config);
    res.json({ success: true, message: `${service} connected successfully`, ...result });
  } catch (error) {
    logger.error(`Service connection error for ${service}: ${error}`);
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Connection failed' });
  }
});

// Test service connection
app.post('/api/services/:service/test', async (req: Request, res: Response) => {
  const { service } = req.params;
  
  try {
    const result = await forwardingManager.testService(service);
    res.json({ success: true, message: `${service} test successful`, ...result });
  } catch (error) {
    logger.error(`Service test error for ${service}: ${error}`);
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Test failed' });
  }
});

// Get service configuration requirements
app.get('/api/services/:service/config', (req: Request, res: Response) => {
  const { service } = req.params;
  const configRequirements = forwardingManager.getServiceConfig(service);
  res.json(configRequirements);
});

// Get available services
app.get('/api/services', (req: Request, res: Response) => {
  res.json(forwardingManager.getAvailableServices());
});

// Forward message to all enabled services
app.post('/api/forward', async (req: Request, res: Response) => {
  const { message, from, excludeServices } = req.body;
  
  try {
    await forwardingManager.forwardToAll(message, from, excludeServices);
    res.json({ success: true, message: 'Message forwarded to all enabled services' });
  } catch (error) {
    logger.error(`Forwarding error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to forward message' });
  }
});

// Route management
app.get('/api/routes', (req: Request, res: Response) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const routes = forwardingManager.getRoutes();
  res.json({ routes });
});

app.post('/api/routes', async (req: Request, res: Response) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { from, to, enabled = true } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ error: 'Both from and to services are required' });
  }
  
  try {
    const route = forwardingManager.createRoute(from, to, enabled);
    res.json({ success: true, route });
  } catch (error) {
    logger.error('Route creation error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

app.delete('/api/routes/:routeId', (req: Request, res: Response) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { routeId } = req.params;
  
  try {
    forwardingManager.deleteRoute(routeId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Route deletion error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Message routing (main entry point for forwarding)
app.post('/api/route-message', async (req: Request, res: Response) => {
  const { sourceService, message, from } = req.body;
  
  if (!sourceService || !message) {
    return res.status(400).json({ error: 'Source service and message are required' });
  }
  
  try {
    await forwardingManager.routeMessage(sourceService, message, from || 'Unknown');
    res.json({ success: true, message: 'Message routed successfully' });
  } catch (error) {
    logger.error('Message routing error:', error);
    res.status(500).json({ success: false, error: 'Message routing failed' });
  }
});

// Get available services
app.get('/api/services', (req: Request, res: Response) => {
  const services = forwardingManager.getAvailableServices();
  res.json(services);
});

// Broadcast to all services
app.post('/api/broadcast', async (req: Request, res: Response) => {
  const { message, from } = req.body;
  
  try {
    await forwardingManager.forwardToAll(message, from);
    res.json({ success: true, message: 'Broadcast sent to all enabled services' });
  } catch (error) {
    logger.error(`Broadcast error: ${error}`);
    res.status(500).json({ success: false, error: 'Broadcast failed' });
  }
});

// Forward to specific service
app.post('/api/forward/:service', async (req: Request, res: Response) => {
  const { service } = req.params;
  const { message, from } = req.body;
  
  try {
    await forwardingManager.forwardTo(service, message, from);
    res.json({ success: true, message: `Message forwarded to ${service}` });
  } catch (error) {
    logger.error(`Forwarding error: ${error}`);
    res.status(500).json({ success: false, error: `Failed to forward to ${service}` });
  }
});

// Legacy SMS endpoint (for backward compatibility)
app.post('/api/sms', async (req: Request, res: Response) => {
  const { From, Body } = req.body;
  
  try {
    await forwardingManager.forwardTo('SMS', Body, From);
    res.type('text/xml').send('<Response></Response>');
  } catch (error) {
    logger.error(`SMS forwarding error: ${error}`);
    res.status(500).send('Error forwarding SMS');
  }
});

// Legacy Email endpoint (for backward compatibility)
app.post('/api/email', async (req: Request, res: Response) => {
  const { subject, text, from } = req.body;
  const message = `Subject: ${subject}\n\n${text}`;
  
  try {
    await forwardingManager.forwardTo('Email', message, from);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Email forwarding error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to forward email' });
  }
});

// Route management endpoints
const routes: Array<{id: string, source: string, target: string, filter?: string}> = [];
let routeIdCounter = 1;

// Get all routes
app.get('/api/routes', (req: Request, res: Response) => {
  res.json(routes);
});

// Create new route
app.post('/api/routes', (req: Request, res: Response) => {
  const { source, target, filter } = req.body;
  
  if (!source || !target) {
    res.status(400).json({ error: 'Source and target services are required' });
    return;
  }
  
  const newRoute = {
    id: routeIdCounter.toString(),
    source,
    target,
    filter: filter || undefined
  };
  
  routes.push(newRoute);
  routeIdCounter++;
  
  logger.info(`Route created: ${source} → ${target} ${filter ? `(filter: ${filter})` : ''}`);
  res.json({ success: true, route: newRoute });
});

// Delete route
app.delete('/api/routes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const routeIndex = routes.findIndex(route => route.id === id);
  
  if (routeIndex === -1) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }
  
  const deletedRoute = routes.splice(routeIndex, 1)[0];
  logger.info(`Route deleted: ${deletedRoute.source} → ${deletedRoute.target}`);
  res.json({ success: true, message: 'Route deleted successfully' });
});

// Forward message via specific route
app.post('/api/routes/:id/forward', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, from } = req.body;
  
  const route = routes.find(r => r.id === id);
  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }
  
  try {
    // Apply filter if specified
    if (route.filter && !message.toLowerCase().includes(route.filter.toLowerCase())) {
      res.json({ success: true, message: 'Message filtered out' });
      return;
    }
    
    await forwardingManager.forwardTo(route.target, message, from);
    res.json({ success: true, message: `Message forwarded via route ${route.source} → ${route.target}` });
  } catch (error) {
    logger.error(`Route forwarding error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to forward via route' });
  }
});

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled error: ${err.stack || err}`);
  res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
  logger.info(`Message Forwarder running on port ${port}`);
});
