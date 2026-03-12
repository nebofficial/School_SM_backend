import mongoose from 'mongoose';

const CertificateTypeSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    schoolName: { type: String, trim: true, default: '' },
    certificateText: { type: String, trim: true, default: '' },
    background: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

CertificateTypeSchema.index({ academicYearId: 1, name: 1 });

export const CertificateType =
  mongoose.models.CertificateType || mongoose.model('CertificateType', CertificateTypeSchema);
