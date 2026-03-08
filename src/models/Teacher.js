import mongoose from "mongoose";

const phoneSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ["primary", "secondary"],
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const qualificationSchema = new mongoose.Schema(
  {
    degree: String,
    institution: String,
    year: Number,
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String, // user-given name (Aadhaar, Resume, etc.)
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String, // stored file path / cloud URL
      required: true,
    },
    originalName: {
      type: String, // original uploaded filename
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const facultySchema = new mongoose.Schema(
  {
    teacherId: {
      type: String,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    /* ✅ ADDED */
    fatherName: {
      type: String,
      trim: true,
      required: true,
    },
    motherName: {
      type: String,
      trim: true,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    designation: {
  type: String,
  default: "Assistant Professor"
},

department: {
  type: String,
  required: true
},

    role: {
      type: String,
      default: "TEACHER",
    },

    /* ✅ One mandatory + one optional phone */
    phoneNumbers: {
      type: [phoneSchema],
      validate: {
        validator: function (phones) {
          const primaryCount = phones.filter(
            (p) => p.label === "primary",
          ).length;
          const secondaryCount = phones.filter(
            (p) => p.label === "secondary",
          ).length;
          return primaryCount === 1 && secondaryCount <= 1;
        },
        message:
          "Exactly one primary phone number and at most one secondary phone number are allowed",
      },
      required: true,
    },

    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },

    dob: {
      type: Date,
      required: true,
    },

    joinedDate: Date,

    bloodGroup: String,

    maritalStatus: String,

    partnerName: {
      type: String,
      trim: true,
    },

    documents: {
      type: [documentSchema],
      default: [],
    },

    image: String,

    qualifications: [qualificationSchema],
  },
  { timestamps: true },
);

facultySchema.virtual("age").get(function () {
  if (!this.dob) return null;

  const today = new Date();
  let age = today.getFullYear() - this.dob.getFullYear();

  const m = today.getMonth() - this.dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < this.dob.getDate())) {
    age--;
  }

  return age;
});

facultySchema.set("toJSON", { virtuals: true });
facultySchema.set("toObject", { virtuals: true });

export default mongoose.model("Faculty", facultySchema);
