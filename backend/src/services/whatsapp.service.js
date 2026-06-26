const prisma = require('../utils/prisma');
const { normalizePhone } = require('../utils/phone');
const waClient = require('../utils/whatsapp.client');
const conversation = require('../utils/conversation');

const toChatId = (id) => {
  if (id.includes('@')) return id;
  // Bare phone number → DM
  return `${id}@c.us`;
};

const msgs = {
  en: {
    paymentConfirmation: (name, amount, total, target, pct) =>
      `✅ ${name} has paid KES ${amount.toLocaleString()}. Total: KES ${total.toLocaleString()}/${target.toLocaleString()} (${pct}%)`,
    registrationPersonal: (name, pledge, payTo, ref) =>
      `👋 Welcome ${name}! Your pledge of KES ${pledge.toLocaleString()} has been recorded.\nSend to: ${payTo} | Ref: ${ref}`,
    registrationGroup: (name, pledge) =>
      `🆕 ${name} has joined with a pledge of KES ${pledge.toLocaleString()}.`,
    reminder: (name, balance, payTo, ref) =>
      `Hi ${name}, you still have KES ${balance.toLocaleString()} left on your pledge.\nSend now: ${payTo} | Ref: ${ref}`,
    unmatched: (name, phone, amount) =>
      `⚠️ Unmatched payment: ${name} (${phone}) sent KES ${amount.toLocaleString()}. Go to Pochi dashboard to match it.`,
    totalReply: (title, total, target, pct, count) =>
      `📈 ${title}\nRaised: KES ${total.toLocaleString()}\nTarget: KES ${target.toLocaleString()}\nProgress: ${pct}%\nContributors: ${count}`,
    statusNotFound: (link) =>
      `You're not on the list yet. Register first: ${link}`,
    statusFound: (name, pledge, paid, balance) =>
      `📊 ${name}\nPledge: KES ${pledge.toLocaleString()}\nPaid: KES ${paid.toLocaleString()}\nBalance: KES ${balance.toLocaleString()}`,
    groupConnect: (link) =>
      `👋 Hello everyone! I'm Pochi, your fundraiser bot.\nPlease register before sending your contribution so we can track payments easily:\n${link}\n\nType *TOTAL* anytime to see the fundraiser progress, or *STATUS* to check your personal balance.`,
  },
  sw: {
    paymentConfirmation: (name, amount, total, target, pct) =>
      `✅ ${name} ameweka KES ${amount.toLocaleString()}. Jumla: KES ${total.toLocaleString()}/${target.toLocaleString()} (${pct}%)`,
    registrationPersonal: (name, pledge, payTo, ref) =>
      `👋 Karibu ${name}! Pledge yako ya KES ${pledge.toLocaleString()} imeandikwa.\nTuma: ${payTo} | Ref: ${ref}`,
    registrationGroup: (name, pledge) =>
      `🆕 ${name} amejisajili na pledge ya KES ${pledge.toLocaleString()}.`,
    reminder: (name, balance, payTo, ref) =>
      `Habari ${name}, bado una KES ${balance.toLocaleString()} ya pledge yako.\nTuma sasa: ${payTo} | Ref: ${ref}`,
    unmatched: (name, phone, amount) =>
      `⚠️ Malipo hayakutambuliwa: ${name} (${phone}) aliweka KES ${amount.toLocaleString()}. Ingia kwenye Pochi dashboard kuoanisha.`,
    totalReply: (title, total, target, pct, count) =>
      `📈 ${title}\nImekusanywa: KES ${total.toLocaleString()}\nLengwa: KES ${target.toLocaleString()}\nMaendeleo: ${pct}%\nWachangiaji: ${count}`,
    statusNotFound: (link) =>
      `Sijakupata kwenye orodha. Jisajili kwanza: ${link}`,
    statusFound: (name, pledge, paid, balance) =>
      `📊 ${name}\nAhadi: KES ${pledge.toLocaleString()}\nImelipwa: KES ${paid.toLocaleString()}\nSalio: KES ${balance.toLocaleString()}`,
    groupConnect: (link) =>
      `👋 Habari wote! Mimi ni Pochi, bot wenu wa harambee.\nTafadhali jisajili kabla ya kutuma mchango, ili tuweze kufuatilia malipo kwa urahisi:\n${link}\n\nAndika *TOTAL* kuona maendeleo, au *STATUS* kuona salio lako.`,
  },
};

const t = (lang) => msgs[lang] || msgs.en;

const sendMessage = async (to, message, fundraiserId, messageType) => {
  const chatId = toChatId(to);

  if (!waClient.isReady()) {
    console.log(`[WhatsApp NOT READY] to=${chatId} type=${messageType}\n${message}`);
    await prisma.whatsappMessage.create({
      data: {
        fundraiser_id: fundraiserId,
        recipient: chatId,
        message_type: messageType,
        message_body: message,
        status: 'failed',
      },
    });
    return;
  }

  try {
    await waClient.getClient().sendMessage(chatId, message);
    console.log(`[WhatsApp] Message sent to ${chatId}`);
    await prisma.whatsappMessage.create({
      data: {
        fundraiser_id: fundraiserId,
        recipient: chatId,
        message_type: messageType,
        message_body: message,
        status: 'sent',
      },
    });
  } catch (err) {
    console.error(`[WhatsApp] Failed to send to ${chatId}:`, err.message);
    try {
      await prisma.whatsappMessage.create({
        data: {
          fundraiser_id: fundraiserId,
          recipient: chatId,
          message_type: messageType,
          message_body: message,
          status: 'failed',
        },
      });
    } catch (dbErr) {
      console.error(`[WhatsApp] Also failed to write WhatsApp message to DB:`, dbErr.message);
    }
  }
};

const buildLeaderboard = async (fundraiserId) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
    include: { contributors: { orderBy: { registered_at: 'asc' } } },
  });
  if (!fundraiser) return null;

  const lines = [`🏦 *${fundraiser.title} — Contributions*\n`];

  fundraiser.contributors.forEach((c, i) => {
    const paid = c.paid_amount;
    const pledge = c.pledge_amount;
    const balance = pledge - paid;
    let row;

    if (c.pledge_status === 'complete' || c.pledge_status === 'overpaid') {
      row = `${i + 1}. ${c.full_name}  ${paid.toLocaleString()} ✅ Paid`;
    } else if (c.pledge_status === 'partial') {
      row = `${i + 1}. ${c.full_name}  ${paid.toLocaleString()} ✅ 🅱️ ${balance.toLocaleString()}`;
    } else if (c.pledge_status === 'pledged') {
      row = `${i + 1}. ${c.full_name}  ${pledge.toLocaleString()} 🅿️`;
    } else {
      row = `${i + 1}. ${c.full_name}`;
    }
    lines.push(row);
  });

  const remaining = Math.max(0, fundraiser.total_pledged - fundraiser.total_paid);
  lines.push('');
  lines.push(`💰 Pledged:   ${fundraiser.total_pledged.toLocaleString()}`);
  lines.push(`✅ Paid:      ${fundraiser.total_paid.toLocaleString()}`);
  lines.push(`⏳ Remaining: ${remaining.toLocaleString()}`);

  return lines.join('\n');
};

const postLeaderboard = async (fundraiserId) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
    select: { id: true, whatsapp_group_id: true },
  });
  if (!fundraiser?.whatsapp_group_id) return;

  const message = await buildLeaderboard(fundraiserId);
  if (message) await sendMessage(fundraiser.whatsapp_group_id, message, fundraiserId, 'group_update');
};

const sendRegistrationConfirmation = async (fundraiser, contributor) => {
  const payTo = fundraiser.paybill_number
    ? `Paybill ${fundraiser.paybill_number}`
    : `Till ${fundraiser.till_number}`;

  const lang = t(fundraiser.bot_language);

  if (contributor.phone_number) {
    const personalMsg = lang.registrationPersonal(
      contributor.full_name, contributor.pledge_amount, payTo, fundraiser.account_reference
    );
    await sendMessage(contributor.phone_number, personalMsg, fundraiser.id, 'registration');
  }

  if (fundraiser.whatsapp_group_id) {
    await postLeaderboard(fundraiser.id);
  }
};

const sendReminder = async (fundraiser, contributor) => {
  const balance = contributor.pledge_amount - contributor.paid_amount;
  const payTo = fundraiser.paybill_number
    ? `Paybill ${fundraiser.paybill_number}`
    : `Till ${fundraiser.till_number}`;

  const message = t(fundraiser.bot_language).reminder(
    contributor.full_name, balance, payTo, fundraiser.account_reference
  );

  await sendMessage(contributor.phone_number, message, fundraiser.id, 'reminder');
};

const notifyUnmatched = async (fundraiser, senderName, senderPhone, amount) => {
  const message = t(fundraiser.bot_language).unmatched(senderName, senderPhone, amount);

  if (fundraiser.whatsapp_group_id) {
    await sendMessage(fundraiser.whatsapp_group_id, message, fundraiser.id, 'group_update');
  }
};

const sendGroupConnectAnnouncement = async (fundraiser) => {
  if (!fundraiser.whatsapp_group_id) return;
  const link = `${process.env.FRONTEND_URL}/register/${fundraiser.registration_link_token}`;
  const message = t(fundraiser.bot_language).groupConnect(link);
  await sendMessage(fundraiser.whatsapp_group_id, message, fundraiser.id, 'group_update');
};

const findContributorByPhone = async (fundraiserId, phone) => {
  if (!phone) return null;
  const normalized = normalizePhone(phone);
  return prisma.contributor.findFirst({
    where: { fundraiser_id: fundraiserId, phone_number: normalized || phone },
  });
};

const handleIncomingMessage = async (from, message, fundraiserId, senderPhone, senderWaId) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
    select: {
      id: true, title: true, target_amount: true, total_paid: true, total_pledged: true,
      account_reference: true, registration_link_token: true,
      paybill_number: true, till_number: true, bot_language: true,
    },
  });

  if (!fundraiser) return;

  const lang = t(fundraiser.bot_language);
  const cmd = message.trim().toUpperCase();

  if (cmd === 'TOTAL') {
    const pct = fundraiser.target_amount > 0
      ? Math.round((fundraiser.total_paid / fundraiser.target_amount) * 100)
      : 0;
    const count = await prisma.contributor.count({ where: { fundraiser_id: fundraiserId } });
    const reply = lang.totalReply(
      fundraiser.title, fundraiser.total_paid, fundraiser.target_amount, pct, count
    );
    await sendMessage(from, reply, fundraiserId, 'group_update');
    return;
  }

  // STATUS — two behaviours:
  // "STATUS"              → post the full leaderboard to the group
  // "STATUS 0707110120"   → personal balance lookup by phone number
  const statusMatch = message.trim().match(/^status(?:\s+(\d+))?$/i);
  if (statusMatch) {
    const phoneArg = statusMatch[1] || null;

    if (!phoneArg) {
      // No phone — post overall leaderboard
      await postLeaderboard(fundraiserId);
      return;
    }

    // Phone provided — personal status sent as a DM to the requester
    const contributor = await findContributorByPhone(fundraiserId, phoneArg);
    const dmTarget = senderWaId || from;
    if (!contributor) {
      await sendMessage(dmTarget, `No contributor found with that number. Make sure you registered via the link.`, fundraiserId, 'confirmation');
      return;
    }

    const balance = contributor.pledge_amount - contributor.paid_amount;
    const reply = lang.statusFound(
      contributor.full_name, contributor.pledge_amount, contributor.paid_amount, balance
    );
    await sendMessage(dmTarget, reply, fundraiserId, 'confirmation');
    return;
  }

  // Parse "pledge <amount>" sent in the group
  const pledgeMatch = message.trim().match(/^pledge\s+(\d+)$/i);
  if (pledgeMatch) {
    const pledgeAmount = parseInt(pledgeMatch[1], 10);
    const contributor = await findContributorByPhone(fundraiserId, senderPhone);

    if (!contributor) {
      // Start WhatsApp-native registration flow if we have the sender's WA ID
      if (senderWaId) {
        await startRegistrationConversation(senderWaId, fundraiserId, from, pledgeAmount, fundraiser);
      } else {
        const link = `${process.env.FRONTEND_URL}/register/${fundraiser.registration_link_token}`;
        await sendMessage(from, lang.statusNotFound(link), fundraiserId, 'confirmation');
      }
      return;
    }

    const oldPledge = contributor.pledge_amount;
    let pledgeStatus;
    if (contributor.paid_amount >= pledgeAmount) {
      pledgeStatus = contributor.paid_amount > pledgeAmount ? 'overpaid' : 'complete';
    } else if (contributor.paid_amount > 0) {
      pledgeStatus = 'partial';
    } else {
      pledgeStatus = 'pledged';
    }

    await prisma.contributor.update({
      where: { id: contributor.id },
      data: { pledge_amount: pledgeAmount, pledge_status: pledgeStatus },
    });

    const diff = pledgeAmount - oldPledge;
    if (diff !== 0) {
      await prisma.fundraiser.update({
        where: { id: fundraiserId },
        data: { total_pledged: { increment: diff } },
      });
    }

    await postLeaderboard(fundraiserId);
  }
};

const dmSend = async (waId, text) => {
  const client = waClient.getClient();
  if (client) {
    try { await client.sendMessage(waId, text); } catch (e) { console.error('[WA DM]', e.message); }
  }
};

const startRegistrationConversation = async (waId, fundraiserId, groupId, pledgeAmount, fundraiser) => {
  conversation.set(
    waId,
    'waiting_for_name',
    { fundraiserId, groupId, pledgeAmount },
    () => dmSend(waId, `⏰ Registration timed out. Type *pledge <amount>* in the group to start again.`)
  );

  await dmSend(waId,
    `👋 Hi! I noticed you pledged *KES ${pledgeAmount.toLocaleString()}* for *${fundraiser.title}*.\n\n` +
    `Let's get you registered so we can track your M-Pesa payment! 🎉\n\n` +
    `What's your full name?`
  );
};

const handleDmMessage = async (waId, message) => {
  const session = conversation.get(waId);
  if (!session) return false;

  const { step, data } = session;
  const text = message.trim();

  if (text.toUpperCase() === 'CANCEL') {
    conversation.clear(waId);
    await dmSend(waId, `❌ Registration cancelled. Type *pledge <amount>* in the group to start again anytime.`);
    return true;
  }

  if (step === 'waiting_for_name') {
    if (text.length < 2 || /^\d+$/.test(text)) {
      await dmSend(waId, `⚠️ Please enter your full name (e.g. Brian Mutunga).`);
      return true;
    }
    conversation.update(waId, 'waiting_for_phone', { ...data, name: text });
    await dmSend(waId,
      `Thanks *${text}*! 👍\n\n` +
      `What's your Safaricom number? (e.g. 0707110120)\n\n` +
      `_This is used to automatically match your M-Pesa payment._`
    );
    return true;
  }

  if (step === 'waiting_for_phone') {
    const normalized = normalizePhone(text);
    if (!normalized) {
      await dmSend(waId, `⚠️ That doesn't look like a valid Kenyan number. Try again (e.g. 0707110120).`);
      return true;
    }

    const existing = await prisma.contributor.findFirst({
      where: { fundraiser_id: data.fundraiserId, phone_number: normalized },
    });
    if (existing) {
      conversation.clear(waId);
      await dmSend(waId, `⚠️ The number *${text}* is already registered under *${existing.full_name}*.`);
      return true;
    }

    const fundraiser = await prisma.fundraiser.findUnique({
      where: { id: data.fundraiserId },
      select: { title: true, paybill_number: true, till_number: true, account_reference: true },
    });

    conversation.update(waId, 'waiting_for_confirmation', { ...data, phone: normalized, rawPhone: text, fundraiser });
    await dmSend(waId,
      `Here's your registration summary:\n\n` +
      `👤 *Name:* ${data.name}\n` +
      `📱 *Phone:* ${text}\n` +
      `💰 *Pledge:* KES ${data.pledgeAmount.toLocaleString()}\n` +
      `🏦 *Fundraiser:* ${fundraiser.title}\n\n` +
      `Reply *YES* to confirm or *NO* to cancel.`
    );
    return true;
  }

  if (step === 'waiting_for_confirmation') {
    const answer = text.toUpperCase();

    if (answer === 'NO') {
      conversation.clear(waId);
      await dmSend(waId, `❌ Registration cancelled. Type *pledge <amount>* in the group to start again anytime.`);
      return true;
    }

    if (answer !== 'YES') {
      await dmSend(waId, `Please reply *YES* to confirm or *NO* to cancel.`);
      return true;
    }

    const { fundraiserId, groupId, pledgeAmount, name, phone, fundraiser } = data;

    try {
      await prisma.contributor.create({
        data: {
          fundraiser_id: fundraiserId,
          full_name: name,
          phone_number: phone,
          pledge_amount: pledgeAmount,
          pledge_status: 'pledged',
        },
      });

      await prisma.fundraiser.update({
        where: { id: fundraiserId },
        data: { total_pledged: { increment: pledgeAmount } },
      });

      const payTo = fundraiser.paybill_number
        ? `Paybill *${fundraiser.paybill_number}*`
        : `Till *${fundraiser.till_number}*`;

      conversation.clear(waId);

      await dmSend(waId,
        `✅ You're registered, *${name}*!\n\n` +
        `Your pledge of *KES ${pledgeAmount.toLocaleString()}* has been recorded for *${fundraiser.title}*.\n\n` +
        `💳 Send your M-Pesa to ${payTo}\n` +
        `🔑 Reference: *${fundraiser.account_reference}*`
      );

      if (groupId) await postLeaderboard(fundraiserId);

    } catch (err) {
      conversation.clear(waId);
      console.error('[WA Registration]', err.message);
      await dmSend(waId, `⚠️ Something went wrong. Please try registering via the link instead.`);
    }

    return true;
  }

  return false;
};

module.exports = {
  postLeaderboard,
  sendRegistrationConfirmation,
  sendReminder,
  notifyUnmatched,
  sendGroupConnectAnnouncement,
  handleIncomingMessage,
  handleDmMessage,
};
