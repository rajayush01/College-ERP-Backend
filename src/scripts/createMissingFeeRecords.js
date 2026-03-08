import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import FeeRecord from '../models/FeeRecord.js';
import FeeStructure from '../models/FeeStructure.js';

dotenv.config();

const createMissingFeeRecords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all fee structures
    const feeStructures = await FeeStructure.find();
    console.log(`\n📋 Found ${feeStructures.length} fee structures`);

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const feeStructure of feeStructures) {
      console.log(`\n💰 Processing fee structure: ${feeStructure._id}`);
      console.log(`   Academic Year: ${feeStructure.academicYear}`);
      console.log(`   Batch ID (className): ${feeStructure.className}`);

      // Find all students in this batch
      if (!mongoose.Types.ObjectId.isValid(feeStructure.className)) {
        console.log(`   ⚠️ Invalid batch ID, skipping`);
        continue;
      }

      const students = await Student.find({ batchId: feeStructure.className });
      console.log(`   👥 Found ${students.length} students in this batch`);

      for (const student of students) {
        // Check if fee record already exists
        const existingRecord = await FeeRecord.findOne({
          student: student._id,
          feeStructure: feeStructure._id
        });

        if (existingRecord) {
          console.log(`   ⏭️  Skipping ${student.name} - record exists`);
          totalSkipped++;
          continue;
        }

        // Create fee record
        const feeRecord = new FeeRecord({
          student: student._id,
          feeStructure: feeStructure._id,
          academicYear: feeStructure.academicYear,
          totalFeeAmount: feeStructure.totalAmount,
          remainingAmount: feeStructure.totalAmount,
          status: 'UNPAID',
          dueDate: feeStructure.dueDate,
          payments: [],
          installmentsPaid: [],
          totalAmountPaid: 0,
          lateFee: 0,
          discount: 0
        });

        await feeRecord.save();
        console.log(`   ✅ Created fee record for ${student.name} (${student.studentId})`);
        totalCreated++;
      }
    }

    console.log(`\n🎉 Summary:`);
    console.log(`   Created: ${totalCreated} fee records`);
    console.log(`   Skipped: ${totalSkipped} (already existed)`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createMissingFeeRecords();
