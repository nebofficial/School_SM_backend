import express from 'express';
import { Room } from '../models/Room.js';

export const roomsRouter = express.Router();

roomsRouter.get('/', async (_req, res) => {
  const items = await Room.find()
    .sort({ name: 1 })
    .lean();
  const enriched = items.map((r) => ({
    ...r,
    displayName: [r.name ? `Room ${r.name}` : '', r.block ? `Block ${r.block}` : '', r.floor ? `Floor ${r.floor}` : ''].filter(Boolean).join(' ') || r.name,
  }));
  res.json({ items: enriched });
});

roomsRouter.get('/:id', async (req, res) => {
  const doc = await Room.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const displayName = [doc.name ? `Room ${doc.name}` : '', doc.block ? `Block ${doc.block}` : '', doc.floor ? `Floor ${doc.floor}` : ''].filter(Boolean).join(' ') || doc.name;
  res.json({ ...doc, displayName });
});

roomsRouter.post('/', async (req, res) => {
  const { name, code, block, floor } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name is required' });
  const doc = await Room.create({
    name: String(name).trim(),
    code: String(code || '').trim(),
    block: String(block || '').trim(),
    floor: String(floor || '').trim(),
  });
  res.status(201).json(doc.toObject());
});

roomsRouter.put('/:id', async (req, res) => {
  const { name, code, block, floor } = req.body || {};
  const update = {};
  if (name != null) update.name = String(name).trim();
  if (code != null) update.code = String(code || '').trim();
  if (block != null) update.block = String(block || '').trim();
  if (floor != null) update.floor = String(floor || '').trim();
  const doc = await Room.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

roomsRouter.delete('/:id', async (req, res) => {
  const doc = await Room.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});
