const prisma = require('../utils/prisma');
const { normalizePhone } = require('../utils/phone');
const whatsappService = require('./whatsapp.service');

const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

const similarity = (a, b) => {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(s1, s2) / maxLen;
};

const FUZZY_THRESHOLD = 0.8;

/**
 * Core matching algorithm — runs on every incoming Daraja webhook.
 * Returns the created transaction record.
 */
const processIncomingPayment = async (fundraiserId, payload) => {
  const {
    TransID,
    TransAmount,
    MSISDN,
    FirstName,
    MiddleName,
    LastName,
    BillRefNumber,
  } = payload;

  const senderName = [FirstName, MiddleName, LastName].filter(Boolean).join(' ').trim();
  const senderPhone = normalizePhone(MSISDN) || MSISDN;
  const amount = Math.round(parseFloat(TransAmount));

  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
    select: { id: true, title: true, target_amount: true, total_paid: true, account_reference: true, whatsapp_group_id: true, paybill_number: true, till_number: true },
  });

  if (!fundraiser) {
    throw new Error(`Fundraiser ${fundraiserId} not found.`);
  }

  // Idempotency — reject duplicate transaction IDs
  const existing = await prisma.transaction.findUnique({ where: { mpesa_transaction_id: TransID } });
  if (existing) return existing;

  // --- Matching algorithm ---
  let matchedContributor = null;
  let matchStatus = 'unmatched';
  let matchedBy = null;

  const contributors = await prisma.contributor.findMany({
    where: { fundraiser_id: fundraiserId },
  });

  // Step 1 & 2: Phone match (exact or normalized)
  const normalizedSender = normalizePhone(senderPhone);
  if (normalizedSender) {
    matchedContributor = contributors.find(c => c.phone_number === normalizedSender);
    if (!matchedContributor) {
      matchedContributor = contributors.find(c => normalizePhone(c.phone_number) === normalizedSender);
    }
    if (matchedContributor) {
      matchStatus = 'auto_matched';
      matchedBy = 'system';
    }
  }

  // Step 3: Account reference match
  if (!matchedContributor && BillRefNumber) {
    const refUpper = BillRefNumber.toUpperCase().trim();
    if (refUpper === fundraiser.account_reference.toUpperCase()) {
      // Ref matches fundraiser — phone was the primary key, already checked
    }
  }

  // Step 4: Fuzzy name match
  if (!matchedContributor && senderName) {
    let bestScore = 0;
    let bestMatch = null;
    for (const c of contributors) {
      const score = similarity(senderName, c.full_name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = c;
      }
    }
    if (bestScore >= FUZZY_THRESHOLD) {
      matchedContributor = bestMatch;
      matchStatus = 'auto_matched';
      matchedBy = 'system';
    }
  }

  const now = new Date();

  // Create transaction record
  const transaction = await prisma.transaction.create({
    data: {
      fundraiser_id: fundraiserId,
      contributor_id: matchedContributor?.id || null,
      mpesa_transaction_id: TransID,
      mpesa_sender_name: senderName || 'Unknown',
      mpesa_sender_phone: senderPhone,
      amount,
      account_reference: BillRefNumber || null,
      match_status: matchStatus,
      matched_at: matchedContributor ? now : null,
      matched_by: matchedBy,
      daraja_raw_payload: payload,
      received_at: now,
    },
  });

  if (matchedContributor) {
    const newPaid = matchedContributor.paid_amount + amount;
    let pledge_status = matchedContributor.pledge_status;

    if (matchedContributor.pledge_amount > 0) {
      if (newPaid >= matchedContributor.pledge_amount) {
        pledge_status = newPaid > matchedContributor.pledge_amount ? 'overpaid' : 'complete';
      } else {
        pledge_status = 'partial';
      }
    }

    await prisma.contributor.update({
      where: { id: matchedContributor.id },
      data: { paid_amount: newPaid, last_payment_at: now, pledge_status },
    });

    const newTotal = fundraiser.total_paid + amount;
    await prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: { total_paid: newTotal },
    });

    // Send WhatsApp group update
    if (fundraiser.whatsapp_group_id) {
      await whatsappService.sendPaymentConfirmation(fundraiser, matchedContributor, amount, newTotal).catch(console.error);
    }
  } else {
    // Unmatched — notify organizer
    if (fundraiser.whatsapp_group_id) {
      await whatsappService.notifyUnmatched(fundraiser, senderName, senderPhone, amount).catch(console.error);
    }
  }

  return transaction;
};

module.exports = { processIncomingPayment };
