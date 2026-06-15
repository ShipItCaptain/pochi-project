const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

let client = null;
let ready = false;
let currentQrString = null;
let qrGeneratedAt = null;
let initializing = false;
let messageHandler = null;

const QR_TTL_MS = 60000;

const clearSession = () => {
  const fs = require('fs');
  const path = require('path');
  const { execSync } = require('child_process');

  // Kill any Chrome holding our data directory, wait for it to fully exit
  try {
    const dataPath = path.resolve('.wwebjs_auth');
    execSync(`pkill -9 -f "${dataPath}" 2>/dev/null; sleep 3`, { stdio: 'ignore', timeout: 8000 });
  } catch (_) {}

  const sessionDir = path.join('.wwebjs_auth', 'session');
  ['SingletonLock', 'SingletonCookie', 'SingletonSocket'].forEach(f => {
    try { fs.unlinkSync(path.join(sessionDir, f)); } catch (_) {}
  });
};

const initClient = () => {
  if (initializing || ready) return client;
  initializing = true;

  clearSession();

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: process.env.NODE_ENV !== 'development',
      protocolTimeout: 300000,
    },
  });

  client.on('qr', (qr) => {
    currentQrString = qr;
    qrGeneratedAt = Date.now();
    console.log('[WhatsApp] QR code ready — scan in the dashboard.');
  });

  client.on('authenticated', () => {
    currentQrString = null;
    qrGeneratedAt = null;
    console.log('[WhatsApp] Authenticated — loading chats...');
  });

  client.on('ready', () => {
    ready = true;
    currentQrString = null;
    qrGeneratedAt = null;
    initializing = false;
    console.log('[WhatsApp] Bot connected and ready.');
  });

  client.on('auth_failure', () => {
    ready = false;
    initializing = false;
    console.error('[WhatsApp] Auth failed.');
    clearSession();
  });

  client.on('disconnected', (reason) => {
    ready = false;
    initializing = false;
    console.log(`[WhatsApp] Disconnected: ${reason}`);
  });

  client.on('message', (msg) => {
    if (messageHandler) messageHandler(msg).catch(console.error);
  });

  client.initialize().catch((err) => {
    initializing = false;
    console.error('[WhatsApp] Initialization failed:', err.message);
    // No auto-retry — user controls reconnect via the "Start bot" button in Settings
  });

  return client;
};

const getQrDataUrl = async () => {
  if (!currentQrString) return null;
  const ageMs = Date.now() - (qrGeneratedAt || 0);
  if (ageMs > QR_TTL_MS) {
    currentQrString = null;
    return null;
  }
  return QRCode.toDataURL(currentQrString, { width: 256, margin: 2 });
};

const disconnect = async () => {
  ready = false;
  currentQrString = null;
  qrGeneratedAt = null;
  initializing = false;
  if (client) {
    try { await client.destroy(); } catch (_) {}
    client = null;
  }
  clearSession();
};

const reinitialize = async () => {
  await disconnect();
  await new Promise(r => setTimeout(r, 2000));
  initClient();
};

const getClient = () => client;
const isReady = () => ready;
const isInitializing = () => initializing;

const getGroups = async () => {
  if (!ready || !client) return [];
  try {
    const chats = await client.getChats();
    return chats
      .filter(c => c.isGroup)
      .map(c => ({
        id: c.id._serialized,
        name: c.name || c.id._serialized,
        participants: c.participants?.length || 0,
      }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (err) {
    if (err.message?.includes('detached Frame') || err.message?.includes('Target closed') || err.message?.includes('Session closed')) {
      console.log('[WhatsApp] Session detached — reconnecting...');
      ready = false;
      reinitialize().catch(console.error);
    }
    return [];
  }
};

const setMessageHandler = (handler) => { messageHandler = handler; };

module.exports = { initClient, getClient, isReady, isInitializing, getQrDataUrl, getGroups, disconnect, reinitialize, setMessageHandler };
