const darajaService = require('../services/daraja.service');

const connectDaraja = async (req, res, next) => {
  try {
    const fundraiser = await darajaService.connectFundraiserToDaraja(req.params.id, req.organizer.id);
    res.json({ message: 'Daraja webhook registered successfully.', fundraiser });
  } catch (err) {
    next(err);
  }
};

const validateShortcode = async (req, res) => {
  const { shortcode } = req.body;

  if (!shortcode || !/^\d{5,7}$/.test(String(shortcode).trim())) {
    return res.status(400).json({ valid: false, message: 'Enter a valid shortcode (5–7 digits).' });
  }

  // Skip live check in sandbox — Safaricom sandbox accepts any shortcode
  if (process.env.DARAJA_ENV !== 'live') {
    return res.json({ valid: true, sandbox: true, message: 'Sandbox mode — shortcode accepted.' });
  }

  try {
    const result = await darajaService.registerC2BUrls(String(shortcode).trim(), 'validation');
    if (result.ResponseCode === '0') {
      return res.json({ valid: true, message: 'Your shortcode is configured and ready.' });
    }
    return res.json({
      valid: false,
      message: result.ResponseDescription || 'This shortcode is not configured for API access.',
    });
  } catch (err) {
    const msg = err.response?.data?.errorMessage;
    return res.json({
      valid: false,
      message: msg || 'This shortcode isn\'t configured for Daraja webhooks. Visit biz.safaricom.co.ke to register a Paybill, or ask Safaricom to enable your Till for API access.',
    });
  }
};

module.exports = { connectDaraja, validateShortcode };
