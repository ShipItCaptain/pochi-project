const express = require('express');
const router = express.Router();
const darajaWebhook = require('../webhooks/daraja.webhook');
const whatsappWebhook = require('../webhooks/whatsapp.webhook');

router.post('/daraja/c2b', darajaWebhook.handleC2B);
router.post('/daraja/validation', darajaWebhook.handleValidation);
router.post('/daraja/stk-callback', darajaWebhook.handleStkCallback);
router.post('/whatsapp/incoming', whatsappWebhook.handleIncoming);

module.exports = router;
