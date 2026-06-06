const express = require('express');
const router = express.Router();
const { register } = require('../controllers/contributor.controller');
const prisma = require('../utils/prisma');

router.post('/:token', register);

router.get('/:token', async (req, res, next) => {
  try {
    const fundraiser = await prisma.fundraiser.findUnique({
      where: { registration_link_token: req.params.token },
      select: {
        id: true,
        title: true,
        description: true,
        target_amount: true,
        total_paid: true,
        total_pledged: true,
        account_reference: true,
        paybill_number: true,
        till_number: true,
        deadline: true,
        status: true,
        _count: { select: { contributors: true } },
      },
    });

    if (!fundraiser) {
      return res.status(404).json({ error: 'Invalid registration link.' });
    }

    res.json(fundraiser);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
