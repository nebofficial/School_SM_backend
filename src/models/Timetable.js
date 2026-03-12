import mongoose from 'mongoose';

const DayConfigSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], required: true },
    holiday: { type: Boolean, default: false },
    classTimingId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassTiming', default: null },
  },
  { _id: false }
);

const TimetableSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicClass',
      required: true,
    },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    effectiveDate: { type: Date, required: true },
    description: { type: String, trim: true, default: '' },
    dailyConfig: [DayConfigSchema],
  },
  { timestamps: true }
);

TimetableSchema.index({ classId: 1, effectiveDate: 1 });

export const Timetable =
  mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema);
