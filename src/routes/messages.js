import express from 'express';
import { Message } from '../models/Message.js';
import { MessageTrash } from '../models/MessageTrash.js';

export const messagesRouter = express.Router();

// GET /api/messages?userId=&folder=inbox|sent|draft|trash&limit=15&offset=0&search=
messagesRouter.get('/', async (req, res) => {
  const userId = (req.query.userId || '').toString();
  const folder = (req.query.folder || 'inbox').toString();
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const search = (req.query.search || '').toString().trim();

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  let query = {};
  let trashIds = [];

  if (folder === 'inbox') {
    const trashed = await MessageTrash.find({ userId }).distinct('messageId');
    trashIds = trashed;
    query = { recipientId: userId, _id: { $nin: trashIds }, isDraft: false };
  } else if (folder === 'sent') {
    query = { senderId: userId, isDraft: false };
  } else if (folder === 'draft') {
    query = { senderId: userId, isDraft: true };
  } else if (folder === 'trash') {
    const trashed = await MessageTrash.find({ userId }).distinct('messageId');
    if (trashed.length === 0) {
      const items = [];
      const total = 0;
      return res.json({ items, total, counts: await getCounts(userId) });
    }
    query = { _id: { $in: trashed } };
  } else {
    return res.status(400).json({ message: 'folder must be inbox, sent, draft, or trash' });
  }

  if (search) {
    query.$or = [
      { subject: new RegExp(search, 'i') },
      { body: new RegExp(search, 'i') },
      { senderName: new RegExp(search, 'i') },
      { recipientName: new RegExp(search, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Message.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    Message.countDocuments(query),
  ]);

  const counts = await getCounts(userId);
  res.json({
    items: items.map((i) => ({
      ...i,
      _id: String(i._id),
      createdAt: i.createdAt,
    })),
    total,
    counts,
  });
});

async function getCounts(userId) {
  const [inboxTotal, inboxTrash, sent, draft, trash] = await Promise.all([
    Message.countDocuments({ recipientId: userId, isDraft: false }),
    MessageTrash.find({ userId }).distinct('messageId'),
    Message.countDocuments({ senderId: userId, isDraft: false }),
    Message.countDocuments({ senderId: userId, isDraft: true }),
    MessageTrash.countDocuments({ userId }),
  ]);
  const trashIds = inboxTrash;
  const inbox = await Message.countDocuments({
    recipientId: userId,
    _id: { $nin: trashIds },
    isDraft: false,
  });
  return { inbox, sent, draft, trash };
}

// GET /api/messages/counts?userId=
messagesRouter.get('/counts', async (req, res) => {
  const userId = (req.query.userId || '').toString();
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  const counts = await getCounts(userId);
  res.json(counts);
});

// POST /api/messages (compose)
messagesRouter.post('/', async (req, res) => {
  const b = req.body || {};
  const senderId = (b.senderId || '').toString().trim();
  const senderName = (b.senderName || '').toString().trim();
  const recipientId = (b.recipientId || '').toString().trim();
  const recipientName = (b.recipientName || '').toString().trim();
  const subject = (b.subject || '').toString().trim();
  const body = (b.body || '').toString().trim();
  const isDraft = Boolean(b.isDraft);

  if (!senderId || !senderName) return res.status(400).json({ message: 'senderId and senderName are required' });
  if (!isDraft && (!recipientId || !recipientName)) return res.status(400).json({ message: 'recipientId and recipientName are required for sent messages' });
  if (!subject) return res.status(400).json({ message: 'subject is required' });

  const doc = await Message.create({
    senderId,
    senderName,
    recipientId: recipientId || senderId,
    recipientName: recipientName || senderName,
    subject,
    body,
    isDraft,
  });
  res.status(201).json({
    ...doc.toObject(),
    _id: String(doc._id),
    createdAt: doc.createdAt,
  });
});

// POST /api/messages/:id/trash (move to trash for a user)
messagesRouter.post('/:id/trash', async (req, res) => {
  const userId = (req.body?.userId || req.query.userId || '').toString();
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ message: 'Not found' });
  await MessageTrash.findOneAndUpdate(
    { userId, messageId: message._id },
    { $set: { userId, messageId: message._id } },
    { upsert: true }
  );
  res.json({ ok: true });
});

// DELETE /api/messages/:id (permanent delete; or remove from trash for user)
messagesRouter.delete('/:id', async (req, res) => {
  const userId = (req.query.userId || '').toString();
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ message: 'Not found' });
  if (userId) {
    await MessageTrash.findOneAndDelete({ userId, messageId: message._id });
    return res.json({ ok: true });
  }
  await MessageTrash.deleteMany({ messageId: message._id });
  await Message.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});
