const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const prisma = require('../utils/prisma');
const { normalizePhone } = require('../utils/phone');
const { sendOtpEmail } = require('../utils/mailer');

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const requestOtp = async (phone_number, full_name, email) => {
  let normalized = null;
  let organizer = null;

  if (phone_number) {
    normalized = normalizePhone(phone_number);
    if (!normalized) {
      const err = new Error('Invalid phone number.');
      err.statusCode = 400;
      throw err;
    }
    organizer = await prisma.organizer.findUnique({ where: { phone_number: normalized } });
  } else {
    // email-only sign-in path
    organizer = await prisma.organizer.findFirst({ where: { email }, orderBy: { created_at: 'asc' } });
    if (!organizer) {
      const err = new Error('No account found with this email address.');
      err.statusCode = 404;
      throw err;
    }
  }

  if (organizer?.otp_locked_until && organizer.otp_locked_until > new Date()) {
    const unlockIn = Math.ceil((organizer.otp_locked_until - new Date()) / 60000);
    const err = new Error(`Too many attempts. Try again in ${unlockIn} minute(s).`);
    err.statusCode = 429;
    throw err;
  }

  const otp = generateOtp();
  const otp_expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const otp_hash = await bcrypt.hash(otp, 10);

  if (!organizer) {
    // New account — only reachable when phone_number was provided
    if (!full_name) {
      const err = new Error('Full name is required for new accounts.');
      err.statusCode = 400;
      throw err;
    }
    if (!email) {
      const err = new Error('Email is required for new accounts.');
      err.statusCode = 400;
      throw err;
    }
    organizer = await prisma.organizer.create({
      data: {
        phone_number: normalized,
        full_name,
        email,
        password_hash: '',
        otp_code: otp_hash,
        otp_expires_at,
        otp_attempts: 0,
      },
    });
  } else {
    const resolvedEmail = email || organizer.email;
    if (!resolvedEmail) {
      const err = new Error('No email on file. Please sign up again with your email.');
      err.statusCode = 400;
      throw err;
    }
    await prisma.organizer.update({
      where: { id: organizer.id },
      data: {
        otp_code: otp_hash,
        otp_expires_at,
        otp_attempts: 0,
        otp_locked_until: null,
        ...(full_name && !organizer.full_name ? { full_name } : {}),
        ...(email && !organizer.email ? { email } : {}),
      },
    });
    organizer = { ...organizer, email: resolvedEmail };
  }

  let _mailDebug;
  try {
    await sendOtpEmail(organizer.email, otp, OTP_EXPIRY_MINUTES);
    _mailDebug = 'ok';
  } catch (err) {
    _mailDebug = `ERROR:${err.message}`;
  }

  return { message: 'OTP sent to your email.', phone_number: organizer.phone_number, _mailDebug };
};

const verifyOtp = async (phone_number, email, otp) => {
  let organizer;

  if (phone_number) {
    const normalized = normalizePhone(phone_number);
    if (!normalized) {
      const err = new Error('Invalid phone number.');
      err.statusCode = 400;
      throw err;
    }
    organizer = await prisma.organizer.findUnique({ where: { phone_number: normalized } });
  } else {
    organizer = await prisma.organizer.findFirst({ where: { email } });
  }

  if (!organizer) {
    const err = new Error('Account not found. Request an OTP first.');
    err.statusCode = 404;
    throw err;
  }

  if (organizer.otp_locked_until && organizer.otp_locked_until > new Date()) {
    const unlockIn = Math.ceil((organizer.otp_locked_until - new Date()) / 60000);
    const err = new Error(`Account locked. Try again in ${unlockIn} minute(s).`);
    err.statusCode = 429;
    throw err;
  }

  if (!organizer.otp_code || !organizer.otp_expires_at) {
    const err = new Error('No active OTP. Request a new one.');
    err.statusCode = 400;
    throw err;
  }

  if (organizer.otp_expires_at < new Date()) {
    const err = new Error('OTP expired. Request a new one.');
    err.statusCode = 400;
    throw err;
  }

  const otpValid = await bcrypt.compare(otp, organizer.otp_code);

  if (!otpValid) {
    const newAttempts = organizer.otp_attempts + 1;
    const updates = { otp_attempts: newAttempts };

    if (newAttempts >= MAX_OTP_ATTEMPTS) {
      updates.otp_locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      updates.otp_code = null;
    }

    await prisma.organizer.update({ where: { id: organizer.id }, data: updates });

    const remaining = MAX_OTP_ATTEMPTS - newAttempts;
    const err = new Error(
      remaining > 0
        ? `Invalid OTP. ${remaining} attempt(s) remaining.`
        : `Too many attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`
    );
    err.statusCode = 400;
    throw err;
  }

  await prisma.organizer.update({
    where: { id: organizer.id },
    data: {
      is_verified: true,
      otp_code: null,
      otp_expires_at: null,
      otp_attempts: 0,
      otp_locked_until: null,
    },
  });

  const token = jwt.sign(
    { id: organizer.id, phone_number: organizer.phone_number },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    organizer: {
      id: organizer.id,
      phone_number: organizer.phone_number,
      full_name: organizer.full_name,
      email: organizer.email,
      subscription_plan: organizer.subscription_plan,
      subscription_status: organizer.subscription_status,
    },
  };
};

const getProfile = async (organizerId) => {
  return prisma.organizer.findUnique({
    where: { id: organizerId },
    select: {
      id: true,
      phone_number: true,
      full_name: true,
      email: true,
      subscription_plan: true,
      subscription_status: true,
      subscription_expires_at: true,
      created_at: true,
    },
  });
};

const updateProfile = async (organizerId, { full_name, email }) => {
  return prisma.organizer.update({
    where: { id: organizerId },
    data: {
      ...(full_name && { full_name }),
      ...(email !== undefined && { email }),
    },
    select: {
      id: true,
      phone_number: true,
      full_name: true,
      email: true,
      subscription_plan: true,
      subscription_status: true,
    },
  });
};

module.exports = { requestOtp, verifyOtp, getProfile, updateProfile };
