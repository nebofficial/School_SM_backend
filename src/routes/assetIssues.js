import express from 'express';
import { AssetIssue } from '../models/AssetIssue.js';
import { Asset } from '../models/Asset.js';
import { ensureCurrentAcademicYear } from '../utils/academicYear.js';

export const assetIssuesRouter = express.Router();

assetIssuesRouter.get('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const status = req.query.status; // optional: issued | returned
  const filter = { academicYearId };
  if (status === 'issued' || status === 'returned') filter.status = status;
  const items = await AssetIssue.find(filter)
    .populate('assetId', 'name productCode storeId')
    .sort({ issueDate: -1 })
    .lean();
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      academicYearId: String(i.academicYearId),
      assetId: i.assetId ? String(i.assetId._id) : null,
      assetName: i.assetId?.name,
      assetCode: i.assetId?.productCode,
    })),
  });
});

assetIssuesRouter.post('/', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const b = req.body || {};
  const assetId = b.assetId || null;
  const issuedTo = (b.issuedTo || '').toString().trim();
  const issueDate = b.issueDate ? new Date(b.issueDate) : new Date();
  if (!assetId || !issuedTo) return res.status(400).json({ message: 'assetId and issuedTo are required' });
  const asset = await Asset.findOne({ _id: assetId, academicYearId });
  if (!asset) return res.status(400).json({ message: 'Asset not found' });
  if (asset.quantity < 1) return res.status(400).json({ message: 'No asset quantity to issue' });
  const doc = await AssetIssue.create({
    academicYearId,
    assetId,
    issuedTo,
    issueDate,
    status: 'issued',
    note: (b.note || '').toString().trim(),
  });
  await Asset.updateOne({ _id: assetId }, { $inc: { quantity: -1 } });
  const populated = await AssetIssue.findById(doc._id).populate('assetId', 'name productCode').lean();
  res.status(201).json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    assetId: String(populated.assetId._id),
    assetName: populated.assetId?.name,
    assetCode: populated.assetId?.productCode,
  });
});

assetIssuesRouter.put('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await AssetIssue.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const b = req.body || {};
  if (b.returnDate != null) doc.returnDate = b.returnDate ? new Date(b.returnDate) : null;
  if (b.status === 'returned') {
    if (doc.status !== 'returned') {
      doc.status = 'returned';
      doc.returnDate = doc.returnDate || new Date();
      await Asset.updateOne({ _id: doc.assetId }, { $inc: { quantity: 1 } });
    }
  }
  if (b.issuedTo != null) doc.issuedTo = (b.issuedTo || '').toString().trim();
  if (b.note != null) doc.note = (b.note || '').toString().trim();
  await doc.save();
  const populated = await AssetIssue.findById(doc._id).populate('assetId', 'name productCode').lean();
  res.json({
    ...populated,
    _id: String(populated._id),
    academicYearId: String(populated.academicYearId),
    assetId: String(populated.assetId._id),
    assetName: populated.assetId?.name,
    assetCode: populated.assetId?.productCode,
  });
});

assetIssuesRouter.delete('/:id', async (req, res) => {
  const academicYearId = await ensureCurrentAcademicYear(req, res);
  if (!academicYearId) return;
  const doc = await AssetIssue.findOne({ _id: req.params.id, academicYearId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  if (doc.status === 'issued') await Asset.updateOne({ _id: doc.assetId }, { $inc: { quantity: 1 } });
  await AssetIssue.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
