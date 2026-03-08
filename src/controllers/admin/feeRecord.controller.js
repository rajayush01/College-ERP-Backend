import FeeRecord from '../../models/FeeRecord.js';
import FeeStructure from '../../models/FeeStructure.js';
import Student from '../../models/Student.js';
import Class from '../../models/Class.js';
import Admin from '../../models/Admin.js';
import { uploadToR2 } from '../../services/r2Upload.service.js';
import mongoose from 'mongoose';

/**
 * Get All Fee Records with Filters
 */
export const getAllFeeRecords = async (req, res) => {
  try {
    console.log('📥 [FeeRecords] Incoming request');
    console.log('🔍 Query params received:', req.query);

    const {
      page = 1,
      limit = 10,
      classId,
      academicYear,
      status
    } = req.query;

    console.log('🧾 Parsed params:', {
      page,
      limit,
      classId,
      academicYear,
      status
    });

    // If no filters provided, return all fee records with proper population
    if (!classId || !academicYear) {
      console.warn('⚠️ No filters provided, returning all fee records');

      const records = await FeeRecord.find()
        .populate({
          path: 'student',
          select: 'name studentId rollNumber class',
          populate: {
            path: 'class',
            select: 'name section'
          }
        })
        .populate('feeStructure', 'className academicYear totalAmount')
        .sort({ createdAt: -1 });

      console.log(`📊 Found ${records.length} total fee records`);
      
      // Log sample record to debug payments
      if (records.length > 0) {
        const sampleRecord = records[0];
        console.log('📄 Sample record payments:', {
          studentName: sampleRecord.student?.name,
          paymentsCount: sampleRecord.payments?.length || 0,
          payments: sampleRecord.payments?.map(p => ({
            paymentId: p.paymentId,
            amount: p.amount,
            paymentStatus: p.paymentStatus,
            receiptUrl: p.receiptUrl || 'No receipt URL',
            hasReceipt: !!p.receiptUrl
          })) || []
        });
      }

      return res.json({
        feeRecords: records,
        total: records.length,
        page: 1,
        pages: 1
      });
    }

    /* ---------------------------------------------------
       1️⃣ Resolve class from classId
    --------------------------------------------------- */
    console.log('🏫 Looking up class with ID:', classId);

    const classDoc = await Class.findById(classId);

    if (!classDoc) {
      console.warn('❌ Class not found for ID:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log('✅ Class found:', {
      id: classDoc._id,
      name: classDoc.name,
      section: classDoc.section
    });

    const className = classDoc.name;

    /* ---------------------------------------------------
       2️⃣ Find fee structure
    --------------------------------------------------- */
    console.log('💰 Finding FeeStructure for:', {
      className,
      academicYear
    });

    const feeStructure = await FeeStructure.findOne({
      className,
      academicYear,
      isActive: true
    });

    if (!feeStructure) {
      console.warn('⚠️ No FeeStructure found', {
        className,
        academicYear
      });

      return res.json({
        feeRecords: [],
        total: 0,
        page: Number(page),
        pages: 0
      });
    }

    console.log('✅ FeeStructure found:', {
      id: feeStructure._id,
      totalAmount: feeStructure.totalAmount,
      dueDate: feeStructure.dueDate
    });

    /* ---------------------------------------------------
       3️⃣ Fetch students of the class
    --------------------------------------------------- */
    console.log('👥 Fetching students for class:', classId);

    const students = await Student.find({ class: classId })
      .select('name studentId rollNumber class')
      .populate('class', 'name section');

    console.log(`👥 Students found: ${students.length}`);

    if (students.length === 0) {
      console.warn('⚠️ No students found for class:', classId);
      return res.json({
        feeRecords: [],
        total: 0,
        page: Number(page),
        pages: 0
      });
    }

    const studentIds = students.map(s => s._id);

    /* ---------------------------------------------------
       4️⃣ Fetch existing fee records
    --------------------------------------------------- */
    console.log('📄 Fetching FeeRecords for students:', studentIds.length);

    const existingRecords = await FeeRecord.find({
      student: { $in: studentIds },
      feeStructure: feeStructure._id
    })
      .populate('student', 'name studentId rollNumber class')
      .populate('feeStructure', 'className academicYear totalAmount');

    console.log(`📄 Existing FeeRecords found: ${existingRecords.length}`);

    const recordMap = new Map();
    existingRecords.forEach(r => {
      recordMap.set(r.student._id.toString(), r);
    });

    /* ---------------------------------------------------
       5️⃣ Merge students + records
    --------------------------------------------------- */
    const mergedRecords = students.map(student => {
      const record = recordMap.get(student._id.toString());
      if (record) return record;

      return {
        _id: null,
        student,
        feeStructure,
        academicYear: feeStructure.academicYear,
        totalFeeAmount: feeStructure.totalAmount,
        totalAmountPaid: 0,
        remainingAmount: feeStructure.totalAmount,
        status: 'UNPAID',
        dueDate: feeStructure.dueDate,
        payments: []
      };
    });

    console.log('🔀 Merged records count:', mergedRecords.length);

    /* ---------------------------------------------------
       6️⃣ Status filter (optional)
    --------------------------------------------------- */
    const filteredRecords = status
      ? mergedRecords.filter(r => r.status === status)
      : mergedRecords;

    console.log('🔎 After status filter:', filteredRecords.length);

    /* ---------------------------------------------------
       7️⃣ Pagination
    --------------------------------------------------- */
    const total = filteredRecords.length;
    const start = (page - 1) * limit;
    const paginated = filteredRecords.slice(start, start + Number(limit));

    console.log('📤 Sending response:', {
      returned: paginated.length,
      total,
      page
    });

    res.json({
      feeRecords: paginated,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('❌ [FeeRecords] Unexpected error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Get Fee Record by Student ID
 */
export const getFeeRecordByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const filter = { student: studentId };
    if (academicYear) filter.academicYear = academicYear;

    const feeRecord = await FeeRecord.findOne(filter)
      .populate({
        path: 'student',
        select: 'name studentId rollNumber',
        populate: {
          path: 'class',
          select: 'name section'
        }
      })
      .populate('feeStructure')
      .populate('payments.approvedBy', 'name');

    if (!feeRecord) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    res.json(feeRecord);

  } catch (error) {
    console.error('Get fee record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const recordPayment = async (req, res) => {
  try {
    console.log('📥 [RecordPayment] Incoming request');

    const { studentId } = req.params;
    const {
      amount,
      paymentMode,
      paymentDate,
      transactionReference,
      remarks
    } = req.body;

    console.log('🧾 Params:', { studentId });
    console.log('🧾 Body:', {
      amount,
      paymentMode,
      paymentDate,
      transactionReference,
      remarks
    });

    /* ---------------------------------------------------
       1️⃣ Validate student ID
    --------------------------------------------------- */
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.warn('❌ Invalid student ID:', studentId);
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    /* ---------------------------------------------------
       2️⃣ Find latest fee record for student
    --------------------------------------------------- */
    console.log('🔍 Finding latest FeeRecord for student');

    const feeRecord = await FeeRecord.findOne({ student: studentId })
      .sort({ createdAt: -1 });

    if (!feeRecord) {
      console.warn('❌ No FeeRecord found for student:', studentId);
      return res.status(404).json({ message: 'Fee record not found' });
    }

    console.log('✅ FeeRecord found:', {
      id: feeRecord._id,
      academicYear: feeRecord.academicYear,
      remainingAmount: feeRecord.remainingAmount
    });

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    if (numericAmount > feeRecord.remainingAmount) {
      return res.status(400).json({ message: 'Payment exceeds remaining amount' });
    }

    /* ---------------------------------------------------
       3️⃣ Upload receipt (optional)
    --------------------------------------------------- */
    let receiptUrl = '';
    let receiptKey = '';

    if (req.file) {
      console.log('📤 Uploading receipt to R2');

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

    /* ---------------------------------------------------
       4️⃣ Create payment object (AUTO-APPROVE IF FULL)
    --------------------------------------------------- */
    const willFullySettle = numericAmount === feeRecord.remainingAmount;

    const payment = {
      paymentId: feeRecord.generatePaymentId(),
      amount: numericAmount,
      paymentMode,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      transactionReference: transactionReference || '',
      receiptUrl,
      receiptKey,
      remarks: remarks || '',
      paymentStatus: willFullySettle ? 'APPROVED' : 'PENDING'
    };

    console.log('💳 Payment object created:', {
      ...payment,
      autoApproved: willFullySettle
    });

    /* ---------------------------------------------------
       5️⃣ Save payment
    --------------------------------------------------- */
    feeRecord.payments.push(payment);
    await feeRecord.save();

    console.log('✅ Payment saved successfully');
    console.log('📊 Updated totals after save:', {
      totalPaid: feeRecord.totalAmountPaid,
      remaining: feeRecord.remainingAmount,
      status: feeRecord.status
    });

    res.status(201).json({
      message: willFullySettle
        ? 'Payment recorded and auto-approved (full payment)'
        : 'Payment recorded successfully (pending approval)',
      payment: feeRecord.payments[feeRecord.payments.length - 1],
      feeStatus: feeRecord.status
    });

  } catch (error) {
    console.error('❌ [RecordPayment] Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const debugFeeStatistics = async (req, res) => {
  console.log('🐛 [DebugFeeStatistics] Hit');
  return res.json({
    message: 'Debug fee statistics endpoint working',
    query: req.query
  });
};




/**
 * Approve/Reject Payment
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { recordId, paymentId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ message: 'Invalid fee record ID' });
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const feeRecord = await FeeRecord.findById(recordId);
    if (!feeRecord) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    const payment = feeRecord.payments.find(p => p.paymentId === paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status
    payment.paymentStatus = status;
    payment.approvedBy = req.user.id;
    payment.approvedAt = new Date();
    
    if (status === 'REJECTED') {
      payment.rejectionReason = rejectionReason || '';
    }

    await feeRecord.save();

    // If payment was approved, recalculate fee record status
    if (status === 'APPROVED') {
      console.log('💰 Payment approved, recalculating fee record status...');
      
      // The pre-save hook will automatically recalculate totalAmountPaid and remainingAmount
      // and update the status based on the new amounts
      await feeRecord.save();
      
      console.log('✅ Fee record status updated:', {
        totalAmountPaid: feeRecord.totalAmountPaid,
        remainingAmount: feeRecord.remainingAmount,
        status: feeRecord.status
      });
    }

    await feeRecord.populate([
      {
        path: 'student',
        select: 'name studentId',
        populate: {
          path: 'class',
          select: 'name section'
        }
      },
      {
        path: 'payments.approvedBy',
        select: 'name'
      }
    ]);

    res.json({
      message: `Payment ${status.toLowerCase()} successfully`,
      feeRecord
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Add Late Fee or Discount
 */
export const updateFeeAdjustments = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { lateFee, discount, discountReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ message: 'Invalid fee record ID' });
    }

    const feeRecord = await FeeRecord.findById(recordId);
    if (!feeRecord) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (lateFee !== undefined) feeRecord.lateFee = Number(lateFee);
    if (discount !== undefined) feeRecord.discount = Number(discount);
    if (discountReason !== undefined) feeRecord.discountReason = discountReason;

    await feeRecord.save();

    res.json({
      message: 'Fee adjustments updated successfully',
      feeRecord
    });

  } catch (error) {
    console.error('Update fee adjustments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get Fee Statistics
 */
export const getFeeStatistics = async (req, res) => {
  try {
    console.log('📥 [FeeStatistics] Incoming request');
    console.log('🔍 Raw query params:', req.query);

    const { academicYear, classId } = req.query;

    /* ---------------------------------------------------
       1️⃣ Resolve academic year (support both formats)
    --------------------------------------------------- */
    const currentYear = new Date().getFullYear();

    const resolvedYear =
      academicYear ||
      `${currentYear}-${currentYear + 1}`;

    const shortYear = resolvedYear.includes('-')
      ? resolvedYear.split('-')[0]
      : resolvedYear;

    console.log('📅 Resolved academicYear:', resolvedYear);
    console.log('📅 Short academicYear:', shortYear);

    /* ---------------------------------------------------
       2️⃣ Build match stage (IMPORTANT FIX)
    --------------------------------------------------- */
    const matchStage = {
      $or: [
        { academicYear: resolvedYear },
        { academicYear: shortYear }
      ]
    };

    /* ---------------------------------------------------
       3️⃣ Optional class filter
    --------------------------------------------------- */
    if (classId) {
      console.log('🏫 Class filter applied:', classId);

      const students = await Student.find({ class: classId }).select('_id');

      console.log(`👥 Students found: ${students.length}`);

      if (students.length === 0) {
        return res.json({
          totalStudents: 0,
          totalFeeAmount: 0,
          totalAmountPaid: 0,
          totalRemaining: 0,
          paidCount: 0,
          unpaidCount: 0,
          partiallyPaidCount: 0,
          defaulterCount: 0,
          overdueCount: 0
        });
      }

      matchStage.student = { $in: students.map(s => s._id) };
    }

    console.log('📊 Final aggregation matchStage:', matchStage);

    /* ---------------------------------------------------
       4️⃣ Aggregation
    --------------------------------------------------- */
    const stats = await FeeRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,

          totalStudents: { $addToSet: '$student' },

          totalFeeAmount: { $sum: '$totalFeeAmount' },
          totalAmountPaid: { $sum: '$totalAmountPaid' },
          totalRemaining: { $sum: '$remainingAmount' },

          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] }
          },
          unpaidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'UNPAID'] }, 1, 0] }
          },
          partiallyPaidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'PARTIALLY_PAID'] }, 1, 0] }
          },
          defaulterCount: {
            $sum: { $cond: [{ $eq: ['$status', 'DEFAULTER'] }, 1, 0] }
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$status', 'OVERDUE'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalStudents: { $size: '$totalStudents' },
          totalFeeAmount: 1,
          totalAmountPaid: 1,
          totalRemaining: 1,
          paidCount: 1,
          unpaidCount: 1,
          partiallyPaidCount: 1,
          defaulterCount: 1,
          overdueCount: 1
        }
      }
    ]);

    const result = stats[0] || {
      totalStudents: 0,
      totalFeeAmount: 0,
      totalAmountPaid: 0,
      totalRemaining: 0,
      paidCount: 0,
      unpaidCount: 0,
      partiallyPaidCount: 0,
      defaulterCount: 0,
      overdueCount: 0
    };

    console.log('✅ Fee statistics result:', result);

    res.json(result);

  } catch (error) {
    console.error('❌ [FeeStatistics] Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Debug endpoint to check database state
 */
export const debugFeeRecords = async (req, res) => {
  try {
    console.log('🔍 Debug: Checking database state...');
    
    // Check total counts
    const totalStudents = await Student.countDocuments();
    const totalClasses = await Class.countDocuments();
    const totalFeeStructures = await FeeStructure.countDocuments();
    const totalFeeRecords = await FeeRecord.countDocuments();
    
    console.log('📊 Database counts:', {
      totalStudents,
      totalClasses,
      totalFeeStructures,
      totalFeeRecords
    });
    
    // Get sample data
    const sampleStudents = await Student.find().limit(3).populate('class');
    const sampleClasses = await Class.find().limit(3);
    const sampleFeeStructures = await FeeStructure.find().limit(3);
    const sampleFeeRecords = await FeeRecord.find().limit(3).populate('student', 'name studentId');
    
    console.log('📄 Sample students:', sampleStudents.map(s => ({
      id: s._id,
      name: s.name,
      studentId: s.studentId,
      class: s.class ? `${s.class.name}-${s.class.section}` : 'No class'
    })));
    
    console.log('📄 Sample classes:', sampleClasses.map(c => ({
      id: c._id,
      name: c.name,
      section: c.section
    })));
    
    console.log('📄 Sample fee structures:', sampleFeeStructures.map(fs => ({
      id: fs._id,
      className: fs.className,
      academicYear: fs.academicYear,
      totalAmount: fs.totalAmount
    })));
    
    console.log('📄 Sample fee records:', sampleFeeRecords.map(fr => ({
      id: fr._id,
      student: fr.student?.name,
      totalAmount: fr.totalFeeAmount,
      status: fr.status
    })));
    
    res.json({
      counts: {
        totalStudents,
        totalClasses,
        totalFeeStructures,
        totalFeeRecords
      },
      samples: {
        students: sampleStudents.map(s => ({
          id: s._id,
          name: s.name,
          studentId: s.studentId,
          class: s.class ? `${s.class.name}-${s.class.section}` : 'No class'
        })),
        classes: sampleClasses.map(c => ({
          id: c._id,
          name: c.name,
          section: c.section
        })),
        feeStructures: sampleFeeStructures.map(fs => ({
          id: fs._id,
          className: fs.className,
          academicYear: fs.academicYear,
          totalAmount: fs.totalAmount
        })),
        feeRecords: sampleFeeRecords.map(fr => ({
          id: fr._id,
          student: fr.student?.name,
          totalAmount: fr.totalFeeAmount,
          status: fr.status
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Debug fee records error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update Fee Record Status (for admin to manually change status)
 */
export const updateFeeRecordStatus = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { status, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ message: 'Invalid fee record ID' });
    }

    const validStatuses = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'DEFAULTER', 'OVERDUE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const feeRecord = await FeeRecord.findById(recordId);
    if (!feeRecord) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // Update status
    feeRecord.status = status;
    
    // If marking as paid, set amounts accordingly
    if (status === 'PAID') {
      feeRecord.totalAmountPaid = feeRecord.totalFeeAmount + feeRecord.lateFee - feeRecord.discount;
      feeRecord.remainingAmount = 0;
    } else if (status === 'UNPAID') {
      feeRecord.totalAmountPaid = 0;
      feeRecord.remainingAmount = feeRecord.totalFeeAmount + feeRecord.lateFee - feeRecord.discount;
    }
    
    // Add admin note if provided
    if (remarks) {
      feeRecord.payments.push({
        paymentId: feeRecord.generatePaymentId(),
        amount: 0,
        paymentMode: 'ADMIN_UPDATE',
        paymentDate: new Date(),
        transactionReference: '',
        receiptUrl: '',
        receiptKey: '',
        paymentStatus: 'APPROVED',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        remarks: `Admin status update: ${status}. ${remarks}`,
        createdAt: new Date()
      });
    }

    await feeRecord.save();

    await feeRecord.populate([
      {
        path: 'student',
        select: 'name studentId',
        populate: {
          path: 'class',
          select: 'name section'
        }
      },
      {
        path: 'feeStructure',
        select: 'className academicYear totalAmount'
      }
    ]);

    res.json({
      message: `Fee record status updated to ${status}`,
      feeRecord
    });

  } catch (error) {
    console.error('Update fee record status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const createMissingFeeRecords = async (req, res) => {
  try {
    console.log('🔧 Creating missing fee records for existing students...');
    
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    
    // Get all students
    const allStudents = await Student.find({}).populate('class');
    console.log(`👥 Found ${allStudents.length} total students`);
    
    // Get all fee structures
    const feeStructures = await FeeStructure.find({ academicYear });
    console.log(`📋 Found ${feeStructures.length} fee structures for ${academicYear}`);
    
    let totalCreated = 0;
    let studentsProcessed = 0;
    
    for (const student of allStudents) {
      if (!student.class) {
        console.log(`⚠️ Student ${student.name} has no class assigned, skipping`);
        continue;
      }
      
      studentsProcessed++;
      const studentClassName = student.class.name;
      console.log(`🔍 Processing student ${student.name} in class ${studentClassName}-${student.class.section}`);
      
      // Find fee structure for this student's class
      const feeStructure = feeStructures.find(fs => fs.className === studentClassName);
      
      if (!feeStructure) {
        console.log(`⚠️ No fee structure found for class ${studentClassName}, skipping student ${student.name}`);
        continue;
      }
      
      // Check if fee record already exists
      const existingRecord = await FeeRecord.findOne({
        student: student._id,
        feeStructure: feeStructure._id,
        academicYear
      });
      
      if (!existingRecord) {
        console.log(`➕ Creating fee record for student ${student.name} (${student.studentId}) in class ${studentClassName}`);
        
        const feeRecord = new FeeRecord({
          student: student._id,
          feeStructure: feeStructure._id,
          academicYear,
          totalFeeAmount: feeStructure.totalAmount,
          remainingAmount: feeStructure.totalAmount,
          dueDate: feeStructure.dueDate
        });
        
        await feeRecord.save();
        totalCreated++;
      } else {
        console.log(`✅ Fee record already exists for student ${student.name}`);
      }
    }
    
    console.log(`🎉 Processed ${studentsProcessed} students, created ${totalCreated} missing fee records`);
    
    res.json({
      message: `Successfully processed ${studentsProcessed} students and created ${totalCreated} missing fee records`,
      studentsProcessed,
      totalCreated,
      academicYear
    });
    
  } catch (error) {
    console.error('❌ Create missing fee records error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Fix database indexes (remove problematic unique index on payments.paymentId)
 */
export const fixDatabaseIndexes = async (req, res) => {
  try {
    console.log('🔧 Fixing database indexes...');
    
    const collection = FeeRecord.collection;
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique })));
    
    // Try to drop the problematic payments.paymentId unique index
    try {
      console.log('🗑️ Attempting to drop payments.paymentId_1 index...');
      await collection.dropIndex('payments.paymentId_1');
      console.log('✅ Successfully dropped payments.paymentId_1 index');
    } catch (dropError) {
      console.log('ℹ️ payments.paymentId_1 index not found or already dropped:', dropError.message);
    }
    
    // Also try alternative index names
    try {
      console.log('🗑️ Attempting to drop any payments.paymentId unique indexes...');
      const paymentIdIndexes = indexes.filter(index => 
        index.key && index.key['payments.paymentId'] === 1 && index.unique
      );
      
      for (const index of paymentIdIndexes) {
        console.log(`🗑️ Dropping index: ${index.name}`);
        await collection.dropIndex(index.name);
        console.log(`✅ Successfully dropped index: ${index.name}`);
      }
    } catch (dropError) {
      console.log('ℹ️ No additional payment ID indexes found:', dropError.message);
    }
    
    // Get updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('📋 Updated indexes:', updatedIndexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique })));
    
    // Also clear any existing fee records that might be causing issues
    const feeRecordsCount = await FeeRecord.countDocuments();
    console.log(`📊 Current fee records count: ${feeRecordsCount}`);
    
    res.json({
      message: 'Database indexes fixed successfully',
      indexesDropped: indexes.filter(idx => idx.key && idx.key['payments.paymentId'] === 1).length,
      currentIndexes: updatedIndexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique })),
      feeRecordsCount
    });
    
  } catch (error) {
    console.error('❌ Fix database indexes error:', error);
    res.status(500).json({ 
      message: 'Failed to fix database indexes',
      error: error.message 
    });
  }
};

/**
 * Debug specific student fee record
 */
export const debugStudentFeeRecord = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('🔍 Debug: Checking fee record for student:', studentId);
    
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }
    
    // Find all fee records for this student
    const feeRecords = await FeeRecord.find({ student: studentId })
      .populate('student', 'name studentId')
      .populate('feeStructure', 'className academicYear totalAmount')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${feeRecords.length} fee records for student ${studentId}`);
    
    const debugInfo = feeRecords.map(record => ({
      id: record._id,
      student: record.student?.name,
      studentId: record.student?.studentId,
      academicYear: record.academicYear,
      status: record.status,
      totalFeeAmount: record.totalFeeAmount,
      totalAmountPaid: record.totalAmountPaid,
      remainingAmount: record.remainingAmount,
      paymentsCount: record.payments?.length || 0,
      payments: record.payments?.map(p => ({
        paymentId: p.paymentId,
        amount: p.amount,
        paymentMode: p.paymentMode,
        paymentStatus: p.paymentStatus,
        receiptUrl: p.receiptUrl,
        transactionReference: p.transactionReference,
        createdAt: p.createdAt
      })) || []
    }));
    
    console.log('📄 Debug info:', JSON.stringify(debugInfo, null, 2));
    
    res.json({
      message: `Found ${feeRecords.length} fee records for student`,
      studentId,
      records: debugInfo
    });
    
  } catch (error) {
    console.error('❌ Debug student fee record error:', error);
    res.status(500).json({ 
      message: 'Failed to debug student fee record',
      error: error.message 
    });
  }
};
/**
 * Update all fee record statuses to reflect pending payments
 */
export const updateAllFeeRecordStatuses = async (req, res) => {
  try {
    console.log('🔄 Updating all fee record statuses...');
    
    const feeRecords = await FeeRecord.find({});
    console.log(`📊 Found ${feeRecords.length} fee records to update`);
    
    let updatedCount = 0;
    
    for (const record of feeRecords) {
      const oldStatus = record.status;
      
      // Trigger the pre-save hook by saving the record
      await record.save();
      
      if (record.status !== oldStatus) {
        console.log(`✅ Updated ${record.student} status: ${oldStatus} → ${record.status}`);
        updatedCount++;
      }
    }
    
    console.log(`🎉 Updated ${updatedCount} fee record statuses`);
    
    res.json({
      message: `Successfully updated ${updatedCount} fee record statuses`,
      totalRecords: feeRecords.length,
      updatedCount
    });
    
  } catch (error) {
    console.error('❌ Update fee record statuses error:', error);
    res.status(500).json({ 
      message: 'Failed to update fee record statuses',
      error: error.message 
    });
  }
};

export const resetFeeRecords = async (req, res) => {
  try {
    console.log('⚠️ DANGER: Resetting fee records collection...');
    
    // Delete all fee records
    const deleteResult = await FeeRecord.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} fee records`);
    
    // Drop the entire collection to reset indexes
    try {
      await FeeRecord.collection.drop();
      console.log('🗑️ Dropped fee records collection');
    } catch (dropError) {
      console.log('ℹ️ Collection already empty or not found');
    }
    
    // Recreate the collection with proper indexes
    const newRecord = new FeeRecord({
      student: new mongoose.Types.ObjectId(),
      feeStructure: new mongoose.Types.ObjectId(),
      academicYear: '2026-2027',
      totalFeeAmount: 1000,
      remainingAmount: 1000,
      status: 'UNPAID',
      dueDate: new Date(),
      payments: [],
      installmentsPaid: [],
      totalAmountPaid: 0,
      lateFee: 0,
      discount: 0
    });
    
    // Save and immediately delete to recreate collection with proper schema
    await newRecord.save();
    await FeeRecord.deleteMany({});
    
    console.log('✅ Fee records collection reset successfully');
    
    res.json({
      message: 'Fee records collection reset successfully',
      deletedCount: deleteResult.deletedCount,
      warning: 'All fee records have been deleted. You can now create fee structures without index conflicts.'
    });
    
  } catch (error) {
    console.error('❌ Reset fee records error:', error);
    res.status(500).json({ 
      message: 'Failed to reset fee records collection',
      error: error.message 
    });
  }
};