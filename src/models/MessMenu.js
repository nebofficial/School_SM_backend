import mongoose from 'mongoose';

const MessMenuSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun, 1=Mon, ...
    mealType: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner'], trim: true },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

MessMenuSchema.index({ academicYearId: 1, dayOfWeek: 1, mealType: 1 }, { unique: true });

export const MessMenu = mongoose.models.MessMenu || mongoose.model('MessMenu', MessMenuSchema);
