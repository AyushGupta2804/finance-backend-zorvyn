const recordService = require('../services/record.service');
const { success, paginated } = require('../utils/response');

const createRecord = async (req, res, next) => {
  try {
    const record = await recordService.createRecord(req.user.id, req.body);
    success(res, record, 'Record created successfully', 201);
  } catch (err) { next(err); }
};

const getAllRecords = async (req, res, next) => {
  try {
    const result = await recordService.getAllRecords(req.query);
    paginated(res, result);
  } catch (err) { next(err); }
};

const getRecordById = async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(parseInt(req.params.id));
    success(res, record);
  } catch (err) { next(err); }
};

const updateRecord = async (req, res, next) => {
  try {
    const record = await recordService.updateRecord(parseInt(req.params.id), req.body);
    success(res, record, 'Record updated successfully');
  } catch (err) { next(err); }
};

const deleteRecord = async (req, res, next) => {
  try {
    const result = await recordService.deleteRecord(parseInt(req.params.id));
    success(res, null, result.message);
  } catch (err) { next(err); }
};

module.exports = { createRecord, getAllRecords, getRecordById, updateRecord, deleteRecord };
