import mongoose from 'mongoose';

const StudentDocumentSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    documentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentType', required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    filePath: { type: String, required: true, trim: true },
    fileName: { type: String, trim: true, default: '' },
    originalFileName: { type: String, trim: true, default: '' },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, trim: true, default: '' },
    customTypeName: { type: String, trim: true, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StudentDocumentSchema.index({ registrationId: 1, documentTypeId: 1, academicYearId: 1 });
StudentDocumentSchema.index({ academicYearId: 1, registrationId: 1 });

export const StudentDocument =
  mongoose.models.StudentDocument || mongoose.model('StudentDocument', StudentDocumentSchema);
