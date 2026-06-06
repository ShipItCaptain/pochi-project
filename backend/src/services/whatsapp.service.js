const axios = require('axios');
const prisma = require('../utils/prisma');
const { normalizePhone } = require('../utils/phone');

const AT_BASE = 'https://api.africastalking.com/version1';

const sendMessage = async (to, message, fundraiserId, messageType) => {
  if (process.env.NODE_ENV === 'development' && !process.env.AT_API_KEY) {
    console.log(`[DEV WhatsApp] to=${to} type=${messageType}\n${message}`);
    await prisma.whatsappMessage.create({
      data: {
        fundraiser_id: fundraiserId,
        recipient: to,
        message_type: messageType,
        message_body: message,
        status: 'sent',
      },
    });
    return;
  }

  try {
    const response = await axios.post(
      `${AT_BASE}/messaging`,
      {
        username: process.env.AT_USERNAME,
        to,
        message,
        from: process.env.AT_WHATSAPP_NUMBER,
      },
      {
        headers: {
          apiKey: process.env.AT_API_KEY,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const atMessageId = response.data?.SMSMessageData?.Recipients?.[0]?.messageId;

    await prisma.whatsappMessage.create({
      data: {
        fundraiser_id: fundraiserId,
        recipient: to,
        message_type: messageType,
        message_body: message,
        status: 'sent',
        at_message_id: atMessageId || null,
      },
    });
  } catch (err) {
    await prisma.whatsappMessage.create({
      data: {
        fundraiser_id: fundraiserId,
        recipient: to,
        message_type: messageType,
        message_body: message,
        status: 'failed',
      },
    });
  }
};

const sendPaymentConfirmation = async (fundraiser, contributor, amount, newTotal) => {
  const pct = fundraiser.target_amount > 0
    ? Math.round((newTotal / fundraiser.target_amount) * 100)
    : 0;

  const message = `✅ ${contributor.full_name} ameweka KES ${amount.toLocaleString()}. Jumla: KES ${newTotal.toLocaleString()}/${fundraiser.target_amount.toLocaleString()} (${pct}%)`;

  await sendMessage(fundraiser.whatsapp_group_id, message, fundraiser.id, 'group_update');
};

const sendRegistrationConfirmation = async (fundraiser, contributor) => {
  const payTo = fundraiser.paybill_number
    ? `Paybill ${fundraiser.paybill_number}`
    : `Till ${fundraiser.till_number}`;

  const message = `👋 Karibu ${contributor.full_name}! Pledge yako ya KES ${contributor.pledge_amount.toLocaleString()} imeandikwa.\nTuma: ${payTo} | Ref: ${fundraiser.account_reference}`;

  if (contributor.phone_number) {
    await sendMessage(contributor.phone_number, message, fundraiser.id, 'registration');
  }

  if (fundraiser.whatsapp_group_id) {
    const groupMsg = `🆕 ${contributor.full_name} amejisajili na pledge ya KES ${contributor.pledge_amount.toLocaleString()}.`;
    await sendMessage(fundraiser.whatsapp_group_id, groupMsg, fundraiser.id, 'registration');
  }
};

const sendReminder = async (fundraiser, contributor) => {
  const balance = contributor.pledge_amount - contributor.paid_amount;
  const payTo = fundraiser.paybill_number
    ? `Paybill ${fundraiser.paybill_number}`
    : `Till ${fundraiser.till_number}`;

  const message = `Habari ${contributor.full_name}, bado una KES ${balance.toLocaleString()} ya pledge yako.\nTuma sasa: ${payTo} | Ref: ${fundraiser.account_reference}`;

  await sendMessage(contributor.phone_number, message, fundraiser.id, 'reminder');
};

const notifyUnmatched = async (fundraiser, senderName, senderPhone, amount) => {
  const message = `⚠️ Malipo hayakutambuliwa: ${senderName} (${senderPhone}) aliweka KES ${amount.toLocaleString()}. Ingia kwenye Pochi dashboard kuoanisha.`;

  if (fundraiser.whatsapp_group_id) {
    await sendMessage(fundraiser.whatsapp_group_id, message, fundraiser.id, 'group_update');
  }
};

const handleIncomingMessage = async (from, message, fundraiserId) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
    select: { id: true, title: true, target_amount: true, total_paid: true, account_reference: true, registration_link_token: true, paybill_number: true, till_number: true },
  });

  if (!fundraiser) return;

  const cmd = message.trim().toUpperCase();

  if (cmd === 'TOTAL') {
    const pct = fundraiser.target_amount > 0
      ? Math.round((fundraiser.total_paid / fundraiser.target_amount) * 100)
      : 0;
    const count = await prisma.contributor.count({ where: { fundraiser_id: fundraiserId } });
    const reply = `📈 ${fundraiser.title}\nRaised: KES ${fundraiser.total_paid.toLocaleString()}\nTarget: KES ${fundraiser.target_amount.toLocaleString()}\nProgress: ${pct}%\nContributors: ${count}`;
    await sendMessage(from, reply, fundraiserId, 'group_update');
    return;
  }

  if (cmd === 'STATUS') {
    const normalized = normalizePhone(from);
    const contributor = await prisma.contributor.findFirst({
      where: { fundraiser_id: fundraiserId, phone_number: normalized || from },
    });

    if (!contributor) {
      await sendMessage(from, `Sijakupata kwenye orodha. Jisajili kwanza: ${process.env.FRONTEND_URL}/register/${fundraiser.registration_link_token}`, fundraiserId, 'confirmation');
      return;
    }

    const balance = contributor.pledge_amount - contributor.paid_amount;
    const reply = `📊 ${contributor.full_name}\nPledge: KES ${contributor.pledge_amount.toLocaleString()}\nPaid: KES ${contributor.paid_amount.toLocaleString()}\nBalance: KES ${balance.toLocaleString()}`;
    await sendMessage(from, reply, fundraiserId, 'confirmation');
  }
};

module.exports = {
  sendPaymentConfirmation,
  sendRegistrationConfirmation,
  sendReminder,
  notifyUnmatched,
  handleIncomingMessage,
};
