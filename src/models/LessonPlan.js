import mongoose from 'mongoose';

const LessonPlanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSubject',
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
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    },
    plannedDate: { type: Date, required: true, index: true },
    duration: { type: Number, default: 40 }, // minutes
    objectives: [String],
    materials: [String],
    activities: [String],
    homework: { type: String, trim: true },
    status: {
      type: String,
      enum: ['planned', 'completed', 'cancelled'],
      default: 'planned',
      index: true
    }
  },
  { timestamps: true }
);

LessonPlanSchema.index({ academicYearId: 1, staffId: 1, plannedDate: 1 });
LessonPlanSchema.index({ academicYearId: 1, classId: 1, sectionId: 1, subjectId: 1 });

export const LessonPlan =
  mongoose.models.LessonPlan || mongoose.model('LessonPlan', LessonPlanSchema);
