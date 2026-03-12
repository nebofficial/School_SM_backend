import mongoose from 'mongoose';

const DriverSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    license: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    assignedVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
  },
  { timestamps: true }
);

export const Driver = mongoose.models.Driver || mongoose.model('Driver', DriverSchema);
