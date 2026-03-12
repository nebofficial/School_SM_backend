import mongoose from 'mongoose';

const StaffDocumentSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
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

StaffDocumentSchema.index({ staffId: 1, documentTypeId: 1, academicYearId: 1 });
StaffDocumentSchema.index({ academicYearId: 1, staffId: 1 });

export const StaffDocument =
  mongoose.models.StaffDocument || mongoose.model('StaffDocument', StaffDocumentSchema);
