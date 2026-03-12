import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { Staff } from '../models/Staff.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { DocumentType } from '../models/DocumentType.js';
import { StaffDocument } from '../models/StaffDocument.js';
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

function mimeFromFileName(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return '';
}

export const staffDocumentsRouter = express.Router();

// GET /api/staff-documents?academicYearId=&staffId=
staffDocumentsRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const staffId = (req.query.staffId || '').toString();
  if (!staffId) {
    return res.status(400).json({ message: 'staffId is required' });
  }

  const items = await StaffDocument.find({ staffId, academicYearId })
    .populate('documentTypeId', 'name slug required isSystem')
    .sort({ uploadedAt: -1 })
    .lean();

  res.json({
    items: items.map((i) => ({
      _id: String(i._id),
      staffId: String(i.staffId),
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

// POST /api/staff-documents (upload)
staffDocumentsRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const b = req.body || {};
  const staffId = (b.staffId || '').toString();
  const documentTypeId = (b.documentTypeId || '').toString();
  const customTypeName = (b.customTypeName || '').toString().trim();
  const contentBase64 = b.content;
  const fileName = (b.fileName || '').toString().trim();
  const mimeType = (b.mimeType || '').toString().trim().toLowerCase();

  if (!staffId || !documentTypeId) {
    return res.status(400).json({ message: 'staffId and documentTypeId are required' });
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

  const staff = await Staff.findById(staffId).lean();
  if (!staff) return res.status(404).json({ message: 'Staff not found' });

  const docType = await DocumentType.findById(documentTypeId).lean();
  if (!docType) return res.status(404).json({ message: 'Document type not found' });
  if (docType.category !== 'staff') {
    return res.status(400).json({ message: 'Document type must be a staff document type' });
  }

  const year = await AcademicYear.findById(academicYearId).lean();
  if (!year) return res.status(400).json({ message: 'Academic year not found' });

  const staffCode = staff.code?.trim() || staff._id.toString();
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

  const relativePath = path.join('staff', yearDirName, sanitizeDirName(staffCode), saveFileName);
  const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
  const absolutePath = path.join(uploadsRoot, relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buf);

  await StaffDocument.deleteMany({
    staffId,
    documentTypeId,
    academicYearId,
    ...(docType.slug === 'other' ? { customTypeName } : {}),
  });

  const created = await StaffDocument.create({
    staffId,
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
    _id: String(created._id),
    staffId: String(created.staffId),
    documentTypeId: String(created.documentTypeId),
    fileName: created.fileName,
    originalFileName: created.originalFileName,
    fileSize: created.fileSize,
    mimeType: created.mimeType,
    customTypeName: created.customTypeName,
    uploadedAt: created.uploadedAt,
    filePath: created.filePath,
  });
});

// GET /api/staff-documents/:id/file (view/download)
staffDocumentsRouter.get('/:id/file', async (req, res) => {
  const academicYearId = (req.query.academicYearId || '').toString();
  if (!academicYearId) {
    return res.status(400).json({ message: 'academicYearId is required' });
  }
  const doc = await StaffDocument.findOne({ _id: req.params.id, academicYearId }).lean();
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

// DELETE /api/staff-documents/:id
staffDocumentsRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const doc = await StaffDocument.findOne({ _id: req.params.id, academicYearId }).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
  const absolutePath = path.join(uploadsRoot, doc.filePath.replace(/\//g, path.sep));
  try {
    await fs.unlink(absolutePath);
  } catch (_) {}

  await StaffDocument.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
