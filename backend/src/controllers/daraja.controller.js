const darajaService = require('../services/daraja.service');

const connectDaraja = async (req, res, next) => {
  try {
    const fundraiser = await darajaService.connectFundraiserToDaraja(req.params.id, req.organizer.id);
    res.json({ message: 'Daraja webhook registered successfully.', fundraiser });
  } catch (err) {
    next(err);
  }
};

module.exports = { connectDaraja };
