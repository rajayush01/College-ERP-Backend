import FeeStructure from '../../models/FeeStructure.js';
import FeeRecord from '../../models/FeeRecord.js';
import Class from '../../models/Class.js';
import Batch from '../../models/Class.js'; // Batch model is exported from Class.js
import Student from '../../models/Student.js';
import Admin from '../../models/Admin.js';
import { uploadToR2, deleteFromR2 } from '../../services/r2Upload.service.js';
import mongoose from 'mongoose';

/**
 * Create Fee Structure for a Class (applies to all sections)
 */
export const createFeeStructure = async (req, res) => {
  try {
    console.log('📝 Creating fee structure with data:', req.body);
    console.log('📎 File received:', req.file ? req.file.originalname : 'No file');
    
    const {
      class: className,
      academicYear,
      feeBreakdown,
      dueDate,
      installments
    } = req.body;

    // Parse JSON strings from FormData
    let parsedFeeBreakdown;
    let parsedInstallments;
    
    try {
      parsedFeeBreakdown = typeof feeBreakdown === 'string' ? JSON.parse(feeBreakdown) : feeBreakdown;
    } catch (error) {
      console.error('❌ Failed to parse feeBreakdown:', error);
      return res.status(400).json({
        message: 'Invalid fee breakdown format'
      });
    }
    
    try {
      parsedInstallments = typeof installments === 'string' ? JSON.parse(installments) : (installments || []);
    } catch (error) {
      console.error('❌ Failed to parse installments:', error);
      return res.status(400).json({
        message: 'Invalid installments format'
      });
    }

    console.log('🏫 Class name received:', className);
    console.log('💰 Fee breakdown received:', parsedFeeBreakdown);

    // Validate required fields
    if (!className || !parsedFeeBreakdown || !dueDate) {
      return res.status(400).json({
        message: 'Class, fee breakdown, and due date are required'
      });
    }

    // Ensure fee breakdown values are numbers
    const sanitizedFeeBreakdown = {
      tuitionFee: Number(parsedFeeBreakdown.tuitionFee) || 0,
      examFee: Number(parsedFeeBreakdown.examFee) || 0,
      transportFee: Number(parsedFeeBreakdown.transportFee) || 0,
      libraryFee: Number(parsedFeeBreakdown.libraryFee) || 0,
      labFee: Number(parsedFeeBreakdown.labFee) || 0,
      sportsFee: Number(parsedFeeBreakdown.sportsFee) || 0,
      developmentFee: Number(parsedFeeBreakdown.developmentFee) || 0,
      miscellaneousFee: Number(parsedFeeBreakdown.miscellaneousFee) || 0,
    };

    console.log('🔢 Sanitized fee breakdown:', sanitizedFeeBreakdown);

    // Check if fee structure already exists for this class and academic year
    const existingStructure = await FeeStructure.findOne({
      className,
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    });

    if (existingStructure) {
      return res.status(400).json({
        message: 'Fee structure already exists for this class and academic year'
      });
    }

    // Handle PDF upload if provided
    let feeStructureDocument = {
      fileUrl: '',
      fileKey: '',
      originalName: '',
      uploadedAt: null
    };

    if (req.file) {
      console.log('📤 Uploading fee structure document to R2...');
      try {
        const uploadResult = await uploadToR2(
          req.file.buffer,
          req.file.originalname,
          'fee-structure-documents',
          `${className}-${academicYear || new Date().getFullYear()}`,
          req.file.mimetype
        );
        
        feeStructureDocument = {
          fileUrl: uploadResult.fileUrl,
          fileKey: uploadResult.fileKey,
          originalName: uploadResult.originalName,
          uploadedAt: new Date()
        };
        
        console.log('✅ Fee structure document uploaded:', uploadResult.fileUrl);
      } catch (uploadError) {
        console.error('❌ Failed to upload fee structure document:', uploadError);
        return res.status(500).json({
          message: 'Failed to upload fee structure document'
        });
      }
    }

    // Create fee structure
    const feeStructureData = {
      className,
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      feeBreakdown: sanitizedFeeBreakdown,
      dueDate,
      installments: parsedInstallments,
      feeStructureDocument,
      createdBy: req.user.id
    };

    console.log('📋 Fee structure data before creating:', JSON.stringify(feeStructureData, null, 2));

    const feeStructure = new FeeStructure(feeStructureData);

    console.log('💾 Fee structure object before save:', JSON.stringify(feeStructure.toObject(), null, 2));
    await feeStructure.save();
    console.log('✅ Fee structure saved successfully with total amount:', feeStructure.totalAmount);

    // Find all students in this batch
    console.log(`🔍 Finding students in batch: ${className}`);
    
    // The className is actually a batchId from the frontend
    const batchId = className;
    
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      console.log(`⚠️ Invalid batch ID: ${batchId}`);
      return res.status(400).json({
        message: `Invalid batch ID: ${batchId}`
      });
    }
    
    // Find all students in this batch
    const batchStudents = await Student.find({ 
      batchId: batchId 
    }).populate('batchId');
    
    console.log(`👥 Found ${batchStudents.length} students in batch ${batchId}:`, 
      batchStudents.map(s => ({ 
        id: s._id, 
        name: s.name, 
        studentId: s.studentId,
        batch: s.batchId ? s.batchId.batchName : 'No batch'
      })));
    
    if (batchStudents.length === 0) {
      console.log(`⚠️ No students found in batch ${batchId}`);
      return res.status(400).json({
        message: `No students found in this batch. Please add students to this batch first.`
      });
    }
    
    // Create fee records for all students in this batch
    console.log('📋 Creating fee records for students...');
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const student of batchStudents) {
      // Check if fee record already exists for this student and academic year
      const existingRecord = await FeeRecord.findOne({
        student: student._id,
        academicYear: feeStructure.academicYear
      });
      
      if (existingRecord) {
        console.log(`⚠️ Fee record already exists for student ${student.name} (${student.studentId}) for academic year ${feeStructure.academicYear}`);
        skippedCount++;
        continue;
      }
      
      // Create new fee record
      const feeRecord = new FeeRecord({
        student: student._id,
        feeStructure: feeStructure._id,
        academicYear: feeStructure.academicYear,
        totalFeeAmount: feeStructure.totalAmount,
        remainingAmount: feeStructure.totalAmount,
        status: 'UNPAID',
        dueDate,
        payments: [], // Explicitly set empty payments array
        installmentsPaid: [], // Explicitly set empty installments array
        totalAmountPaid: 0,
        lateFee: 0,
        discount: 0
      });
      
      await feeRecord.save();
      createdCount++;
      
      console.log(`✅ Created fee record for ${student.name} (${student.studentId}) - Amount: ₹${feeRecord.totalFeeAmount} - Status: ${feeRecord.status}`);
    }
    
    console.log(`🎉 Fee record creation summary: ${createdCount} created, ${skippedCount} skipped (already existed)`);
    
    if (createdCount === 0 && skippedCount > 0) {
      return res.status(400).json({
        message: `Fee records already exist for all students in this batch for academic year ${feeStructure.academicYear}`,
        studentsAffected: skippedCount
      });
    }

    res.status(201).json({
      message: 'Fee structure created successfully',
      feeStructure: {
        ...feeStructure.toObject(),
        class: { name: className, section: 'All Students' }
      },
      studentsAffected: batchStudents.length,
      feeRecordsCreated: createdCount,
      feeRecordsSkipped: skippedCount
    });

  } catch (error) {
    console.error('Create fee structure error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get All Fee Structures
 */
export const getAllFeeStructures = async (req, res) => {
  try {
    const { page = 1, limit = 10, academicYear, className } = req.query;

    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (className) filter.className = className;

    const feeStructures = await FeeStructure.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Populate batch information for each structure
    const structuresWithBatch = await Promise.all(
      feeStructures.map(async (structure) => {
        const structureObj = structure.toObject();
        
        // Try to get batch information if className is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(structureObj.className)) {
          try {
            const batch = await Batch.findById(structureObj.className).select('batchName department program semester');
            if (batch) {
              structureObj.class = { 
                name: batch.batchName,
                section: `${batch.department} - ${batch.program}` 
              };
              structureObj.className = batch.batchName;
            } else {
              structureObj.class = { name: structureObj.className, section: 'All Students' };
            }
          } catch (err) {
            console.error('Error fetching batch:', err);
            structureObj.class = { name: structureObj.className, section: 'All Students' };
          }
        } else {
          structureObj.class = { name: structureObj.className, section: 'All Students' };
        }
        
        return structureObj;
      })
    );

    const total = await FeeStructure.countDocuments(filter);

    res.json({
      feeStructures: structuresWithBatch,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get fee structures error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get Fee Structure by ID
 */
export const getFeeStructureById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid fee structure ID' });
    }

    const feeStructure = await FeeStructure.findById(id)
      .populate('class', 'name section')
      .populate('createdBy', 'name');

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    res.json(feeStructure);

  } catch (error) {
    console.error('Get fee structure error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update Fee Structure
 */
export const updateFeeStructure = async (req, res) => {
  try {
    console.log('📝 Updating fee structure with data:', req.body);
    console.log('📎 File received:', req.file ? req.file.originalname : 'No file');
    
    const { id } = req.params;
    const {
      feeBreakdown,
      dueDate,
      installments,
      isActive
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid fee structure ID' });
    }

    const feeStructure = await FeeStructure.findById(id);
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Parse JSON strings from FormData if needed
    let parsedFeeBreakdown = feeBreakdown;
    let parsedInstallments = installments;
    
    if (typeof feeBreakdown === 'string') {
      try {
        parsedFeeBreakdown = JSON.parse(feeBreakdown);
      } catch (error) {
        console.error('❌ Failed to parse feeBreakdown:', error);
        return res.status(400).json({ message: 'Invalid fee breakdown format' });
      }
    }
    
    if (typeof installments === 'string') {
      try {
        parsedInstallments = JSON.parse(installments);
      } catch (error) {
        console.error('❌ Failed to parse installments:', error);
        return res.status(400).json({ message: 'Invalid installments format' });
      }
    }

    // Update fee structure fields
    if (parsedFeeBreakdown) {
      // Ensure fee breakdown values are numbers
      feeStructure.feeBreakdown = {
        tuitionFee: Number(parsedFeeBreakdown.tuitionFee) || 0,
        examFee: Number(parsedFeeBreakdown.examFee) || 0,
        transportFee: Number(parsedFeeBreakdown.transportFee) || 0,
        libraryFee: Number(parsedFeeBreakdown.libraryFee) || 0,
        labFee: Number(parsedFeeBreakdown.labFee) || 0,
        sportsFee: Number(parsedFeeBreakdown.sportsFee) || 0,
        developmentFee: Number(parsedFeeBreakdown.developmentFee) || 0,
        miscellaneousFee: Number(parsedFeeBreakdown.miscellaneousFee) || 0,
      };
    }
    
    if (dueDate) feeStructure.dueDate = dueDate;
    if (parsedInstallments) feeStructure.installments = parsedInstallments;
    if (typeof isActive === 'boolean') feeStructure.isActive = isActive;

    // Handle PDF upload if provided
    if (req.file) {
      console.log('📤 Uploading new fee structure document to R2...');
      try {
        // Delete old document if exists
        if (feeStructure.feeStructureDocument?.fileKey) {
          try {
            await deleteFromR2(feeStructure.feeStructureDocument.fileKey);
            console.log('🗑️ Deleted old fee structure document');
          } catch (deleteError) {
            console.warn('⚠️ Failed to delete old document:', deleteError);
          }
        }
        
        const uploadResult = await uploadToR2(
          req.file.buffer,
          req.file.originalname,
          'fee-structure-documents',
          `${feeStructure.className}-${feeStructure.academicYear}`,
          req.file.mimetype
        );
        
        feeStructure.feeStructureDocument = {
          fileUrl: uploadResult.fileUrl,
          fileKey: uploadResult.fileKey,
          originalName: uploadResult.originalName,
          uploadedAt: new Date()
        };
        
        console.log('✅ New fee structure document uploaded:', uploadResult.fileUrl);
      } catch (uploadError) {
        console.error('❌ Failed to upload fee structure document:', uploadError);
        return res.status(500).json({
          message: 'Failed to upload fee structure document'
        });
      }
    }

    await feeStructure.save();
    console.log('✅ Fee structure updated with total amount:', feeStructure.totalAmount);

    // Update existing fee records with new total amount
    const updateResult = await FeeRecord.updateMany(
      { 
        feeStructure: id,
        status: { $in: ['UNPAID', 'PARTIALLY_PAID'] } // Only update unpaid/partially paid records
      },
      {
        $set: {
          totalFeeAmount: feeStructure.totalAmount,
          dueDate: feeStructure.dueDate
        }
      }
    );
    
    console.log(`📊 Updated ${updateResult.modifiedCount} fee records`);

    // Get batch information for response
    let responseData = feeStructure.toObject();
    if (mongoose.Types.ObjectId.isValid(feeStructure.className)) {
      try {
        const batch = await Batch.findById(feeStructure.className).select('batchName department program semester');
        if (batch) {
          responseData.class = { 
            name: batch.batchName,
            section: `${batch.department} - ${batch.program}` 
          };
        }
      } catch (err) {
        console.error('Error fetching batch:', err);
      }
    }

    res.json({
      message: 'Fee structure updated successfully',
      feeStructure: responseData,
      feeRecordsUpdated: updateResult.modifiedCount
    });

  } catch (error) {
    console.error('Update fee structure error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

/**
 * Delete Fee Structure
 */
export const deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid fee structure ID' });
    }

    const feeStructure = await FeeStructure.findById(id);
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Check if there are any payments made against this fee structure
    const feeRecordsWithPayments = await FeeRecord.find({
      feeStructure: id,
      totalAmountPaid: { $gt: 0 }
    });

    if (feeRecordsWithPayments.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete fee structure with existing payments'
      });
    }

    // Delete fee records and fee structure
    await FeeRecord.deleteMany({ feeStructure: id });
    await FeeStructure.findByIdAndDelete(id);

    res.json({ message: 'Fee structure deleted successfully' });

  } catch (error) {
    console.error('Delete fee structure error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get Unique Class Names for Dropdown
 */
export const getClassesForFeeStructure = async (req, res) => {
  try {
    const classes = await Class.find({})
      .select('name')
      .sort({ name: 1 });

    // Get unique class names
    const uniqueClassNames = [...new Set(classes.map(cls => cls.name))];
    
    // Format for dropdown
    const classOptions = uniqueClassNames.map(name => ({
      name,
      _id: name,
      label: `Class ${name}`
    }));

    res.json(classOptions);

  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};