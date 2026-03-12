import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    eventFor: { type: String, trim: true, default: '' },
    eventPlace: { type: String, trim: true, default: '' },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    image: { type: String, default: '' },
    note: { type: String, default: '' },
    isViewOnWeb: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
