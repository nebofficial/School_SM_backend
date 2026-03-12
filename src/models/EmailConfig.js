import mongoose from 'mongoose';

const EmailConfigSchema = new mongoose.Schema(
  {
    emailProtocol: { type: String, trim: true, default: 'smtp' },
    emailType: { type: String, trim: true, default: 'html' },
    charSet: { type: String, trim: true, default: 'utf-8' },
    priority: { type: String, trim: true, default: 'normal' },
    fromName: { type: String, trim: true, default: '' },
    fromEmail: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export const EmailConfig = mongoose.models.EmailConfig || mongoose.model('EmailConfig', EmailConfigSchema);
