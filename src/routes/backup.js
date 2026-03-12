import express from 'express';
import mongoose from 'mongoose';
import { EJSON } from 'bson';

export const backupRouter = express.Router();

function requireBackupToken(req, res) {
  const token = process.env.BACKUP_TOKEN;
  if (!token) {
    return res.status(500).json({
      message:
        'BACKUP_TOKEN is not configured on the server. Set BACKUP_TOKEN in backend/.env to enable backup/restore.',
    });
  }
  const provided =
    (req.header('x-backup-token') || req.header('X-Backup-Token') || '').toString();
  if (!provided || provided !== token) {
    return res.status(401).json({ message: 'Invalid backup token' });
  }
  return null;
}

async function listCollections() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  const cols = await db.listCollections().toArray();
  return cols.map((c) => c.name).filter(Boolean).sort();
}

backupRouter.get('/export', async (req, res) => {
  const err = requireBackupToken(req, res);
  if (err) return;

  try {
    const db = mongoose.connection.db;
    const names = await listCollections();
    const collections = {};

    for (const name of names) {
      const col = db.collection(name);
      const docs = await col.find({}).toArray();
      collections[name] = docs;
    }

    const payload = {
      schema: 1,
      createdAt: new Date(),
      collections,
    };

    // Extended JSON preserves ObjectId, Date, etc.
    const json = EJSON.stringify(payload, { relaxed: false });
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(json);
  } catch (e) {
    res.status(500).json({ message: `Backup export failed: ${e.message || e}` });
  }
});

// Restore from JSON backup.
// Note: app-level express.json already parsed application/json bodies.
backupRouter.post('/restore', async (req, res) => {
    const err = requireBackupToken(req, res);
    if (err) return;

    const mode = (req.query.mode || 'upsert').toString(); // upsert | replace
    if (!['upsert', 'replace'].includes(mode)) {
      return res.status(400).json({ message: 'mode must be upsert or replace' });
    }

    try {
      const db = mongoose.connection.db;

      const raw =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      const parsed = EJSON.parse(raw || '{}');
      if (!parsed || typeof parsed !== 'object') {
        return res.status(400).json({ message: 'Invalid backup payload' });
      }
      if (parsed.schema !== 1) {
        return res.status(400).json({ message: 'Unsupported backup schema' });
      }
      const collections = parsed.collections;
      if (!collections || typeof collections !== 'object') {
        return res.status(400).json({ message: 'Missing collections' });
      }

      const results = {};
      for (const [name, docs] of Object.entries(collections)) {
        if (!Array.isArray(docs)) continue;

        const col = db.collection(name);

        if (mode === 'replace') {
          await col.deleteMany({});
          if (docs.length) {
            await col.insertMany(docs, { ordered: false });
          }
          results[name] = { replaced: docs.length };
          continue;
        }

        // upsert
        const ops = [];
        for (const doc of docs) {
          if (doc && typeof doc === 'object' && doc._id != null) {
            ops.push({
              replaceOne: {
                filter: { _id: doc._id },
                replacement: doc,
                upsert: true,
              },
            });
          } else if (doc && typeof doc === 'object') {
            ops.push({ insertOne: { document: doc } });
          }
        }
        if (ops.length) {
          const r = await col.bulkWrite(ops, { ordered: false });
          results[name] = {
            matched: r.matchedCount,
            modified: r.modifiedCount,
            upserted: r.upsertedCount,
            inserted: r.insertedCount,
          };
        } else {
          results[name] = { matched: 0, modified: 0, upserted: 0, inserted: 0 };
        }
      }

      res.json({ ok: true, mode, results });
    } catch (e) {
      res.status(500).json({ message: `Backup restore failed: ${e.message || e}` });
    }
  });

