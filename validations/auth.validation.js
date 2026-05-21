const joi = require('joi');

const register = joi.object({
  username: joi.string().alphanum().min(3).max(30).required(),
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
});

const login = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

module.exports = {
  register,
  login,
};
