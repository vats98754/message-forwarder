import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { Twilio } from 'twilio';
import nodemailer from 'nodemailer';
import logger from './logger';

dotenv.config();
const skipTwilio = process.env.SKIP_TWILIO === 'true';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
// log every request
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Twilio client
const twilio = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const fromNumber = process.env.TWILIO_FROM_NUMBER!;
const smsTarget = process.env.FORWARD_SMS_TO!;

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
const emailTarget = process.env.FORWARD_EMAIL_TO!;

// Serve UI root
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, '../src/public/index.html'));
});
app.use(express.static(path.resolve(__dirname, '../src/public')));

// SMS webhook endpoint
app.post('/api/sms', async (req: Request, res: Response) => {
  const { From, Body } = req.body;
  if (skipTwilio) {
    logger.warn(`Skipping Twilio forwarding: From ${From}, Body ${Body}`);
    return res.type('text/xml').send('<Response></Response>');
  }
  try {
    await twilio.messages.create({
      body: `Forwarded SMS from ${From}: ${Body}`,
      from: fromNumber,
      to: smsTarget,
    });
    res.type('text/xml').send('<Response></Response>');
  } catch (error) {
    logger.error(`SMS forwarding error: ${error}`);
    res.status(500).send('Error forwarding SMS');
  }
});

// Email webhook endpoint
app.post('/api/email', async (req: Request, res: Response) => {
  const { subject, text, from } = req.body;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: emailTarget,
      subject: `Fwd: ${subject}`,
      text: `Forwarded email from ${from}\n\n${text}`,
    });
    res.sendStatus(200);
  } catch (error) {
    logger.error(`Email forwarding error: ${error}`);
    res.status(500).send('Error forwarding email');
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
