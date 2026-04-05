const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../validators');

// Public routes
router.post('/register', validate(schemas.registerSchema), authController.register);
router.post('/login',    validate(schemas.loginSchema),    authController.login);
router.post('/refresh',  validate(schemas.refreshSchema),  authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);

module.exports = router;
