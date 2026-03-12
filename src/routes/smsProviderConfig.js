import express from 'express';
import { SmsProviderConfig } from '../models/SmsProviderConfig.js';

const PROVIDERS = ['clicktell', 'twilio', 'bulk', 'msg91', 'plivo', 'textlocal'];

export const smsProviderConfigRouter = express.Router();

smsProviderConfigRouter.get('/', async (_req, res) => {
  const items = await SmsProviderConfig.find().lean();
  const map = {};
  items.forEach((i) => { map[i.provider] = { ...i.config, isActive: i.isActive, _id: String(i._id) }; });
  PROVIDERS.forEach((p) => { if (!map[p]) map[p] = { isActive: false }; });
  res.json({ items: map });
});

smsProviderConfigRouter.get('/:provider', async (req, res) => {
  if (!PROVIDERS.includes(req.params.provider)) return res.status(400).json({ message: 'Invalid provider' });
  let doc = await SmsProviderConfig.findOne({ provider: req.params.provider }).lean();
  if (!doc) return res.json({ provider: req.params.provider, isActive: false, config: {} });
  res.json({ ...doc.config, isActive: doc.isActive, provider: doc.provider, _id: String(doc._id) });
});

smsProviderConfigRouter.put('/:provider', async (req, res) => {
  if (!PROVIDERS.includes(req.params.provider)) return res.status(400).json({ message: 'Invalid provider' });
  const b = { ...(req.body || {}) };
  const isActive = Boolean(b.isActive);
  delete b.isActive;
  delete b.provider;
  delete b._id;
  let doc = await SmsProviderConfig.findOne({ provider: req.params.provider });
  if (!doc) doc = await SmsProviderConfig.create({ provider: req.params.provider, config: {} });
  doc.isActive = isActive;
  doc.config = { ...doc.config, ...b };
  await doc.save();
  res.json({ ...doc.config, isActive: doc.isActive, provider: doc.provider, _id: String(doc._id) });
});
