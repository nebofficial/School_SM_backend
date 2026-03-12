import mongoose from 'mongoose';

const RouteStopSchema = new mongoose.Schema({
  stopName: { type: String, required: true, trim: true },
  stopKm: { type: Number, default: 0 },
  stopFare: { type: Number, default: 0 },
});

const RouteSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    routeName: { type: String, required: true, trim: true },
    routeStart: { type: String, required: true, trim: true },
    routeEnd: { type: String, required: true, trim: true },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    stops: [RouteStopSchema],
  },
  { timestamps: true }
);

RouteSchema.index({ academicYearId: 1, routeName: 1 }, { unique: true });

export const Route = mongoose.models.Route || mongoose.model('Route', RouteSchema);
