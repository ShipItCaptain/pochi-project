require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Railway doesn't route IPv6; force IPv4 for all DNS lookups
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./src/middleware/error.middleware');
const { authenticate } = require('./src/middleware/auth.middleware');
const remindersJob = require('./src/jobs/reminders.job');
const waClient = require('./src/utils/whatsapp.client');
const whatsappService = require('./src/services/whatsapp.service');
const prisma = require('./src/utils/prisma');

const authRoutes = require('./src/routes/auth.routes');
const fundraiserRoutes = require('./src/routes/fundraiser.routes');
const contributorRoutes = require('./src/routes/contributor.routes');
const transactionRoutes = require('./src/routes/transaction.routes');
const webhookRoutes = require('./src/routes/webhook.routes');
const subscriptionRoutes = require('./src/routes/subscription.routes');
const registerRoutes = require('./src/routes/register.routes');
const whatsappRoutes = require('./src/routes/whatsapp.routes');

const app = express();
app.set('trust proxy', 1); // Railway sits behind a reverse proxy

app.use(helmet());

const ALLOWED_ORIGINS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/.*-hisocietys-projects\.vercel\.app$/,
  /^https:\/\/pochi\.co\.ke$/,
];
if (process.env.FRONTEND_URL) {
  try { ALLOWED_ORIGINS.push(new RegExp(`^${process.env.FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)); } catch (_) {}
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some(p => p.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/v1/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/v1', globalLimiter);
app.use('/v1/auth', publicLimiter);
app.use('/v1/register', publicLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pochi-api', timestamp: new Date().toISOString() });
});

app.use('/v1/auth', authRoutes);
app.use('/v1/fundraisers', fundraiserRoutes);
app.use('/v1/fundraisers', contributorRoutes);
app.use('/v1/fundraisers', transactionRoutes);
app.use('/v1/webhooks', webhookRoutes);
app.use('/v1/subscriptions', subscriptionRoutes);
app.use('/v1/register', registerRoutes);
app.use('/v1/whatsapp', whatsappRoutes);

// Manual reminder trigger — authenticated, for testing
app.post('/v1/admin/reminders/run', authenticate, async (req, res, next) => {
  try {
    await remindersJob.sendScheduledReminders();
    res.json({ ok: true, message: 'Reminders run.' });
  } catch (err) { next(err); }
});

app.use(notFound);
app.use(errorHandler);

waClient.setMessageHandler(async (msg) => {
  if (!msg.body) return;

  // Group message
  if (msg.from.endsWith('@g.us')) {
    const fundraiser = await prisma.fundraiser.findFirst({
      where: { whatsapp_group_id: msg.from },
      select: { id: true },
    });
    if (!fundraiser) return;
    let senderPhone = null;
    if (msg.author && msg.author.endsWith('@c.us')) {
      senderPhone = msg.author.replace('@c.us', '');
    }
    await whatsappService.handleIncomingMessage(msg.from, msg.body, fundraiser.id, senderPhone, msg.author);
    return;
  }

  // DM to the bot (@c.us or @lid)
  if (msg.from.endsWith('@c.us') || msg.from.endsWith('@lid')) {
    // Active registration conversation takes priority
    const handled = await whatsappService.handleDmMessage(msg.from, msg.body);
    if (handled) return;

    // Regular DM commands (STATUS etc) — only reliable when we have a real phone
    if (msg.from.endsWith('@c.us')) {
      const senderPhone = msg.from.replace('@c.us', '');
      const fundraiser = await prisma.fundraiser.findFirst({
        where: { contributors: { some: { phone_number: { endsWith: senderPhone.slice(-9) } } } },
        select: { id: true },
      });
      if (!fundraiser) return;
      await whatsappService.handleIncomingMessage(msg.from, msg.body, fundraiser.id, senderPhone, msg.from);
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Pochi API running on port ${PORT} [${process.env.NODE_ENV}]`);
  remindersJob.start();
  waClient.initClient();
});

module.exports = app;
