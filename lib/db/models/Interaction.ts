import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInteraction extends Document {
  batchId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  interactionId: string;
  type: string;
  answeredAt: Date;
  timeTaken: number;
  isCorrect: boolean;
  xpAwarded: number;
  answer: unknown;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    interactionId: { type: String, required: true },
    type: { type: String, required: true },
    answeredAt: { type: Date, default: Date.now },
    timeTaken: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: false },
    xpAwarded: { type: Number, default: 0 },
    answer: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

InteractionSchema.index({ batchId: 1, userId: 1 });

const Interaction: Model<IInteraction> =
  mongoose.models.Interaction || mongoose.model<IInteraction>('Interaction', InteractionSchema);
export default Interaction;
