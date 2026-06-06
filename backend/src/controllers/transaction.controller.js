const Joi = require('joi');
const transactionService = require('../services/transaction.service');

const matchSchema = Joi.object({
  contributor_id: Joi.string().uuid().required(),
});

const list = async (req, res, next) => {
  try {
    const transactions = await transactionService.listTransactions(req.params.id, req.organizer.id);
    res.json(transactions);
  } catch (err) { next(err); }
};

const listUnmatched = async (req, res, next) => {
  try {
    const transactions = await transactionService.listUnmatched(req.params.id, req.organizer.id);
    res.json(transactions);
  } catch (err) { next(err); }
};

const manualMatch = async (req, res, next) => {
  try {
    const { error, value } = matchSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const transaction = await transactionService.manualMatch(
      req.params.id, req.params.tid, value.contributor_id, req.organizer.id
    );
    res.json(transaction);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransaction(req.params.id, req.params.tid, req.organizer.id);
    res.json(transaction);
  } catch (err) { next(err); }
};

module.exports = { list, listUnmatched, manualMatch, getOne };
