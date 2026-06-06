const matchingService = require('../services/matching.service');
const subscriptionService = require('../services/subscription.service');
const prisma = require('../utils/prisma');

const parseBody = (raw) =>
  typeof raw === 'string' || Buffer.isBuffer(raw) ? JSON.parse(raw.toString()) : raw;

const extractCallbackItem = (items, name) =>
  items?.find((i) => i.Name === name)?.Value ?? null;

const handleC2B = async (req, res, next) => {
  try {
    const fundraiserId = req.query.fundraiser;
    if (!fundraiserId) {
      return res.status(400).json({ ResultCode: 1, ResultDesc: 'Missing fundraiser parameter.' });
    }

    const payload = parseBody(req.body);

    if (!payload.TransID) {
      return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid payload.' });
    }

    await matchingService.processIncomingPayment(fundraiserId, payload);

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('[Daraja C2B webhook error]', err.message);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

const handleValidation = async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
};

const handleStkCallback = async (req, res) => {
  try {
    const payload = parseBody(req.body);
    const callback = payload?.Body?.stkCallback;

    if (!callback) {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback;

    const pending = await prisma.stkPushRequest.findUnique({
      where: { checkout_request_id: CheckoutRequestID },
    });

    if (!pending || pending.status !== 'pending') {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (ResultCode !== 0) {
      await prisma.stkPushRequest.update({
        where: { checkout_request_id: CheckoutRequestID },
        data: { status: 'failed' },
      });
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const items = CallbackMetadata?.Item || [];
    const mpesaReceiptNumber = extractCallbackItem(items, 'MpesaReceiptNumber');
    const amount = extractCallbackItem(items, 'Amount');

    if (!mpesaReceiptNumber) {
      console.error('[STK callback] Missing MpesaReceiptNumber in successful callback');
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    await subscriptionService.activatePlan(
      pending.organizer_id,
      pending.plan_id,
      mpesaReceiptNumber,
      amount ?? pending.amount
    );

    await prisma.stkPushRequest.update({
      where: { checkout_request_id: CheckoutRequestID },
      data: { status: 'completed' },
    });

    console.log(`[STK callback] Subscription activated — organizer=${pending.organizer_id} plan=${pending.plan_id} tx=${mpesaReceiptNumber}`);
  } catch (err) {
    console.error('[STK callback error]', err.message);
  }

  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
};

module.exports = { handleC2B, handleValidation, handleStkCallback };
