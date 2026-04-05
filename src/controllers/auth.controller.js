const authService = require('../services/auth.service');
const { success } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    success(res, user, 'Registration successful', 201);
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const tokens = await authService.login(req.body);
    success(res, tokens, 'Login successful');
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    success(res, tokens, 'Tokens refreshed');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

module.exports = { register, login, refreshToken, logout };
