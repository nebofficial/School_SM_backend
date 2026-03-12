import express from 'express';
import { SentEmail } from '../models/SentEmail.js';

export const sentEmailsRouter = express.Router();

sentEmailsRouter.get('/', async (_req, res) => {
  const items = await SentEmail.find().sort({ sentAt: -1 }).limit(500).lean();
  res.json({ items: items.map((i) => ({ ...i, _id: String(i._id) })) });
});

sentEmailsRouter.post('/', async (req, res) => {
  const b = req.body || {};
  const doc = await SentEmail.create({
    receiverType: (b.receiverType || '').toString().trim(),
    receiver: (b.receiver || '').toString().trim(),
    subject: (b.subject || '').toString().trim(),
    body: (b.body || '').toString().trim(),
  });
  res.status(201).json({ ...doc.toObject(), _id: String(doc._id) });
});
