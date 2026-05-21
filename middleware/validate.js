const joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const validSchema = joi.compile(schema);
  
  // Validate req.body by default, or you can expand to req.query/req.params
  const { error, value } = validSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return res.status(400).json({ error: errorMessage });
  }
  
  Object.assign(req, { body: value });
  return next();
};

module.exports = validate;
