import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    nationalId: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    gender: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    religion: { type: String, trim: true },
    birthDate: { type: Date },
    presentAddress: { type: String, trim: true },
    permanentAddress: { type: String, trim: true },
    role: {
      type: String,
      enum: ['teacher', 'accountant', 'librarian', 'admin', 'staff'],
      default: 'teacher',
      index: true
    },
    department: { type: String, trim: true },
    qualification: { type: String, trim: true },
    experienceYears: { type: Number, default: 0 },
    joinDate: { type: Date },
    username: { type: String, trim: true },
    password: { type: String, trim: true },
    salaryGrade: { type: String, trim: true },
    salaryType: { type: String, trim: true },
    resumeUrl: { type: String, trim: true },
    isViewOnWeb: { type: Boolean, default: true },
    facebookUrl: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    twitterUrl: { type: String, trim: true },
    instagramUrl: { type: String, trim: true },
    youtubeUrl: { type: String, trim: true },
    pinterestUrl: { type: String, trim: true },
    otherInfo: { type: String, trim: true },
    photoUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'resigned'],
      default: 'active',
      index: true
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

StaffSchema.index({ academicYearId: 1, fullName: 1 });

export const Staff =
  mongoose.models.Staff || mongoose.model('Staff', StaffSchema);

