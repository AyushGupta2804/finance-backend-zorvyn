const router = require('express').Router();
const recordController = require('../controllers/record.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../validators');

router.use(authenticate);

// Viewer, Analyst, Admin: read records
router.get('/',    validate(schemas.recordQuerySchema, 'query'), recordController.getAllRecords);
router.get('/:id', recordController.getRecordById);

// Admin only: create, update, delete
router.post('/',    authorize('admin'), validate(schemas.createRecordSchema), recordController.createRecord);
router.put('/:id',  authorize('admin'), validate(schemas.updateRecordSchema), recordController.updateRecord);
router.delete('/:id', authorize('admin'), recordController.deleteRecord);

module.exports = router;
