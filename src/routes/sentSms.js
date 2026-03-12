import express from 'express';
import { SentSms } from '../models/SentSms.js';

export const sentSmsRouter = express.Router();

sentSmsRouter.get('/', async (_req, res) => {
  const items = await SentSms.find().sort({ sentAt: -1 }).limit(500).lean();
  res.json({ items: items.map((i) => ({ ...i, _id: String(i._id) })) });
});

sentSmsRouter.post('/', async (req, res) => {
  const b = req.body || {};
  const doc = await SentSms.create({
    receiverType: (b.receiverType || '').toString().trim(),
    receiver: (b.receiver || '').toString().trim(),
    message: (b.message || '').toString().trim(),
    gateway: (b.gateway || '').toString().trim(),
  });
  res.status(201).json({ ...doc.toObject(), _id: String(doc._id) });
});
