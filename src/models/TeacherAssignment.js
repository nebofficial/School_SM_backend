import mongoose from 'mongoose';

const TeacherAssignmentSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicClass',
      required: true,
      index: true
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSection',
      required: true,
      index: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSubject',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

TeacherAssignmentSchema.index(
  { academicYearId: 1, staffId: 1, classId: 1, sectionId: 1, subjectId: 1 },
  { unique: true }
);

export const TeacherAssignment =
  mongoose.models.TeacherAssignment ||
  mongoose.model('TeacherAssignment', TeacherAssignmentSchema);

