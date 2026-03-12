import express from 'express';
import { DocumentType, ensureSystemDocumentTypes, ensureStaffSystemDocumentTypes } from '../models/DocumentType.js';

export const documentTypesRouter = express.Router();

const slugify = (name) =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

const VALID_CATEGORIES = ['student', 'staff'];

// GET /api/document-types?category=student|staff
documentTypesRouter.get('/', async (req, res) => {
  const category = (req.query.category || 'student').toString().toLowerCase();
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'category must be student or staff' });
  }
  if (category === 'student') {
    await ensureSystemDocumentTypes();
  } else {
    await ensureStaffSystemDocumentTypes();
  }
  const filter = category === 'student'
    ? { $or: [{ category: 'student' }, { category: { $exists: false } }] }
    : { category: 'staff' };
  const items = await DocumentType.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
    })),
  });
});

// POST /api/document-types (admin add new type). Body: name, required, category (student|staff)
documentTypesRouter.post('/', async (req, res) => {
  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  if (!name) return res.status(400).json({ message: 'name is required' });
  const category = (b.category || 'student').toString().toLowerCase();
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'category must be student or staff' });
  }
  const required = Boolean(b.required);
  const slug = (b.slug || slugify(name)).toString().trim() || slugify(name);
  const existing = await DocumentType.findOne({ name, category });
  if (existing) return res.status(400).json({ message: 'Document type name already exists for this category' });
  const doc = await DocumentType.create({
    name,
    slug,
    required,
    isSystem: false,
    sortOrder: 999,
    category,
  });
  res.status(201).json({ ...doc.toObject(), _id: String(doc._id) });
});

// PUT /api/document-types/:id (category cannot be changed)
documentTypesRouter.put('/:id', async (req, res) => {
  const doc = await DocumentType.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const b = req.body || {};
  if (b.name != null) doc.name = (b.name || '').toString().trim();
  if (b.required != null) doc.required = Boolean(b.required);
  if (b.slug != null) doc.slug = (b.slug || '').toString().trim();
  if (doc.isSystem) {
    doc.slug = doc.slug || slugify(doc.name);
  }
  await doc.save();
  res.json({ ...doc.toObject(), _id: String(doc._id) });
});

// DELETE /api/document-types/:id (only non-system)
documentTypesRouter.delete('/:id', async (req, res) => {
  const doc = await DocumentType.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  if (doc.isSystem) return res.status(400).json({ message: 'System document types cannot be deleted' });
  await DocumentType.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
