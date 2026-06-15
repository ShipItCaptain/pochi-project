const prisma = require('../utils/prisma');
const { generateAccountReference, generateRegistrationToken } = require('../utils/tokens');
const whatsappService = require('./whatsapp.service');

const SPARK_FUNDRAISER_LIMIT = 1;
const SPARK_TARGET_CAP = 30000;

const checkSparkLimits = async (organizerId, targetAmount) => {
  const organizer = await prisma.organizer.findUnique({
    where: { id: organizerId },
    select: { subscription_plan: true, subscription_status: true, subscription_expires_at: true },
  });

  const isPaidActive =
    organizer.subscription_plan !== 'spark' &&
    organizer.subscription_status === 'active' &&
    (!organizer.subscription_expires_at || organizer.subscription_expires_at > new Date());

  if (isPaidActive) return;

  const activeCount = await prisma.fundraiser.count({
    where: { organizer_id: organizerId, status: { in: ['active', 'paused'] } },
  });

  if (activeCount >= SPARK_FUNDRAISER_LIMIT) {
    const err = new Error('Free Spark plan allows only 1 active fundraiser. Upgrade to create more.');
    err.statusCode = 403;
    throw err;
  }

  if (targetAmount > SPARK_TARGET_CAP) {
    const err = new Error(`Free Spark plan caps fundraiser targets at KES ${SPARK_TARGET_CAP.toLocaleString()}. Upgrade to remove this limit.`);
    err.statusCode = 403;
    throw err;
  }
};

const listFundraisers = async (organizerId) => {
  return prisma.fundraiser.findMany({
    where: { organizer_id: organizerId },
    orderBy: { created_at: 'desc' },
    include: {
      _count: { select: { contributors: true, transactions: true } },
    },
  });
};

const createFundraiser = async (organizerId, data) => {
  await checkSparkLimits(organizerId, data.target_amount);

  let account_reference;
  const reg_token = generateRegistrationToken();

  if (data.account_reference) {
    const taken = await prisma.fundraiser.findUnique({ where: { account_reference: data.account_reference } });
    if (taken) {
      const err = new Error('That account number is already in use. Choose a different one.');
      err.statusCode = 409;
      throw err;
    }
    account_reference = data.account_reference;
  } else {
    let attempts = 0;
    do {
      account_reference = generateAccountReference();
      const existing = await prisma.fundraiser.findUnique({ where: { account_reference } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);
  }

  return prisma.fundraiser.create({
    data: {
      organizer_id: organizerId,
      title: data.title,
      description: data.description || null,
      target_amount: data.target_amount,
      paybill_number: data.paybill_number || null,
      till_number: data.till_number || null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      account_reference,
      registration_link_token: reg_token,
    },
  });
};

const getFundraiser = async (id, organizerId) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id },
    include: {
      _count: { select: { contributors: true, transactions: true } },
    },
  });

  if (!fundraiser) {
    const err = new Error('Fundraiser not found.');
    err.statusCode = 404;
    throw err;
  }

  if (fundraiser.organizer_id !== organizerId) {
    const err = new Error('Access denied.');
    err.statusCode = 403;
    throw err;
  }

  return fundraiser;
};

const updateFundraiser = async (id, organizerId, data) => {
  await getFundraiser(id, organizerId);

  return prisma.fundraiser.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.target_amount && { target_amount: data.target_amount }),
      ...(data.paybill_number !== undefined && { paybill_number: data.paybill_number }),
      ...(data.till_number !== undefined && { till_number: data.till_number }),
      ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
      ...(data.status && { status: data.status }),
      ...(data.whatsapp_group_id !== undefined && { whatsapp_group_id: data.whatsapp_group_id }),
      ...(data.bot_phone_number !== undefined && { bot_phone_number: data.bot_phone_number }),
      ...(data.bot_language && { bot_language: data.bot_language }),
    },
  });
};

const deleteFundraiser = async (id, organizerId) => {
  await getFundraiser(id, organizerId);
  return prisma.fundraiser.update({
    where: { id },
    data: { status: 'closed' },
  });
};

const getFundraiserSummary = async (id, organizerId) => {
  const fundraiser = await getFundraiser(id, organizerId);

  const [paidCount, unpaidCount, unmatchedCount] = await Promise.all([
    prisma.contributor.count({
      where: { fundraiser_id: id, pledge_status: 'complete' },
    }),
    prisma.contributor.count({
      where: { fundraiser_id: id, pledge_status: { in: ['unpledged', 'pledged'] } },
    }),
    prisma.transaction.count({
      where: { fundraiser_id: id, match_status: 'unmatched' },
    }),
  ]);

  const pct = fundraiser.target_amount > 0
    ? Math.round((fundraiser.total_paid / fundraiser.target_amount) * 100)
    : 0;

  return {
    ...fundraiser,
    progress_pct: pct,
    paid_contributors: paidCount,
    unpaid_contributors: unpaidCount,
    unmatched_transactions: unmatchedCount,
  };
};

const connectWhatsapp = async (id, organizerId, { whatsapp_group_id, bot_phone_number }) => {
  await getFundraiser(id, organizerId);
  const updated = await prisma.fundraiser.update({
    where: { id },
    data: { whatsapp_group_id, bot_phone_number },
  });

  // Fire-and-forget: announce registration link to the newly connected group
  whatsappService.sendGroupConnectAnnouncement(updated).catch((err) =>
    console.error('[WhatsApp] Group connect announcement failed:', err.message)
  );

  return updated;
};

module.exports = {
  listFundraisers,
  createFundraiser,
  getFundraiser,
  updateFundraiser,
  deleteFundraiser,
  getFundraiserSummary,
  connectWhatsapp,
};
