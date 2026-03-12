import mongoose from 'mongoose';

const SmsProviderConfigSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, trim: true, unique: true }, // clicktell, twilio, bulk, msg91, plivo, textlocal
    isActive: { type: Boolean, default: false },
    config: { type: mongoose.Schema.Types.Mixed, default: {} }, // provider-specific fields as JSON
  },
  { timestamps: true }
);

export const SmsProviderConfig = mongoose.models.SmsProviderConfig || mongoose.model('SmsProviderConfig', SmsProviderConfigSchema);
