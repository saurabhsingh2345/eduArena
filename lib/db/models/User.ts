import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'admin' | 'learner';
  avatar: string;
  xpTotal: number;
  level: number;
  coursesCompleted: mongoose.Types.ObjectId[];
  currentBatch?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['admin', 'learner'], default: 'learner' },
    avatar: { type: String, default: '' },
    xpTotal: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coursesCompleted: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    currentBatch: { type: Schema.Types.ObjectId, ref: 'Batch' },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
