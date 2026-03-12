import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    vehicleNumber: { type: String, required: true, trim: true },
    vehicleModel: { type: String, required: true, enum: ['bus', 'van', 'mini-bus'], trim: true },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    vehicleLicense: { type: String, trim: true, default: '' },
    vehicleContact: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

VehicleSchema.index({ academicYearId: 1, vehicleNumber: 1 }, { unique: true });

export const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
