import mongoose from 'mongoose';

const LibraryMemberSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    memberType: { type: String, enum: ['student', 'staff'], required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

LibraryMemberSchema.index({ academicYearId: 1, memberType: 1, studentId: 1 }, { sparse: true });
LibraryMemberSchema.index({ academicYearId: 1, memberType: 1, staffId: 1 }, { sparse: true });

export const LibraryMember =
  mongoose.models.LibraryMember || mongoose.model('LibraryMember', LibraryMemberSchema);
