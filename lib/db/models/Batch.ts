import mongoose, { Schema, Document, Model } from 'mongoose';

interface BatchLearner {
  userId: mongoose.Types.ObjectId;
  joinedAt: Date;
  xpEarned: number;
  interactionsCompleted: number;
  rank: number;
}

interface LeaderboardEntry {
  userId: mongoose.Types.ObjectId;
  name: string;
  avatar: string;
  xp: number;
  rank: number;
}

export interface IBatch extends Document {
  courseId: mongoose.Types.ObjectId;
  batchNumber: number;
  startTime: Date;
  endTime?: Date;
  status: 'waiting' | 'active' | 'completed';
  learners: BatchLearner[];
  leaderboard: LeaderboardEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const BatchLearnerSchema = new Schema<BatchLearner>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  xpEarned: { type: Number, default: 0 },
  interactionsCompleted: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
}, { _id: false });

const LeaderboardEntrySchema = new Schema<LeaderboardEntry>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  xp: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
}, { _id: false });

const BatchSchema = new Schema<IBatch>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    batchNumber: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
    learners: [BatchLearnerSchema],
    leaderboard: [LeaderboardEntrySchema],
  },
  { timestamps: true }
);

BatchSchema.index({ courseId: 1, status: 1 });

const Batch: Model<IBatch> = mongoose.models.Batch || mongoose.model<IBatch>('Batch', BatchSchema);
export default Batch;
