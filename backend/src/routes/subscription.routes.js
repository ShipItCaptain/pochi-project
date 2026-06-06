const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/subscription.controller');

router.get('/plans', ctrl.listPlans);
router.post('/initiate', authenticate, ctrl.initiate);
router.get('/status', authenticate, ctrl.getStatus);
router.get('/history', authenticate, ctrl.getHistory);

module.exports = router;
