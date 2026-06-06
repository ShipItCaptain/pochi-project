const crypto = require('crypto');

const generateAccountReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'PCH-';
  for (let i = 0; i < 4; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
};

const generateRegistrationToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

module.exports = { generateAccountReference, generateRegistrationToken };
