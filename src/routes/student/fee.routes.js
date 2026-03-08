import express from 'express';
import {
  getMyFeeDetails,
  submitPayment,
  getMyPaymentHistory
} from '../../controllers/student/fee.controller.js';
import { protect } from "../../middlewares/auth.middleware.js";
import { upload } from '../../middlewares/multerUpload.js';

const router = express.Router();

// Student Fee Routes
router.get('/my-fees', protect, getMyFeeDetails);
router.get('/payment-history', protect, getMyPaymentHistory);
router.post('/submit-payment', protect, upload.single('receipt'), submitPayment);

export default router;