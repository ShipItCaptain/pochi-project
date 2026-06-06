const Joi = require('joi');
const subscriptionService = require('../services/subscription.service');

const initiateSchema = Joi.object({
  plan: Joi.string().valid('solo_monthly', 'solo_quarterly', 'solo_biannual', 'solo_annual', 'group', 'enterprise').required(),
});

const listPlans = (req, res) => {
  res.json(subscriptionService.listPlans());
};

const initiate = async (req, res, next) => {
  try {
    const { error, value } = initiateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const result = await subscriptionService.initiatePayment(req.organizer.id, value.plan);
    res.json(result);
  } catch (err) { next(err); }
};

const getStatus = async (req, res, next) => {
  try {
    const status = await subscriptionService.getStatus(req.organizer.id);
    res.json(status);
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await subscriptionService.getHistory(req.organizer.id);
    res.json(history);
  } catch (err) { next(err); }
};

module.exports = { listPlans, initiate, getStatus, getHistory };
