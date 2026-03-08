import express from 'express';
import {
  getAllFeeRecords,
  getFeeRecordByStudent,
  recordPayment,
  updatePaymentStatus,
  updateFeeAdjustments,
  getFeeStatistics,
  debugFeeRecords,
  updateFeeRecordStatus,
  createMissingFeeRecords,
  fixDatabaseIndexes,
  debugFeeStatistics,
  debugStudentFeeRecord,
  updateAllFeeRecordStatuses,
  resetFeeRecords
} from '../../controllers/admin/feeRecord.controller.js';
import { isAdmin } from "../../middlewares/admin.middleware.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { upload } from '../../middlewares/multerUpload.js';

const router = express.Router();

// Fee Record Routes
router.get('/', protect, isAdmin, getAllFeeRecords);
router.get('/debug', protect, isAdmin, debugFeeRecords);
router.get('/debug-statistics', protect, isAdmin, debugFeeStatistics);
router.get('/debug-student/:studentId', protect, isAdmin, debugStudentFeeRecord);
router.post('/fix-indexes', protect, isAdmin, fixDatabaseIndexes);
router.post('/update-statuses', protect, isAdmin, updateAllFeeRecordStatuses);
router.post('/reset-collection', protect, isAdmin, resetFeeRecords);
router.post('/create-missing', protect, isAdmin, createMissingFeeRecords);
router.get('/statistics', protect, isAdmin, getFeeStatistics);
router.get('/student/:studentId', protect, isAdmin, getFeeRecordByStudent);
router.post('/student/:studentId/payment', protect, isAdmin, upload.single('receipt'), recordPayment);
router.put('/:recordId/status', protect, isAdmin, updateFeeRecordStatus);
router.put('/:recordId/payment/:paymentId/status', protect, isAdmin, updatePaymentStatus);
router.put('/:recordId/adjustments', protect, isAdmin, updateFeeAdjustments);

export default router;