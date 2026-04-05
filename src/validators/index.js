const Joi = require('joi');
const { AppError } = require('../middleware/errorHandler');

// Generic validation middleware factory
const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return next(new AppError('Validation failed', 422, errors));
    }

    req[target] = value; // Use the sanitised value
    next();
  };
};

// ─── Auth Schemas ─────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name:     Joi.string().min(2).max(100).required(),
  email:    Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).max(64)
              .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
              .required()
              .messages({ 'string.pattern.base': 'Password must have uppercase, lowercase, number, and special character' }),
  role:     Joi.string().valid('viewer', 'analyst', 'admin').default('viewer'),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// ─── User Schemas ─────────────────────────────────────────────────────────────
const updateUserSchema = Joi.object({
  name:   Joi.string().min(2).max(100),
  status: Joi.string().valid('active', 'inactive'),
  role:   Joi.string().valid('viewer', 'analyst', 'admin'),
}).min(1).messages({ 'object.min': 'At least one field must be provided' });

// ─── Financial Record Schemas ─────────────────────────────────────────────────
const createRecordSchema = Joi.object({
  amount:      Joi.number().positive().precision(2).required(),
  type:        Joi.string().valid('income', 'expense').required(),
  category:    Joi.string().min(2).max(80).required(),
  record_date: Joi.date().iso().max('now').required(),
  notes:       Joi.string().max(1000).allow('', null).default(null),
});

const updateRecordSchema = Joi.object({
  amount:      Joi.number().positive().precision(2),
  type:        Joi.string().valid('income', 'expense'),
  category:    Joi.string().min(2).max(80),
  record_date: Joi.date().iso().max('now'),
  notes:       Joi.string().max(1000).allow('', null),
}).min(1);

const recordQuerySchema = Joi.object({
  type:       Joi.string().valid('income', 'expense'),
  category:   Joi.string().max(80),
  start_date: Joi.date().iso(),
  end_date:   Joi.date().iso().min(Joi.ref('start_date')),
  page:       Joi.number().integer().min(1).default(1),
  limit:      Joi.number().integer().min(1).max(100).default(20),
  sort_by:    Joi.string().valid('record_date', 'amount', 'created_at').default('record_date'),
  order:      Joi.string().valid('asc', 'desc').default('desc'),
});

// ─── Dashboard Schemas ────────────────────────────────────────────────────────
const dashboardQuerySchema = Joi.object({
  year:  Joi.number().integer().min(2000).max(new Date().getFullYear()).default(new Date().getFullYear()),
  month: Joi.number().integer().min(1).max(12),
});

module.exports = {
  validate,
  schemas: {
    registerSchema,
    loginSchema,
    refreshSchema,
    updateUserSchema,
    createRecordSchema,
    updateRecordSchema,
    recordQuerySchema,
    dashboardQuerySchema,
  },
};
