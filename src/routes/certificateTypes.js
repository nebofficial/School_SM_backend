import express from 'express';
import { CertificateType } from '../models/CertificateType.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const certificateTypesRouter = express.Router();

function toPlain(item) {
  if (!item) return null;
  const o = typeof item.toObject === 'function' ? item.toObject() : item;
  return {
    _id: String(o._id),
    academicYearId: o.academicYearId ? String(o.academicYearId) : null,
    name: o.name,
    schoolName: o.schoolName || '',
    certificateText: o.certificateText || '',
    background: o.background || '',
    createdAt: o.createdAt ? o.createdAt.toISOString() : null,
    updatedAt: o.updatedAt ? o.updatedAt.toISOString() : null
  };
}

// GET /api/certificate-types?academicYearId=...
certificateTypesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const q = (req.query.q || '').toString().trim();
  const query = { academicYearId };
  if (q) {
    query.$or = [
      { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { schoolName: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
    ];
  }

  const items = await CertificateType.find(query).sort({ name: 1 }).lean();
  res.json({
    items: items.map((i) => ({
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      name: i.name,
      schoolName: i.schoolName || '',
      certificateText: i.certificateText || '',
      background: i.background || '',
      createdAt: i.createdAt ? i.createdAt.toISOString() : null,
      updatedAt: i.updatedAt ? i.updatedAt.toISOString() : null
    }))
  });
});

// POST /api/certificate-types
certificateTypesRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const { name, schoolName, certificateText, background } = req.body || {};
  const trimmedName = (name ?? '').toString().trim();
  if (!trimmedName) {
    return res.status(400).json({ message: 'name is required' });
  }

  const doc = await CertificateType.create({
    academicYearId,
    name: trimmedName,
    schoolName: (schoolName ?? '').toString().trim(),
    certificateText: (certificateText ?? '').toString().trim(),
    background: (background ?? '').toString().trim()
  });
  res.status(201).json(toPlain(doc));
});

// PUT /api/certificate-types/:id
certificateTypesRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const { id } = req.params;
  const { name, schoolName, certificateText, background } = req.body || {};
  const doc = await CertificateType.findOne({ _id: id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const trimmedName = (name ?? '').toString().trim();
  if (trimmedName) doc.name = trimmedName;
  if (schoolName !== undefined) doc.schoolName = (schoolName ?? '').toString().trim();
  if (certificateText !== undefined) doc.certificateText = (certificateText ?? '').toString().trim();
  if (background !== undefined) doc.background = (background ?? '').toString().trim();

  await doc.save();
  res.json(toPlain(doc));
});

// DELETE /api/certificate-types/:id
certificateTypesRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;

  const { id } = req.params;
  const doc = await CertificateType.findOne({ _id: id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  await CertificateType.findByIdAndDelete(id);
  res.status(204).send();
});
