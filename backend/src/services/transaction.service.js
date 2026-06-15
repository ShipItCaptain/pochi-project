const prisma = require('../utils/prisma');
const whatsappService = require('./whatsapp.service');

const verifyFundraiserOwner = async (fundraiserId, organizerId) => {
  const fundraiser = await prisma.fundraiser.findUnique({ where: { id: fundraiserId } });
  if (!fundraiser || fundraiser.organizer_id !== organizerId) {
    const err = new Error('Fundraiser not found.'); err.statusCode = 404; throw err;
  }
  return fundraiser;
};

const listTransactions = async (fundraiserId, organizerId) => {
  await verifyFundraiserOwner(fundraiserId, organizerId);
  return prisma.transaction.findMany({
    where: { fundraiser_id: fundraiserId },
    include: { contributor: { select: { id: true, full_name: true, phone_number: true } } },
    orderBy: { received_at: 'desc' },
  });
};

const listUnmatched = async (fundraiserId, organizerId) => {
  await verifyFundraiserOwner(fundraiserId, organizerId);
  return prisma.transaction.findMany({
    where: { fundraiser_id: fundraiserId, match_status: 'unmatched' },
    orderBy: { received_at: 'desc' },
  });
};

const manualMatch = async (fundraiserId, transactionId, contributorId, organizerId) => {
  const fundraiser = await verifyFundraiserOwner(fundraiserId, organizerId);

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, fundraiser_id: fundraiserId },
  });
  if (!transaction) {
    const err = new Error('Transaction not found.'); err.statusCode = 404; throw err;
  }
  if (transaction.match_status !== 'unmatched') {
    const err = new Error('Transaction is already matched.'); err.statusCode = 400; throw err;
  }

  const contributor = await prisma.contributor.findFirst({
    where: { id: contributorId, fundraiser_id: fundraiserId },
  });
  if (!contributor) {
    const err = new Error('Contributor not found in this fundraiser.'); err.statusCode = 404; throw err;
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: {
        contributor_id: contributorId,
        match_status: 'manually_matched',
        matched_at: now,
        matched_by: 'organizer',
      },
    }),
    prisma.contributor.update({
      where: { id: contributorId },
      data: {
        paid_amount: { increment: transaction.amount },
        last_payment_at: now,
      },
    }),
    prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: { total_paid: { increment: transaction.amount } },
    }),
  ]);

  const updated = await prisma.contributor.findUnique({ where: { id: contributorId } });
  let pledge_status = updated.pledge_status;
  if (updated.pledge_amount > 0) {
    if (updated.paid_amount >= updated.pledge_amount) {
      pledge_status = updated.paid_amount > updated.pledge_amount ? 'overpaid' : 'complete';
    } else {
      pledge_status = 'partial';
    }
    await prisma.contributor.update({ where: { id: contributorId }, data: { pledge_status } });
  }

  if (fundraiser.whatsapp_group_id) {
    const newTotal = fundraiser.total_paid + transaction.amount;
    whatsappService.sendPaymentConfirmation(fundraiser, updated, transaction.amount, newTotal).catch(console.error);
  }

  return prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { contributor: true },
  });
};

const getTransaction = async (fundraiserId, transactionId, organizerId) => {
  await verifyFundraiserOwner(fundraiserId, organizerId);
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, fundraiser_id: fundraiserId },
    include: { contributor: true },
  });
  if (!transaction) {
    const err = new Error('Transaction not found.'); err.statusCode = 404; throw err;
  }
  return transaction;
};

module.exports = { listTransactions, listUnmatched, manualMatch, getTransaction };
