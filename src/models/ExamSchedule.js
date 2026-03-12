import mongoose from 'mongoose';

const AdditionalSubjectSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    date: { type: Date, default: null },
    startTime: { type: String, trim: true, default: '' },
    duration: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const ExamScheduleSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicClass',
      required: true,
    },
    isReassessment: { type: Boolean, default: false },
    examGradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamGrade',
      default: null,
    },
    examAssessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAssessment',
      default: null,
    },
    observationParameterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ObservationParameter',
      default: null,
    },
    competencyParameterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompetencyParameter',
      default: null,
    },
    lastExamDate: { type: Date, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    description: { type: String, trim: true, default: '' },
    additionalSubjects: { type: [AdditionalSubjectSchema], default: [] },
  },
  { timestamps: true }
);

ExamScheduleSchema.index({ examId: 1 });
ExamScheduleSchema.index({ classId: 1 });

export const ExamSchedule =
  mongoose.models.ExamSchedule || mongoose.model('ExamSchedule', ExamScheduleSchema);
