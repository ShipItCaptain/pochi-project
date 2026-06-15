const waClient = require('../utils/whatsapp.client');

const getStatus = (req, res) => {
  res.json({
    connected: waClient.isReady(),
    initializing: waClient.isInitializing(),
  });
};

const getQr = async (req, res, next) => {
  try {
    if (waClient.isReady()) {
      return res.json({ connected: true, qr: null });
    }
    const qr = await waClient.getQrDataUrl();
    res.json({ connected: false, initializing: waClient.isInitializing(), qr });
  } catch (err) {
    next(err);
  }
};

const disconnectBot = async (req, res, next) => {
  try {
    await waClient.disconnect();
    res.json({ message: 'Disconnected.' });
  } catch (err) {
    next(err);
  }
};

const reinitBot = async (req, res, next) => {
  try {
    waClient.reinitialize();
    res.json({ message: 'Reconnecting — scan the new QR code in a moment.' });
  } catch (err) {
    next(err);
  }
};

const getGroups = async (req, res, next) => {
  try {
    const groups = await waClient.getGroups();
    res.json(groups);
  } catch (err) {
    next(err);
  }
};

module.exports = { getStatus, getQr, disconnectBot, reinitBot, getGroups };
