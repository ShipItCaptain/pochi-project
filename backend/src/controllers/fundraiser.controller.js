const Joi = require('joi');
const fundraiserService = require('../services/fundraiser.service');
const exportService = require('../services/export.service');

const createSchema = Joi.object({
  title: Joi.string().max(150).required(),
  description: Joi.string().optional().allow(''),
  target_amount: Joi.number().integer().min(1).required(),
  paybill_number: Joi.string().max(20).optional().allow(''),
  account_reference: Joi.string().max(30).uppercase().alphanum().optional().allow('', null),
  till_number: Joi.string().max(20).optional().allow(''),
  deadline: Joi.string().isoDate().optional().allow('', null),
});

const updateSchema = Joi.object({
  title: Joi.string().max(150).optional(),
  description: Joi.string().optional().allow('', null),
  target_amount: Joi.number().integer().min(1).optional(),
  paybill_number: Joi.string().max(20).optional().allow('', null),
  till_number: Joi.string().max(20).optional().allow('', null),
  deadline: Joi.string().isoDate().optional().allow('', null),
  status: Joi.string().valid('active', 'paused', 'closed').optional(),
  bot_language: Joi.string().valid('en', 'sw').optional(),
});

const connectWhatsappSchema = Joi.object({
  whatsapp_group_id: Joi.string().max(100).required(),
  bot_phone_number: Joi.string().max(15).optional(),
});

const list = async (req, res, next) => {
  try {
    const fundraisers = await fundraiserService.listFundraisers(req.organizer.id);
    res.json(fundraisers);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const fundraiser = await fundraiserService.createFundraiser(req.organizer.id, value);
    res.status(201).json(fundraiser);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const fundraiser = await fundraiserService.getFundraiser(req.params.id, req.organizer.id);
    res.json(fundraiser);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const fundraiser = await fundraiserService.updateFundraiser(req.params.id, req.organizer.id, value);
    res.json(fundraiser);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const fundraiser = await fundraiserService.deleteFundraiser(req.params.id, req.organizer.id);
    res.json(fundraiser);
  } catch (err) { next(err); }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await fundraiserService.getFundraiserSummary(req.params.id, req.organizer.id);
    res.json(summary);
  } catch (err) { next(err); }
};

const connectWhatsapp = async (req, res, next) => {
  try {
    const { error, value } = connectWhatsappSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const fundraiser = await fundraiserService.connectWhatsapp(req.params.id, req.organizer.id, value);
    res.json(fundraiser);
  } catch (err) { next(err); }
};

const exportPdf = async (req, res, next) => {
  try {
    const fundraiser = await fundraiserService.getFundraiser(req.params.id, req.organizer.id);
    const pdfBuffer = await exportService.generatePdf(fundraiser);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pochi-${fundraiser.account_reference}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

const exportExcel = async (req, res, next) => {
  try {
    const fundraiser = await fundraiserService.getFundraiser(req.params.id, req.organizer.id);
    const buffer = await exportService.generateExcel(fundraiser);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="pochi-${fundraiser.account_reference}.xlsx"`);
    res.send(buffer);
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, update, remove, getSummary, connectWhatsapp, exportPdf, exportExcel };
