const whatsappService = require('../services/whatsapp.service');
const prisma = require('../utils/prisma');
const { normalizePhone } = require('../utils/phone');

const handleIncoming = async (req, res) => {
  try {
    // Africa's Talking sends: from (sender), to (bot number), text
    const { from, to, text } = req.body;

    if (!from || !text || !to) {
      return res.json({ status: 'ok' });
    }

    const normalizedTo = normalizePhone(to) || to.replace(/^\+/, '');
    const fundraiser = await prisma.fundraiser.findFirst({
      where: { bot_phone_number: normalizedTo, status: 'active' },
      select: { id: true },
    });

    if (!fundraiser) {
      return res.json({ status: 'ok' });
    }

    await whatsappService.handleIncomingMessage(from, text, fundraiser.id);
  } catch (err) {
    console.error('[WhatsApp webhook error]', err.message);
  }

  res.json({ status: 'ok' });
};

module.exports = { handleIncoming };
