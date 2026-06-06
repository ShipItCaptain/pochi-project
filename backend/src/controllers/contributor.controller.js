const Joi = require('joi');
const contributorService = require('../services/contributor.service');

const registerSchema = Joi.object({
  full_name: Joi.string().max(100).required(),
  phone_number: Joi.string().required(),
  pledge_amount: Joi.number().integer().min(0).default(0),
  whatsapp_name: Joi.string().max(100).optional().allow(''),
});

const updateSchema = Joi.object({
  full_name: Joi.string().max(100).optional(),
  notes: Joi.string().optional().allow('', null),
  pledge_amount: Joi.number().integer().min(0).optional(),
});

const list = async (req, res, next) => {
  try {
    const contributors = await contributorService.listContributors(req.params.id, req.organizer.id);
    res.json(contributors);
  } catch (err) { next(err); }
};

const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const result = await contributorService.registerContributor(req.params.token, value);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const contributor = await contributorService.getContributor(req.params.id, req.params.cid, req.organizer.id);
    res.json(contributor);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const contributor = await contributorService.updateContributor(req.params.id, req.params.cid, req.organizer.id, value);
    res.json(contributor);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await contributorService.removeContributor(req.params.id, req.params.cid, req.organizer.id);
    res.json({ message: 'Contributor removed.' });
  } catch (err) { next(err); }
};

const listUnpaid = async (req, res, next) => {
  try {
    const contributors = await contributorService.listUnpaid(req.params.id, req.organizer.id);
    res.json(contributors);
  } catch (err) { next(err); }
};

const remind = async (req, res, next) => {
  try {
    const contributor = await contributorService.sendReminder(req.params.id, req.params.cid, req.organizer.id);
    res.json({ message: 'Reminder sent.', contributor });
  } catch (err) { next(err); }
};

module.exports = { list, register, getOne, update, remove, listUnpaid, remind };
