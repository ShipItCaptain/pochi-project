const cron = require('node-cron');
const prisma = require('../utils/prisma');
const whatsappService = require('../services/whatsapp.service');

const MAX_AUTO_REMINDERS = 2;

const sendScheduledReminders = async () => {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const fundraisers = await prisma.fundraiser.findMany({
    where: {
      status: 'active',
      deadline: { lte: in72h, gte: now },
    },
    select: { id: true, title: true, account_reference: true, paybill_number: true, till_number: true, whatsapp_group_id: true, target_amount: true, total_paid: true, deadline: true },
  });

  for (const fundraiser of fundraisers) {
    const hoursLeft = (fundraiser.deadline - now) / (60 * 60 * 1000);

    const contributors = await prisma.contributor.findMany({
      where: {
        fundraiser_id: fundraiser.id,
        pledge_status: { in: ['pledged', 'partial'] },
        reminder_count: { lt: MAX_AUTO_REMINDERS },
      },
    });

    for (const contributor of contributors) {
      const balance = contributor.pledge_amount - contributor.paid_amount;
      if (balance <= 0) continue;

      const lastReminder = contributor.last_reminder_at;
      const cooloffHours = 24;
      if (lastReminder && (now - lastReminder) < cooloffHours * 60 * 60 * 1000) continue;

      await whatsappService.sendReminder(fundraiser, contributor).catch(console.error);

      await prisma.contributor.update({
        where: { id: contributor.id },
        data: {
          reminder_count: { increment: 1 },
          last_reminder_at: now,
        },
      });
    }
  }
};

const start = () => {
  // Run daily at 9am Nairobi time (UTC+3 = 06:00 UTC)
  cron.schedule('0 6 * * *', async () => {
    console.log('[ReminderJob] Running scheduled reminders...');
    try {
      await sendScheduledReminders();
      console.log('[ReminderJob] Done.');
    } catch (err) {
      console.error('[ReminderJob] Error:', err.message);
    }
  });

  console.log('[ReminderJob] Scheduled — runs daily at 09:00 EAT');
};

module.exports = { start, sendScheduledReminders };
