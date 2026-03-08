import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Teacher from '../models/Teacher.js';
import Batch from '../models/Class.js';

dotenv.config();

const checkTeacherBatchAssignment = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all teachers
    const teachers = await Teacher.find().limit(5);
    console.log('\n👨‍🏫 Teachers:');
    teachers.forEach(t => {
      console.log(`  - ${t.name} (${t.teacherId})`);
      console.log(`    ID: ${t._id}`);
    });

    // Get all batches
    const batches = await Batch.find();
    console.log('\n📚 Batches:');
    for (const batch of batches) {
      console.log(`\n  Batch: ${batch.batchName}`);
      console.log(`    ID: ${batch._id}`);
      console.log(`    Department: ${batch.department}`);
      console.log(`    Program: ${batch.program}`);
      console.log(`    Semester: ${batch.semester}`);
      console.log(`    Batch Advisor: ${batch.batchAdvisor || 'None'}`);
      console.log(`    Subject Faculty:`);
      if (batch.subjectFaculty && batch.subjectFaculty.length > 0) {
        batch.subjectFaculty.forEach(sf => {
          console.log(`      - ${sf.subject}: ${sf.faculty}`);
        });
      } else {
        console.log(`      - None assigned`);
      }
    }

    // Check which batches each teacher is assigned to
    console.log('\n🔍 Teacher-Batch Assignments:');
    for (const teacher of teachers) {
      const assignedBatches = await Batch.find({
        $or: [
          { batchAdvisor: teacher._id },
          { "subjectFaculty.faculty": teacher._id },
        ],
      });
      
      console.log(`\n  ${teacher.name}:`);
      if (assignedBatches.length === 0) {
        console.log(`    ⚠️ Not assigned to any batch`);
      } else {
        assignedBatches.forEach(batch => {
          console.log(`    ✅ ${batch.batchName}`);
          const subjects = batch.subjectFaculty
            .filter(sf => sf.faculty.toString() === teacher._id.toString())
            .map(sf => sf.subject);
          if (subjects.length > 0) {
            console.log(`       Subjects: ${subjects.join(', ')}`);
          }
          if (batch.batchAdvisor && batch.batchAdvisor.toString() === teacher._id.toString()) {
            console.log(`       Role: Batch Advisor`);
          }
        });
      }
    }

    console.log('\n✅ Check complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkTeacherBatchAssignment();
