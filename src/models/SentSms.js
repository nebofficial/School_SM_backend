import mongoose from 'mongoose';

const SentSmsSchema = new mongoose.Schema(
  {
    receiverType: { type: String, trim: true, default: '' },
    receiver: { type: String, trim: true, default: '' },
    message: { type: String, default: '' },
    gateway: { type: String, trim: true, default: '' },
    sentAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export const SentSms = mongoose.models.SentSms || mongoose.model('SentSms', SentSmsSchema);
