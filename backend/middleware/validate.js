const { validationResult } = require('express-validator');

/**
 * Runs after express-validator chains.
 * If there are errors, returns 400 with a clean error array.
 * If clean, calls next().
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = validate;
