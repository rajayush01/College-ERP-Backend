import FeeRecord from '../../models/FeeRecord.js';
import { uploadToR2 } from '../../services/r2Upload.service.js';

/**
 * Get My Fee Details
 */
export const getMyFeeDetails = async (req, res) => {
  try {
    console.log('📥 [GetMyFeeDetails] Incoming request');
    console.log('🧠 req.user:', req.user);

    const studentId = req.user.id;

    if (!studentId) {
      console.warn('❌ studentId missing from token');
      return res.status(401).json({ message: 'Invalid auth token' });
    }

    const { academicYear } = req.query;

    /* ---------------------------------------------------
       1️⃣ Resolve academic year
    --------------------------------------------------- */
    const currentYear = new Date().getFullYear();
    const resolvedYear =
      academicYear || `${currentYear}-${currentYear + 1}`;

    const shortYear = resolvedYear.includes('-')
      ? resolvedYear.split('-')[0]
      : resolvedYear;

    console.log('📅 Resolved year:', resolvedYear);
    console.log('📅 Short year:', shortYear);

    /* ---------------------------------------------------
       2️⃣ Query fee record - Try multiple formats
    --------------------------------------------------- */
    console.log('🔍 Searching for fee record with student ID:', studentId);
    
    // First, try to find with current academic year
    let feeRecord = await FeeRecord.findOne({
      student: studentId,
      $or: [
        { academicYear: resolvedYear },
        { academicYear: shortYear }
      ]
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'feeStructure',
        select: 'feeBreakdown totalAmount dueDate installments academicYear className'
      })
      .populate({
        path: 'student',
        select: 'name studentId enrollmentNumber',
        populate: {
          path: 'batchId',
          select: 'batchName department program semester'
        }
      });

    // If not found, get the most recent fee record for this student
    if (!feeRecord) {
      console.log('⚠️ No fee record found for current year, looking for any fee record...');
      feeRecord = await FeeRecord.findOne({ student: studentId })
        .sort({ createdAt: -1 })
        .populate({
          path: 'feeStructure',
          select: 'feeBreakdown totalAmount dueDate installments academicYear className'
        })
        .populate({
          path: 'student',
          select: 'name studentId enrollmentNumber',
          populate: {
            path: 'batchId',
            select: 'batchName department program semester'
          }
        });
    }

    if (!feeRecord) {
      console.warn('❌ No fee record found for student:', studentId);
      return res.status(404).json({
        message: 'No fee record found. Please contact administration.'
      });
    }

    console.log('✅ Fee record found:', {
      id: feeRecord._id,
      academicYear: feeRecord.academicYear,
      status: feeRecord.status,
      feeStructure: feeRecord.feeStructure ? feeRecord.feeStructure._id : 'Not populated'
    });

    res.json(feeRecord);

  } catch (error) {
    console.error('❌ [GetMyFeeDetails] Error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Submit Payment (Student Side)
 */
export const submitPayment = async (req, res) => {
  try {
    console.log('📤 [SubmitPayment] Student submitting payment...');
    console.log('👤 User:', req.user);
    console.log('📋 Body:', req.body);
    console.log('📎 File:', req.file ? req.file.originalname : 'No file');

    const studentId = req.user.id;
    const {
      amount,
      paymentMode,
      transactionReference,
      remarks
    } = req.body;

    // Validate required fields
    if (!amount || !paymentMode || !transactionReference) {
      return res.status(400).json({ 
        message: 'Amount, payment mode, and transaction reference are required' 
      });
    }

    // Get current academic year fee record
    const currentYear = new Date().getFullYear();
    const resolvedYear = `${currentYear}-${currentYear + 1}`;
    const shortYear = resolvedYear.includes('-') ? resolvedYear.split('-')[0] : resolvedYear;

    console.log('🔍 Looking for fee record with academic years:', { resolvedYear, shortYear });

    const feeRecord = await FeeRecord.findOne({
      student: studentId,
      $or: [
        { academicYear: resolvedYear },
        { academicYear: shortYear }
      ]
    }).sort({ createdAt: -1 });

    if (!feeRecord) {
      console.log('❌ No fee record found for student:', studentId);
      console.log('🔍 Searched with academic years:', { resolvedYear, shortYear });
      return res.status(404).json({ message: 'Fee record not found' });
    }

    console.log('✅ Fee record found:', {
      id: feeRecord._id,
      academicYear: feeRecord.academicYear,
      remainingAmount: feeRecord.remainingAmount
    });

    // Validate payment amount
    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    if (paymentAmount > feeRecord.remainingAmount) {
      return res.status(400).json({ 
        message: `Payment amount (₹${paymentAmount}) cannot exceed remaining fee amount (₹${feeRecord.remainingAmount})` 
      });
    }

    // Upload receipt if provided
    let receiptUrl = '';
    let receiptKey = '';
    
    if (req.file) {
      console.log('📎 Uploading receipt to R2...');
      const uploadResult = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        'fee-receipts',
        studentId,
        req.file.mimetype
      );
      receiptUrl = uploadResult.fileUrl;
      receiptKey = uploadResult.fileKey;
      console.log('✅ Receipt uploaded:', receiptUrl);
    }

    // Create payment record
    const payment = {
      paymentId: feeRecord.generatePaymentId(),
      amount: paymentAmount,
      paymentMode,
      paymentDate: new Date(),
      transactionReference,
      receiptUrl,
      receiptKey,
      remarks: remarks || '',
      paymentStatus: 'PENDING',
      createdAt: new Date()
    };

    console.log('💳 Creating payment record:', payment);

    feeRecord.payments.push(payment);
    
    // Update status to PARTIALLY_PAID when receipt is submitted (pending approval)
    if (feeRecord.status === 'UNPAID') {
      feeRecord.status = 'PARTIALLY_PAID';
      console.log('📊 Updated fee status from UNPAID to PARTIALLY_PAID (receipt submitted)');
    }
    
    await feeRecord.save();

    console.log('✅ Payment submitted successfully');
    console.log('📋 Updated fee record status:', feeRecord.status);
    console.log('💳 Total payments in record:', feeRecord.payments.length);

    res.status(201).json({
      message: 'Payment receipt submitted successfully. Awaiting admin approval.',
      payment: feeRecord.payments[feeRecord.payments.length - 1]
    });

  } catch (error) {
    console.error('❌ Submit payment error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

/**
 * Get My Payment History
 */
export const getMyPaymentHistory = async (req, res) => {
  try {
    console.log('📜 [GetMyPaymentHistory] Fetching payment history...');
    const studentId = req.user.id;
    const { academicYear } = req.query;

    const filter = { student: studentId };
    if (academicYear) filter.academicYear = academicYear;

    console.log('🔍 Payment history filter:', filter);

    const feeRecords = await FeeRecord.find(filter)
      .populate('feeStructure', 'academicYear totalAmount')
      .select('academicYear totalFeeAmount totalAmountPaid remainingAmount status payments')
      .sort({ academicYear: -1 });

    console.log(`📊 Found ${feeRecords.length} fee records with payments`);

    // Extract all payments from all fee records
    const allPayments = [];
    feeRecords.forEach(record => {
      if (record.payments && record.payments.length > 0) {
        record.payments.forEach(payment => {
          allPayments.push({
            ...payment.toObject(),
            academicYear: record.academicYear,
            feeRecordId: record._id
          });
        });
      }
    });

    console.log(`💳 Total payments found: ${allPayments.length}`);

    res.json(allPayments);

  } catch (error) {
    console.error('❌ Get payment history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};