const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getStatus, getQr, disconnectBot, reinitBot, getGroups } = require('../controllers/whatsapp.controller');

router.get('/status', authenticate, getStatus);
router.get('/qr', authenticate, getQr);
router.post('/disconnect', authenticate, disconnectBot);
router.post('/reinit', authenticate, reinitBot);
router.get('/groups', authenticate, getGroups);

module.exports = router;
