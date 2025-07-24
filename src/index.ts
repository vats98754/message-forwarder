import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import logger from './logger';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { ForwardingManager } from './services/forwarders';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const forwardingManager = new ForwardingManager();

// Passport config
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL!
  }, (accessToken, refreshToken, profile, done) => {
    // save tokens or profile for API calls
    done(null, { profile, accessToken, refreshToken });
  }));
}

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

// Auth routes (only if Google OAuth is configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req: Request, res: Response) => {
    res.redirect('/');
  });
  app.get('/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  });
} else {
  // Provide dummy auth routes when OAuth is not configured
  app.get('/auth/google', (req: Request, res: Response) => {
    res.redirect('/?auth=demo');
  });
  app.get('/logout', (req: Request, res: Response) => {
    res.redirect('/');
  });
}
// User info
app.get('/api/user', (req: Request, res: Response) => {
  // Demo mode if OAuth not configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    res.json({ authenticated: false, demo: true });
    return;
  }
  
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
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
