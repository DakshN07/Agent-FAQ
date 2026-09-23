const joi = require('joi');

const register = joi.object({
  username: joi.string().min(3).max(60).required(),
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
});

const login = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

const updateMe = joi.object({
  phoneNumber: joi.string().optional().allow(''),
  linkedinProfile: joi.string().optional().allow(''),
});

const acceptInvite = joi.object({
  token: joi.string().required(),
  name: joi.string().min(1).max(100).required(),
  password: joi.string().min(8).required(),
});

const changePassword = joi.object({
  currentPassword: joi.string().required(),
  newPassword: joi.string().min(8).required(),
});

const refresh = joi.object({
  refreshToken: joi.string().optional(),
});

module.exports = {
  register,
  login,
  updateMe,
  acceptInvite,
  changePassword,
  refresh,
};
