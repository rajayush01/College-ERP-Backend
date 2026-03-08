import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assignment from '../models/Assignment.js';
import Faculty from '../models/Teacher.js';
import Batch from '../models/Class.js';

dotenv.config();

const checkAssignments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all assignments
    const assignments = await Assignment.find()
      .populate('createdBy', 'name teacherId')
      .populate('batchId', 'batchName department program semester');
    
    console.log(`\n📝 Total Assignments: ${assignments.length}`);
    
    if (assignments.length === 0) {
      console.log('⚠️ No assignments found in database');
    } else {
      assignments.forEach((assignment, index) => {
        console.log(`\n${index + 1}. ${assignment.title}`);
        console.log(`   ID: ${assignment._id}`);
        console.log(`   Subject: ${assignment.subject}`);
        console.log(`   Created By: ${assignment.createdBy?.name || 'Unknown'} (${assignment.createdBy?.teacherId || 'N/A'})`);
        console.log(`   Batch: ${assignment.batchId?.batchName || 'Unknown'}`);
        console.log(`   Due Date: ${assignment.dueDate}`);
        console.log(`   Created At: ${assignment.createdAt}`);
        console.log(`   Attachments: ${assignment.attachments?.length || 0}`);
      });
    }

    // Get all faculty
    const faculty = await Faculty.find();
    console.log(`\n👨‍🏫 Total Faculty: ${faculty.length}`);
    faculty.forEach(t => {
      console.log(`  - ${t.name} (${t.teacherId}) - ID: ${t._id}`);
    });

    // Get all batches
    const batches = await Batch.find();
    console.log(`\n📚 Total Batches: ${batches.length}`);
    batches.forEach(b => {
      console.log(`  - ${b.batchName} (${b.department}) - ID: ${b._id}`);
    });

    console.log('\n✅ Check complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAssignments();
