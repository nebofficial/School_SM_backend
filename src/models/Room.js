import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    code: { type: String, trim: true, default: '' },
    block: { type: String, trim: true, default: '' },
    floor: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

RoomSchema.index({ name: 1 });

RoomSchema.virtual('displayName').get(function () {
  const parts = [];
  if (this.name) parts.push(`Room ${this.name}`);
  if (this.block) parts.push(`Block ${this.block}`);
  if (this.floor) parts.push(`Floor ${this.floor}`);
  return parts.join(' ');
});

export const Room =
  mongoose.models.Room || mongoose.model('Room', RoomSchema);
