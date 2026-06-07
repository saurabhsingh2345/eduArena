import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IXPEvent extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  batchId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const XPEventSchema = new Schema<IXPEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  },
  { timestamps: true }
);

XPEventSchema.index({ userId: 1, createdAt: -1 });

const XPEvent: Model<IXPEvent> =
  mongoose.models.XPEvent || mongoose.model<IXPEvent>('XPEvent', XPEventSchema);
export default XPEvent;
