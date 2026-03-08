import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String, // user given name: Aadhaar, TC, Report Card, etc.
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String, // multer path / cloud url
      required: true,
    },
    originalName: {
      type: String, // uploaded file name
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    enrollmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    department: {
      type: String,
      required: true
    },

    program: {
      type: String,
      required: true
    },

    semester: {
      type: Number,
      required: true
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true
    },

   
    fatherName: {
      type: String,
      trim: true,
    },

    motherName: {
      type: String,
      trim: true,
    },

    parentsEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid parent email"],
    },

  
    studentEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid student email"],
    },

    phoneNumbers: {
      type: [String],
      default: [],
    },

    address: {
      type: String,
      trim: true,
    },

    bloodGroup: String,
    caste: String,

    dob: {
      type: Date,
      required: true,
    },

    joinedDate: Date,

    image: String,


      documents: {
      type: [documentSchema],
      default: [],
    },


    
    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      default: "STUDENT",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


studentSchema.virtual("age").get(function () {
  if (!this.dob) return null;

  const today = new Date();
  let age = today.getFullYear() - this.dob.getFullYear();
  const m = today.getMonth() - this.dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < this.dob.getDate())) {
    age--;
  }

  return age;
});



studentSchema.index(
  { enrollmentNumber: 1 },
  { unique: true }
);

export default mongoose.model("Student", studentSchema);
