const prisma = require('../utils/prisma');
const darajaService = require('./daraja.service');
const { normalizePhone } = require('../utils/phone');

const PLANS = [
  { id: 'spark', name: 'Spark', price: 0, duration_months: 0, description: 'Free forever — 1 fundraiser, 20 contributors, KES 30k cap' },
  { id: 'solo_monthly', name: 'Solo — 1 Month', price: 999, duration_months: 1, description: 'Unlimited fundraisers and contributors' },
  { id: 'solo_quarterly', name: 'Solo — 3 Months', price: 2697, duration_months: 3, description: 'Save 10% — KES 899/month' },
  { id: 'solo_biannual', name: 'Solo — 6 Months', price: 4794, duration_months: 6, description: 'Save 20% — KES 799/month' },
  { id: 'solo_annual', name: 'Solo — Annual', price: 8388, duration_months: 12, description: 'Save 30% — KES 699/month' },
  { id: 'group', name: 'Group — Chama/SACCO', price: 2500, duration_months: 1, description: '5 admins, recurring contributions' },
  { id: 'enterprise', name: 'Enterprise', price: 25000, duration_months: 12, description: 'Custom, dedicated support' },
];

const PLAN_DURATION_MAP = {
  solo_monthly: 1, solo_quarterly: 3, solo_biannual: 6, solo_annual: 12, group: 1, enterprise: 12,
};

const PLAN_ORGANIZER_MAP = {
  spark: 'spark', solo_monthly: 'solo', solo_quarterly: 'solo', solo_biannual: 'solo', solo_annual: 'solo', group: 'group', enterprise: 'enterprise',
};

const listPlans = () => PLANS;

const initiatePayment = async (organizerId, planId) => {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan || plan.price === 0) {
    const err = new Error('Invalid plan or plan is free.'); err.statusCode = 400; throw err;
  }

  const organizer = await prisma.organizer.findUnique({
    where: { id: organizerId },
    select: { phone_number: true, full_name: true },
  });

  const response = await darajaService.initiateSTKPush({
    phone_number: organizer.phone_number,
    amount: plan.price,
    account_reference: `POCHI-SUB-${planId.toUpperCase()}`,
    description: `Pochi ${plan.name} subscription`,
  });

  const checkoutRequestId = response.CheckoutRequestID;
  if (checkoutRequestId) {
    await prisma.stkPushRequest.create({
      data: {
        organizer_id: organizerId,
        plan_id: planId,
        checkout_request_id: checkoutRequestId,
        amount: plan.price,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
  }

  return { message: 'STK Push sent. Complete payment on your phone.', plan, stk_response: response };
};

const activatePlan = async (organizerId, planId, mpesaTransactionId, amountPaid) => {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) throw new Error('Invalid plan.');

  const now = new Date();
  const durationMonths = PLAN_DURATION_MAP[planId] || 1;
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  await prisma.$transaction([
    prisma.subscription.create({
      data: {
        organizer_id: organizerId,
        plan: planId,
        amount_paid: amountPaid,
        duration_months: durationMonths,
        starts_at: now,
        expires_at: expiresAt,
        mpesa_transaction_id: mpesaTransactionId,
        status: 'active',
      },
    }),
    prisma.organizer.update({
      where: { id: organizerId },
      data: {
        subscription_plan: PLAN_ORGANIZER_MAP[planId],
        subscription_status: 'active',
        subscription_expires_at: expiresAt,
      },
    }),
  ]);
};

const getStatus = async (organizerId) => {
  const organizer = await prisma.organizer.findUnique({
    where: { id: organizerId },
    select: { subscription_plan: true, subscription_status: true, subscription_expires_at: true },
  });
  return organizer;
};

const getHistory = async (organizerId) => {
  return prisma.subscription.findMany({
    where: { organizer_id: organizerId },
    orderBy: { created_at: 'desc' },
  });
};

module.exports = { listPlans, initiatePayment, activatePlan, getStatus, getHistory };
