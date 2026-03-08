import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Student from '../models/Student.js';
import Faculty from '../models/Teacher.js';
import Batch from '../models/Class.js';

dotenv.config();

const testAssignmentFlow = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get assignment
    const assignment = await Assignment.findOne()
      .populate('createdBy', 'name teacherId')
      .populate('batchId', 'batchName');
    
    if (!assignment) {
      console.log('⚠️ No assignments found');
      process.exit(0);
    }

    console.log('\n📝 Assignment Details:');
    console.log(`   Title: ${assignment.title}`);
    console.log(`   Subject: ${assignment.subject}`);
    console.log(`   Batch: ${assignment.batchId?.batchName}`);
    console.log(`   Created By: ${assignment.createdBy?.name}`);
    console.log(`   Due Date: ${assignment.dueDate}`);

    // Get students in this batch
    const students = await Student.find({ batchId: assignment.batchId._id });
    console.log(`\n👥 Students in batch: ${students.length}`);
    students.forEach(s => {
      console.log(`   - ${s.name} (${s.studentId})`);
    });

    // Get submissions for this assignment
    const submissions = await AssignmentSubmission.find({ assignment: assignment._id })
      .populate('student', 'name studentId');
    
    console.log(`\n📤 Submissions: ${submissions.length}`);
    if (submissions.length === 0) {
      console.log('   No submissions yet');
    } else {
      submissions.forEach(sub => {
        console.log(`   - ${sub.student?.name}: ${sub.files?.length || 0} files`);
      });
    }

    console.log('\n✅ Assignment flow test complete');
    console.log('\n💡 To test:');
    console.log('   1. Login as student');
    console.log('   2. Go to "My Assignments"');
    console.log('   3. Click "Submit" on the assignment');
    console.log('   4. Upload PDF files');
    console.log('   5. Login as teacher');
    console.log('   6. Go to "My Assignments"');
    console.log('   7. Click "View Submissions"');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testAssignmentFlow();
