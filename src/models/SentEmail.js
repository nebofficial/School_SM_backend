import mongoose from 'mongoose';

const SentEmailSchema = new mongoose.Schema(
  {
    receiverType: { type: String, trim: true, default: '' },
    receiver: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    body: { type: String, default: '' },
    sentAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export const SentEmail = mongoose.models.SentEmail || mongoose.model('SentEmail', SentEmailSchema);
