const axios = require('axios');
const prisma = require('../utils/prisma');

const DARAJA_BASE = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  live: 'https://api.safaricom.co.ke',
};

const getBaseUrl = () => DARAJA_BASE[process.env.DARAJA_ENV] || DARAJA_BASE.sandbox;

let cachedToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await axios.get(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  cachedToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

  return cachedToken;
};

const registerC2BUrls = async (shortcode, fundraiserId) => {
  const token = await getAccessToken();

  const response = await axios.post(
    `${getBaseUrl()}/mpesa/c2b/v1/registerurl`,
    {
      ShortCode: shortcode,
      ResponseType: 'Completed',
      ConfirmationURL: `${process.env.DARAJA_CALLBACK_URL}?fundraiser=${fundraiserId}`,
      ValidationURL: `${process.env.DARAJA_VALIDATION_URL}?fundraiser=${fundraiserId}`,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

const initiateSTKPush = async ({ phone_number, amount, account_reference, description }) => {
  const token = await getAccessToken();
  const shortcode = process.env.DARAJA_SHORTCODE;
  const passkey = process.env.DARAJA_PASSKEY;

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14);

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const response = await axios.post(
    `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone_number,
      PartyB: shortcode,
      PhoneNumber: phone_number,
      CallBackURL: process.env.DARAJA_STK_CALLBACK_URL || process.env.DARAJA_CALLBACK_URL,
      AccountReference: account_reference,
      TransactionDesc: description,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

const connectFundraiserToDaraja = async (fundraiserId, organizerId) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
  });

  if (!fundraiser || fundraiser.organizer_id !== organizerId) {
    const err = new Error('Fundraiser not found.');
    err.statusCode = 404;
    throw err;
  }

  const shortcode = fundraiser.paybill_number || fundraiser.till_number;
  if (!shortcode) {
    const err = new Error('Add a Paybill or Till number to the fundraiser before connecting Daraja.');
    err.statusCode = 400;
    throw err;
  }

  await registerC2BUrls(shortcode, fundraiserId);

  return prisma.fundraiser.update({
    where: { id: fundraiserId },
    data: { daraja_webhook_registered: true },
  });
};

module.exports = {
  getAccessToken,
  registerC2BUrls,
  initiateSTKPush,
  connectFundraiserToDaraja,
};
