const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requestOtp, verifyOtp, getMe, updateProfile } = require('../controllers/auth.controller');

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
