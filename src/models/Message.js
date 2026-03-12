import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true, trim: true, index: true },
    senderName: { type: String, required: true, trim: true },
    recipientId: { type: String, required: true, trim: true, index: true },
    recipientName: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },
    isDraft: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
