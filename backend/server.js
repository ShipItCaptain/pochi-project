require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./src/middleware/error.middleware');
const remindersJob = require('./src/jobs/reminders.job');

const authRoutes = require('./src/routes/auth.routes');
const fundraiserRoutes = require('./src/routes/fundraiser.routes');
const contributorRoutes = require('./src/routes/contributor.routes');
const transactionRoutes = require('./src/routes/transaction.routes');
const webhookRoutes = require('./src/routes/webhook.routes');
const subscriptionRoutes = require('./src/routes/subscription.routes');
const registerRoutes = require('./src/routes/register.routes');

const app = express();

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Pochi API running on port ${PORT} [${process.env.NODE_ENV}]`);
  remindersJob.start();
});

module.exports = app;
