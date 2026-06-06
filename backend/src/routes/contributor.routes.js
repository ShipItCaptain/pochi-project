const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/contributor.controller');

router.get('/:id/contributors', authenticate, ctrl.list);
router.get('/:id/contributors/unpaid', authenticate, ctrl.listUnpaid);
router.get('/:id/contributors/:cid', authenticate, ctrl.getOne);
router.put('/:id/contributors/:cid', authenticate, ctrl.update);
router.delete('/:id/contributors/:cid', authenticate, ctrl.remove);
router.post('/:id/contributors/:cid/remind', authenticate, ctrl.remind);

module.exports = router;
