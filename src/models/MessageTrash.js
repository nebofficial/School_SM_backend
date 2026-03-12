import mongoose from 'mongoose';

const MessageTrashSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
  },
  { timestamps: true }
);

MessageTrashSchema.index({ userId: 1, messageId: 1 }, { unique: true });

export const MessageTrash = mongoose.models.MessageTrash || mongoose.model('MessageTrash', MessageTrashSchema);
