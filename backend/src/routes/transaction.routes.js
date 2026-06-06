const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/transaction.controller');

router.get('/:id/transactions', authenticate, ctrl.list);
router.get('/:id/transactions/unmatched', authenticate, ctrl.listUnmatched);
router.post('/:id/transactions/:tid/match', authenticate, ctrl.manualMatch);
router.get('/:id/transactions/:tid', authenticate, ctrl.getOne);

module.exports = router;
