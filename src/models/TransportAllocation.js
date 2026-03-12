import mongoose from 'mongoose';

const TransportAllocationSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      index: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true,
    },
    stopName: { type: String, required: true, trim: true },
    stopKm: { type: Number, default: 0 },
    stopFare: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

TransportAllocationSchema.index({ academicYearId: 1, studentId: 1 }, { unique: true });

export const TransportAllocation = mongoose.models.TransportAllocation || mongoose.model('TransportAllocation', TransportAllocationSchema);
