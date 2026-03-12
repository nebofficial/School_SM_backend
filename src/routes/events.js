import express from 'express';
import { Event } from '../models/Event.js';

export const eventsRouter = express.Router();

eventsRouter.get('/', async (_req, res) => {
  const items = await Event.find().sort({ fromDate: -1 }).limit(500).lean();
  res.json({ items: items.map((i) => ({ ...i, _id: String(i._id) })) });
});

eventsRouter.post('/', async (req, res) => {
  const b = req.body || {};
  const fromDate = b.fromDate ? new Date(b.fromDate) : new Date();
  const toDate = b.toDate ? new Date(b.toDate) : new Date();
  const doc = await Event.create({
    title: (b.title || '').toString().trim(),
    eventFor: (b.eventFor || '').toString().trim(),
    eventPlace: (b.eventPlace || '').toString().trim(),
    fromDate,
    toDate,
    image: (b.image || '').toString(),
    note: (b.note || '').toString().trim(),
    isViewOnWeb: Boolean(b.isViewOnWeb),
  });
  res.status(201).json({ ...doc.toObject(), _id: String(doc._id) });
});

eventsRouter.put('/:id', async (req, res) => {
  const doc = await Event.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const b = req.body || {};
  if (b.title != null) doc.title = (b.title || '').toString().trim();
  if (b.eventFor != null) doc.eventFor = (b.eventFor || '').toString().trim();
  if (b.eventPlace != null) doc.eventPlace = (b.eventPlace || '').toString().trim();
  if (b.fromDate != null) doc.fromDate = new Date(b.fromDate);
  if (b.toDate != null) doc.toDate = new Date(b.toDate);
  if (b.image != null) doc.image = (b.image || '').toString();
  if (b.note != null) doc.note = (b.note || '').toString().trim();
  if (b.isViewOnWeb != null) doc.isViewOnWeb = Boolean(b.isViewOnWeb);
  await doc.save();
  res.json({ ...doc.toObject(), _id: String(doc._id) });
});

eventsRouter.delete('/:id', async (req, res) => {
  const doc = await Event.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ deleted: true });
});
