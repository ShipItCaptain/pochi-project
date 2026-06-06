const prisma = require('../utils/prisma');
const { normalizePhone, isValidKenyanPhone } = require('../utils/phone');
const whatsappService = require('./whatsapp.service');

const SPARK_CONTRIBUTOR_LIMIT = 20;

const checkContributorLimit = async (fundraiserId) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
    include: { organizer: { select: { subscription_plan: true, subscription_status: true, subscription_expires_at: true } } },
  });

  const org = fundraiser.organizer;
  const isPaidActive =
    org.subscription_plan !== 'spark' &&
    org.subscription_status === 'active' &&
    (!org.subscription_expires_at || org.subscription_expires_at > new Date());

  if (isPaidActive) return;

  const count = await prisma.contributor.count({ where: { fundraiser_id: fundraiserId } });
  if (count >= SPARK_CONTRIBUTOR_LIMIT) {
    const err = new Error(`Free Spark plan allows up to ${SPARK_CONTRIBUTOR_LIMIT} contributors. Upgrade to add more.`);
    err.statusCode = 403;
    throw err;
  }
};

const listContributors = async (fundraiserId, organizerId) => {
  const fundraiser = await prisma.fundraiser.findUnique({ where: { id: fundraiserId } });
  if (!fundraiser || fundraiser.organizer_id !== organizerId) {
    const err = new Error('Fundraiser not found.'); err.statusCode = 404; throw err;
  }
  return prisma.contributor.findMany({
    where: { fundraiser_id: fundraiserId },
    orderBy: { registered_at: 'desc' },
  });
};

const registerContributor = async (token, { full_name, phone_number, pledge_amount, whatsapp_name }) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { registration_link_token: token },
    select: { id: true, status: true, title: true, account_reference: true, paybill_number: true, till_number: true, whatsapp_group_id: true, target_amount: true, total_paid: true },
  });

  if (!fundraiser) {
    const err = new Error('Invalid registration link.'); err.statusCode = 404; throw err;
  }
  if (fundraiser.status !== 'active') {
    const err = new Error('This fundraiser is no longer accepting registrations.'); err.statusCode = 400; throw err;
  }

  await checkContributorLimit(fundraiser.id);

  const normalized = normalizePhone(phone_number);
  if (!normalized) {
    const err = new Error('Invalid phone number.'); err.statusCode = 400; throw err;
  }

  const existing = await prisma.contributor.findFirst({
    where: { fundraiser_id: fundraiser.id, phone_number: normalized },
  });
  if (existing) {
    const err = new Error('This phone number is already registered for this fundraiser.'); err.statusCode = 409; throw err;
  }

  const contributor = await prisma.contributor.create({
    data: {
      fundraiser_id: fundraiser.id,
      full_name,
      phone_number: normalized,
      whatsapp_name: whatsapp_name || null,
      pledge_amount: pledge_amount || 0,
      pledge_status: pledge_amount > 0 ? 'pledged' : 'unpledged',
    },
  });

  if (pledge_amount > 0) {
    await prisma.fundraiser.update({
      where: { id: fundraiser.id },
      data: { total_pledged: { increment: pledge_amount } },
    });
  }

  await whatsappService.sendRegistrationConfirmation(fundraiser, contributor).catch(console.error);

  return { contributor, fundraiser };
};

const getContributor = async (fundraiserId, contributorId, organizerId) => {
  const fundraiser = await prisma.fundraiser.findUnique({ where: { id: fundraiserId } });
  if (!fundraiser || fundraiser.organizer_id !== organizerId) {
    const err = new Error('Fundraiser not found.'); err.statusCode = 404; throw err;
  }
  const contributor = await prisma.contributor.findFirst({
    where: { id: contributorId, fundraiser_id: fundraiserId },
  });
  if (!contributor) {
    const err = new Error('Contributor not found.'); err.statusCode = 404; throw err;
  }
  return contributor;
};

const updateContributor = async (fundraiserId, contributorId, organizerId, data) => {
  await getContributor(fundraiserId, contributorId, organizerId);
  return prisma.contributor.update({
    where: { id: contributorId },
    data: {
      ...(data.full_name && { full_name: data.full_name }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.pledge_amount !== undefined && { pledge_amount: data.pledge_amount }),
    },
  });
};

const removeContributor = async (fundraiserId, contributorId, organizerId) => {
  const contributor = await getContributor(fundraiserId, contributorId, organizerId);
  if (contributor.pledge_amount > 0) {
    await prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: { total_pledged: { decrement: contributor.pledge_amount } },
    });
  }
  return prisma.contributor.delete({ where: { id: contributorId } });
};

const listUnpaid = async (fundraiserId, organizerId) => {
  const fundraiser = await prisma.fundraiser.findUnique({ where: { id: fundraiserId } });
  if (!fundraiser || fundraiser.organizer_id !== organizerId) {
    const err = new Error('Fundraiser not found.'); err.statusCode = 404; throw err;
  }
  return prisma.contributor.findMany({
    where: { fundraiser_id: fundraiserId, pledge_status: { in: ['unpledged', 'pledged', 'partial'] } },
    orderBy: { registered_at: 'asc' },
  });
};

const sendReminder = async (fundraiserId, contributorId, organizerId) => {
  const fundraiser = await prisma.fundraiser.findUnique({ where: { id: fundraiserId } });
  if (!fundraiser || fundraiser.organizer_id !== organizerId) {
    const err = new Error('Fundraiser not found.'); err.statusCode = 404; throw err;
  }
  const contributor = await prisma.contributor.findFirst({
    where: { id: contributorId, fundraiser_id: fundraiserId },
  });
  if (!contributor) {
    const err = new Error('Contributor not found.'); err.statusCode = 404; throw err;
  }

  await whatsappService.sendReminder(fundraiser, contributor);

  return prisma.contributor.update({
    where: { id: contributorId },
    data: {
      reminder_count: { increment: 1 },
      last_reminder_at: new Date(),
    },
  });
};

module.exports = {
  listContributors,
  registerContributor,
  getContributor,
  updateContributor,
  removeContributor,
  listUnpaid,
  sendReminder,
};
