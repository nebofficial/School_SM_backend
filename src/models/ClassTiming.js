import mongoose from 'mongoose';

const SessionSlotSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    isBreak: { type: Boolean, default: false },
    startTime: { type: String, trim: true, required: true },
    endTime: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const ClassTimingSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    sessions: [SessionSlotSchema],
  },
  { timestamps: true }
);

ClassTimingSchema.index({ name: 1 });

export const ClassTiming =
  mongoose.models.ClassTiming || mongoose.model('ClassTiming', ClassTimingSchema);
