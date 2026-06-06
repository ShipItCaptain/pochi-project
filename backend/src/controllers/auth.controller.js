const Joi = require('joi');
const authService = require('../services/auth.service');

const requestOtpSchema = Joi.object({
  phone_number: Joi.string().required(),
  full_name: Joi.string().max(100).optional(),
});

const verifyOtpSchema = Joi.object({
  phone_number: Joi.string().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const updateProfileSchema = Joi.object({
  full_name: Joi.string().max(100).optional(),
  email: Joi.string().email().max(150).optional(),
});

const requestOtp = async (req, res, next) => {
  try {
    const { error, value } = requestOtpSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const result = await authService.requestOtp(value.phone_number, value.full_name);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const result = await authService.verifyOtp(value.phone_number, value.otp);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const organizer = await authService.getProfile(req.organizer.id);
    res.json(organizer);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const organizer = await authService.updateProfile(req.organizer.id, value);
    res.json(organizer);
  } catch (err) {
    next(err);
  }
};

module.exports = { requestOtp, verifyOtp, getMe, updateProfile };
