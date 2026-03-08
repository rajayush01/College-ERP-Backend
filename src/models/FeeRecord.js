import mongoose from 'mongoose';

const feeRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  totalFeeAmount: {
    type: Number,
    required: true
  },
  totalAmountPaid: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'DEFAULTER', 'OVERDUE'],
    default: 'UNPAID'
  },
  dueDate: {
    type: Date,
    required: true
  },
  payments: [{
    paymentId: {
      type: String,
      required: false,
      default: null
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'CHEQUE', 'BANK_TRANSFER', 'CARD', 'ONLINE'],
      required: true
    },
    paymentDate: {
      type: Date,
      required: true
    },
    transactionReference: {
      type: String,
      default: ''
    },
    receiptUrl: {
      type: String,
      default: ''
    },
    receiptKey: {
      type: String,
      default: ''
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    remarks: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  installmentsPaid: [{
    installmentNumber: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paidDate: {
      type: Date,
      required: true
    },
    paymentId: {
      type: String,
      required: true
    }
  }],
  lateFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  discountReason: {
    type: String,
    default: ''
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

// Update remaining amount and status before saving
feeRecordSchema.pre('save', function(next) {
  // Calculate total approved payments
  const approvedPayments = this.payments.filter(payment => payment.paymentStatus === 'APPROVED');
  this.totalAmountPaid = approvedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calculate remaining amount
  this.remainingAmount = Math.max(0, this.totalFeeAmount + this.lateFee - this.discount - this.totalAmountPaid);
  
  // Check if there are any pending payments
  const hasPendingPayments = this.payments.some(payment => payment.paymentStatus === 'PENDING');
  
  // Update status based on payment
  if (this.totalAmountPaid === 0 && !hasPendingPayments) {
    this.status = new Date() > this.dueDate ? 'OVERDUE' : 'UNPAID';
  } else if (this.remainingAmount === 0 && this.totalAmountPaid > 0) {
    this.status = 'PAID';
  } else if (this.totalAmountPaid > 0 || hasPendingPayments) {
    // If there are approved payments OR pending payments, mark as partially paid
    this.status = new Date() > this.dueDate && this.totalAmountPaid === 0 ? 'DEFAULTER' : 'PARTIALLY_PAID';
  }
  
  this.updatedAt = new Date();
  next();
});

// Generate unique payment ID
feeRecordSchema.methods.generatePaymentId = function() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PAY${timestamp}${random}`;
};



const FeeRecord = mongoose.model('FeeRecord', feeRecordSchema);

export default FeeRecord;