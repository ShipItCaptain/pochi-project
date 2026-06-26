const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/fundraiser.controller');
const darajaCtrl = require('../controllers/daraja.controller');

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.post('/validate-shortcode', authenticate, darajaCtrl.validateShortcode);
router.get('/:id', authenticate, ctrl.getOne);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.remove);
router.get('/:id/summary', authenticate, ctrl.getSummary);
router.post('/:id/connect-daraja', authenticate, darajaCtrl.connectDaraja);
router.post('/:id/connect-whatsapp', authenticate, ctrl.connectWhatsapp);
router.get('/:id/export/pdf', authenticate, ctrl.exportPdf);
router.get('/:id/export/excel', authenticate, ctrl.exportExcel);

module.exports = router;
