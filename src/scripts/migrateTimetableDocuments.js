import mongoose from 'mongoose';
import TimetableDocument from '../models/TimetableDocument.js';

/**
 * Migration script to fix old TimetableDocument records
 * that have 'class' field instead of 'batchId'
 */
async function migrateTimetableDocuments() {
  try {
    console.log('🔄 Starting TimetableDocument migration...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/college-erp';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all documents with 'class' field
    const documents = await mongoose.connection.db
      .collection('timetabledocuments')
      .find({ class: { $exists: true } })
      .toArray();

    console.log(`📄 Found ${documents.length} documents with 'class' field`);

    if (documents.length === 0) {
      console.log('✅ No migration needed');
      process.exit(0);
    }

    // Update each document
    for (const doc of documents) {
      await mongoose.connection.db
        .collection('timetabledocuments')
        .updateOne(
          { _id: doc._id },
          {
            $set: { batchId: doc.class },
            $unset: { class: '' }
          }
        );
      console.log(`✅ Migrated document ${doc._id}`);
    }

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateTimetableDocuments();
