import mongoose from 'mongoose';

const AcademicCalendarSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    eventDate: { type: Date, required: true, index: true },
    eventType: {
      type: String,
      enum: ['holiday', 'exam', 'event', 'meeting', 'other'],
      default: 'event',
      index: true
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true
    }
  },
  { timestamps: true }
);

AcademicCalendarSchema.index({ academicYearId: 1, eventDate: 1 });

export const AcademicCalendar =
  mongoose.models.AcademicCalendar ||
  mongoose.model('AcademicCalendar', AcademicCalendarSchema);
