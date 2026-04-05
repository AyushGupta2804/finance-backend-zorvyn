const userService = require('../services/user.service');
const { success, paginated } = require('../utils/response');
const Joi = require('joi');
const { AppError } = require('../middleware/errorHandler');

const getAllUsers = async (req, res, next) => {
  try {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      status: Joi.string().valid('active', 'inactive'),
      role: Joi.string().valid('viewer', 'analyst', 'admin'),
    });
    const { value } = schema.validate(req.query, { stripUnknown: true });
    const result = await userService.getAllUsers(value);
    paginated(res, result);
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(parseInt(req.params.id));
    success(res, user);
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(parseInt(req.params.id), req.body);
    success(res, user, 'User updated successfully');
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(parseInt(req.params.id), req.user.id);
    success(res, null, result.message);
  } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    success(res, user);
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).max(64)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .required()
        .messages({ 'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character' }),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) throw new AppError('Validation failed', 422, error.details.map(d => ({ field: d.path[0], message: d.message })));

    await userService.changePassword(req.user.id, value);
    success(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getProfile, changePassword };
