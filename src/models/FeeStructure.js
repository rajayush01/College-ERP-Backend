import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
    default: () => {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    }
  },
  feeBreakdown: {
    tuitionFee: {
      type: Number,
      required: true,
      default: 0
    },
    examFee: {
      type: Number,
      required: true,
      default: 0
    },
    transportFee: {
      type: Number,
      required: true,
      default: 0
    },
    libraryFee: {
      type: Number,
      default: 0
    },
    labFee: {
      type: Number,
      default: 0
    },
    sportsFee: {
      type: Number,
      default: 0
    },
    developmentFee: {
      type: Number,
      default: 0
    },
    miscellaneousFee: {
      type: Number,
      default: 0
    }
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  installments: [{
    installmentNumber: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // PDF Document fields
  feeStructureDocument: {
    fileUrl: {
      type: String,
      default: ''
    },
    fileKey: {
      type: String,
      default: ''
    },
    originalName: {
      type: String,
      default: ''
    },
    uploadedAt: {
      type: Date,
      default: null
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total amount before saving
feeStructureSchema.pre('save', function(next) {
  console.log('🧮 Pre-save hook triggered for FeeStructure');
  console.log('📊 Fee breakdown received:', JSON.stringify(this.feeBreakdown, null, 2));
  
  const breakdown = this.feeBreakdown || {};
  
  // Ensure all values are numbers
  const tuitionFee = Number(breakdown.tuitionFee) || 0;
  const examFee = Number(breakdown.examFee) || 0;
  const transportFee = Number(breakdown.transportFee) || 0;
  const libraryFee = Number(breakdown.libraryFee) || 0;
  const labFee = Number(breakdown.labFee) || 0;
  const sportsFee = Number(breakdown.sportsFee) || 0;
  const developmentFee = Number(breakdown.developmentFee) || 0;
  const miscellaneousFee = Number(breakdown.miscellaneousFee) || 0;
  
  const total = tuitionFee + examFee + transportFee + libraryFee + labFee + sportsFee + developmentFee + miscellaneousFee;
  
  console.log('💰 Individual fees:', {
    tuitionFee, examFee, transportFee, libraryFee, 
    labFee, sportsFee, developmentFee, miscellaneousFee
  });
  console.log('🎯 Calculated total amount:', total);
  
  this.totalAmount = total;
  this.updatedAt = new Date();
  
  console.log('✅ Total amount set to:', this.totalAmount);
  next();
});



const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

export default FeeStructure;