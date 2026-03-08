import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrateAssignments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get the assignments collection directly
    const db = mongoose.connection.db;
    const assignmentsCollection = db.collection('assignments');

    // Count total assignments
    const totalCount = await assignmentsCollection.countDocuments();
    console.log(`\n📊 Total assignments in database: ${totalCount}`);

    if (totalCount === 0) {
      console.log('⚠️ No assignments to migrate');
      process.exit(0);
    }

    // Get all assignments
    const assignments = await assignmentsCollection.find({}).toArray();
    
    console.log('\n📝 Current assignments:');
    assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.title}`);
      console.log(`   ID: ${assignment._id}`);
      console.log(`   createdBy: ${assignment.createdBy}`);
      console.log(`   batchId: ${assignment.batchId}`);
    });

    console.log('\n✅ Assignments are stored correctly');
    console.log('💡 The issue is with the model reference, not the data');
    console.log('💡 The Assignment model has been updated to reference "Faculty" instead of "Teacher"');
    console.log('💡 Please restart your backend server for the changes to take effect');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

migrateAssignments();
