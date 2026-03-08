import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import FeeRecord from '../models/FeeRecord.js';
import FeeStructure from '../models/FeeStructure.js';
import Batch from '../models/Class.js';

dotenv.config();

const debugFeeRecords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all students
    const students = await Student.find().populate('batchId').limit(5);
    console.log('\n📋 Sample Students:');
    students.forEach(s => {
      console.log(`  - ${s.name} (${s.studentId})`);
      console.log(`    Batch ID: ${s.batchId?._id}`);
      console.log(`    Batch Name: ${s.batchId?.batchName || 'No batch'}`);
    });

    // Get all fee structures
    const feeStructures = await FeeStructure.find();
    console.log('\n💰 Fee Structures:');
    for (const fs of feeStructures) {
      console.log(`  - ID: ${fs._id}`);
      console.log(`    className (batchId): ${fs.className}`);
      console.log(`    Academic Year: ${fs.academicYear}`);
      console.log(`    Total Amount: ₹${fs.totalAmount}`);
      
      // Try to find the batch
      if (mongoose.Types.ObjectId.isValid(fs.className)) {
        const batch = await Batch.findById(fs.className);
        console.log(`    Batch Name: ${batch?.batchName || 'Not found'}`);
      }
    }

    // Get all fee records
    const feeRecords = await FeeRecord.find()
      .populate('student', 'name studentId')
      .populate('feeStructure', 'academicYear totalAmount');
    
    console.log('\n📊 Fee Records:');
    feeRecords.forEach(fr => {
      console.log(`  - Student: ${fr.student?.name} (${fr.student?.studentId})`);
      console.log(`    Academic Year: ${fr.academicYear}`);
      console.log(`    Total Amount: ₹${fr.totalFeeAmount}`);
      console.log(`    Status: ${fr.status}`);
      console.log(`    Fee Structure ID: ${fr.feeStructure?._id}`);
    });

    // Check for mismatches
    console.log('\n🔍 Checking for issues:');
    
    const studentsWithoutBatch = await Student.countDocuments({ batchId: null });
    console.log(`  - Students without batch: ${studentsWithoutBatch}`);
    
    const feeRecordsWithoutStructure = await FeeRecord.countDocuments({ feeStructure: null });
    console.log(`  - Fee records without structure: ${feeRecordsWithoutStructure}`);

    console.log('\n✅ Debug complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugFeeRecords();
