const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../validators');

// All routes require authentication
router.use(authenticate);

// Own profile (any authenticated user)
router.get('/me',              userController.getProfile);
router.put('/me/password',     userController.changePassword);

// Admin-only user management
router.get('/',                authorize('admin'), userController.getAllUsers);
router.get('/:id',             authorize('admin'), userController.getUserById);
router.put('/:id',             authorize('admin'), validate(schemas.updateUserSchema), userController.updateUser);
router.delete('/:id',          authorize('admin'), userController.deleteUser);

module.exports = router;
