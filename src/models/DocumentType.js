import mongoose from 'mongoose';

const DocumentTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, default: '' },
    required: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    category: { type: String, enum: ['student', 'staff'], default: 'student' },
  },
  { timestamps: true }
);

DocumentTypeSchema.index({ name: 1, category: 1 }, { unique: true });

export const DocumentType =
  mongoose.models.DocumentType || mongoose.model('DocumentType', DocumentTypeSchema);

let _documentTypeIndexesMigrated = false;

/** Drop legacy unique index on name only (replaced by compound name+category). Run once per process. */
export async function ensureDocumentTypeIndexes() {
  if (_documentTypeIndexesMigrated) return;
  _documentTypeIndexesMigrated = true;
  try {
    await DocumentType.collection.dropIndex('name_1');
  } catch (err) {
    if (err.code !== 27 && err.codeName !== 'IndexNotFound' && !/index.*not found/i.test(String(err.message))) {
      throw err;
    }
  }
}

const STUDENT_SYSTEM_TYPES = [
  { name: 'Birth Certificate', slug: 'birth_certificate', required: true, isSystem: true, sortOrder: 1, category: 'student' },
  { name: 'Aadhaar Card', slug: 'aadhaar', required: true, isSystem: true, sortOrder: 2, category: 'student' },
  { name: 'Transfer Certificate', slug: 'tc', required: true, isSystem: true, sortOrder: 3, category: 'student' },
  { name: 'Previous Marksheet', slug: 'previous_marksheet', required: true, isSystem: true, sortOrder: 4, category: 'student' },
  { name: 'Student Photo', slug: 'student_photo', required: true, isSystem: true, sortOrder: 5, category: 'student' },
  { name: 'Caste Certificate', slug: 'caste_certificate', required: false, isSystem: true, sortOrder: 6, category: 'student' },
  { name: 'Income Certificate', slug: 'income_certificate', required: false, isSystem: true, sortOrder: 7, category: 'student' },
  { name: 'Medical Certificate', slug: 'medical_certificate', required: false, isSystem: true, sortOrder: 8, category: 'student' },
  { name: 'Passport', slug: 'passport', required: false, isSystem: true, sortOrder: 9, category: 'student' },
  { name: 'Other', slug: 'other', required: false, isSystem: true, sortOrder: 10, category: 'student' },
];

const STAFF_SYSTEM_TYPES = [
  { name: 'Staff Photo', slug: 'staff_photo', required: true, isSystem: true, sortOrder: 1, category: 'staff' },
  { name: 'Aadhaar Card', slug: 'aadhaar', required: true, isSystem: true, sortOrder: 2, category: 'staff' },
  { name: 'Appointment Letter', slug: 'appointment_letter', required: true, isSystem: true, sortOrder: 3, category: 'staff' },
  { name: 'Experience Certificate', slug: 'experience_certificate', required: false, isSystem: true, sortOrder: 4, category: 'staff' },
  { name: 'Educational Qualification', slug: 'educational_qualification', required: true, isSystem: true, sortOrder: 5, category: 'staff' },
  { name: 'PAN Card', slug: 'pan_card', required: false, isSystem: true, sortOrder: 6, category: 'staff' },
  { name: 'Bank Details', slug: 'bank_details', required: false, isSystem: true, sortOrder: 7, category: 'staff' },
  { name: 'Resume', slug: 'resume', required: false, isSystem: true, sortOrder: 8, category: 'staff' },
  { name: 'Other', slug: 'other', required: false, isSystem: true, sortOrder: 9, category: 'staff' },
];

export async function ensureSystemDocumentTypes() {
  await ensureDocumentTypeIndexes();
  for (const t of STUDENT_SYSTEM_TYPES) {
    await DocumentType.findOneAndUpdate(
      { name: t.name, category: 'student' },
      { $setOnInsert: t },
      { upsert: true }
    );
  }
}

export async function ensureStaffSystemDocumentTypes() {
  await ensureDocumentTypeIndexes();
  for (const t of STAFF_SYSTEM_TYPES) {
    await DocumentType.findOneAndUpdate(
      { name: t.name, category: 'staff' },
      { $setOnInsert: t },
      { upsert: true }
    );
  }
}
