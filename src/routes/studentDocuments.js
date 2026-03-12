import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { Registration } from '../models/Registration.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { DocumentType } from '../models/DocumentType.js';
import { StudentDocument } from '../models/StudentDocument.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];

function sanitizeDirName(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, '_').trim() || 'unknown';
}

function getExtFromMime(mime) {
  if (mime === 'application/pdf') return '.pdf';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
  if (mime === 'image/png') return '.png';
  return '.bin';
}

function getExtFromFileName(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ALLOWED_EXT.includes(ext)) return ext;
  return '.pdf';
}

export const studentDocumentsRouter = express.Router();

// GET /api/student-documents?academicYearId=&registrationId=
studentDocumentsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const registrationId = (req.query.registrationId || '').toString();
  if (!registrationId) {
    return res.status(400).json({ message: 'registrationId is required' });
  }

  const items = await StudentDocument.find({ registrationId, academicYearId })
    .populate('documentTypeId', 'name slug required isSystem')
    .sort({ uploadedAt: -1 })
    .lean();

  res.json({
    items: items.map((i) => ({
      _id: String(i._id),
      registrationId: String(i.registrationId),
      documentTypeId: i.documentTypeId?._id ? String(i.documentTypeId._id) : String(i.documentTypeId || ''),
      documentTypeName: i.documentTypeId?.name,
      documentTypeSlug: i.documentTypeId?.slug,
      required: i.documentTypeId?.required,
      fileName: i.fileName,
      originalFileName: i.originalFileName,
      fileSize: i.fileSize,
      mimeType: i.mimeType,
      customTypeName: i.customTypeName,
      uploadedAt: i.uploadedAt,
      filePath: i.filePath,
    })),
  });
});

// POST /api/student-documents (upload)
studentDocumentsRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const registrationId = (b.registrationId || '').toString();
  const documentTypeId = (b.documentTypeId || '').toString();
  const customTypeName = (b.customTypeName || '').toString().trim();
  const contentBase64 = b.content;
  const fileName = (b.fileName || '').toString().trim();
  const mimeType = (b.mimeType || '').toString().trim().toLowerCase();

  if (!registrationId || !documentTypeId) {
    return res.status(400).json({ message: 'registrationId and documentTypeId are required' });
  }
  if (!contentBase64 || typeof contentBase64 !== 'string') {
    return res.status(400).json({ message: 'content (base64) is required' });
  }

  let buf;
  try {
    buf = Buffer.from(contentBase64, 'base64');
  } catch {
    return res.status(400).json({ message: 'Invalid base64 content' });
  }
  if (buf.length > MAX_FILE_SIZE) {
    return res.status(400).json({ message: 'File size must not exceed 5MB' });
  }
  if (buf.length === 0) {
    return res.status(400).json({ message: 'File content is empty' });
  }

  const registration = await Registration.findById(registrationId).lean();
  if (!registration) return res.status(404).json({ message: 'Registration not found' });

  const docType = await DocumentType.findById(documentTypeId).lean();
  if (!docType) return res.status(404).json({ message: 'Document type not found' });
  if (docType.category !== 'student') {
    return res.status(400).json({ message: 'Document type must be a student document type' });
  }

  const year = await AcademicYear.findById(academicYearId).lean();
  if (!year) return res.status(400).json({ message: 'Academic year not found' });

  const admissionNumber = registration.admissionNumber?.trim() || registration._id.toString();
  const yearDirName = sanitizeDirName(year.name);

  function slugify(s) {
    return String(s).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'other';
  }
  let fileSlug = docType.slug || 'document';
  if (docType.slug === 'other' && customTypeName) {
    fileSlug = slugify(customTypeName);
  }

  const resolvedMime = mimeType || (fileName ? mimeFromFileName(fileName) : 'application/pdf');
  if (!ALLOWED_MIMES.includes(resolvedMime)) {
    return res.status(400).json({ message: 'Allowed types: pdf, jpg, jpeg, png' });
  }
  const ext = getExtFromMime(resolvedMime) || getExtFromFileName(fileName);
  const saveFileName = `${fileSlug}${ext}`;

  const relativePath = path.join('students', yearDirName, sanitizeDirName(admissionNumber), saveFileName);
  const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
  const absolutePath = path.join(uploadsRoot, relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buf);

  // Replace existing document for same registration + type + year (and customTypeName for Other)
  await StudentDocument.deleteMany({
    registrationId,
    documentTypeId,
    academicYearId,
    ...(docType.slug === 'other' ? { customTypeName } : {}),
  });

  const doc = await StudentDocument.create({
    registrationId,
    documentTypeId,
    academicYearId,
    filePath: relativePath.replace(/\\/g, '/'),
    fileName: saveFileName,
    originalFileName: fileName || saveFileName,
    fileSize: buf.length,
    mimeType: resolvedMime,
    customTypeName: docType.slug === 'other' ? customTypeName : '',
  });

  res.status(201).json({
    _id: String(doc._id),
    registrationId: String(doc.registrationId),
    documentTypeId: String(doc.documentTypeId),
    fileName: doc.fileName,
    originalFileName: doc.originalFileName,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    customTypeName: doc.customTypeName,
    uploadedAt: doc.uploadedAt,
    filePath: doc.filePath,
  });
});

function mimeFromFileName(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return '';
}

// GET /api/student-documents/:id/file (view/download)
studentDocumentsRouter.get('/:id/file', async (req, res) => {
  const academicYearId = (req.query.academicYearId || '').toString();
  if (!academicYearId) {
    return res.status(400).json({ message: 'academicYearId is required' });
  }
  const doc = await StudentDocument.findOne({ _id: req.params.id, academicYearId }).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
  const absolutePath = path.join(uploadsRoot, doc.filePath.replace(/\//g, path.sep));
  try {
    await fs.access(absolutePath);
  } catch {
    return res.status(404).json({ message: 'File not found' });
  }
  res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${encodeURIComponent(doc.originalFileName || doc.fileName)}"`,
  );
  res.sendFile(absolutePath);
});

// DELETE /api/student-documents/:id
studentDocumentsRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await StudentDocument.findOne({ _id: req.params.id, academicYearId }).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
  const absolutePath = path.join(uploadsRoot, doc.filePath.replace(/\//g, path.sep));
  try {
    await fs.unlink(absolutePath);
  } catch (_) {}

  await StudentDocument.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
