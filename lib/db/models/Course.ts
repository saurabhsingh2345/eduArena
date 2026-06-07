import mongoose, { Schema, Document, Model } from 'mongoose';

interface Segment {
  id: string;
  text: string;
  animationStyle: 'type' | 'zoom' | 'fade' | 'reveal';
  emphasis: string[];
  durationSeconds: number;
  startTime?: number;
  endTime?: number;
}

interface Interaction {
  id: string;
  afterSegmentId: string;
  triggerTime?: number;
  type: 'mcq' | 'code' | 'fill_blank' | 'concept_match';
  xpReward: number;
  timeLimit: number;
  data: Record<string, unknown>;
}

export interface ICourse extends Document {
  title: string;
  topic: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  thumbnail: string;
  status: 'generating' | 'ready' | 'published';
  script: { segments: Segment[] };
  interactions: Interaction[];
  videoUrl?: string;
  audioUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentSchema = new Schema<Segment>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  animationStyle: { type: String, enum: ['type', 'zoom', 'fade', 'reveal'], default: 'fade' },
  emphasis: [{ type: String }],
  durationSeconds: { type: Number, default: 15 },
  startTime: { type: Number },
  endTime: { type: Number },
}, { _id: false });

const InteractionSchema = new Schema<Interaction>({
  id: { type: String, required: true },
  afterSegmentId: { type: String, required: true },
  triggerTime: { type: Number },
  type: { type: String, enum: ['mcq', 'code', 'fill_blank', 'concept_match'], required: true },
  xpReward: { type: Number, default: 50 },
  timeLimit: { type: Number, default: 30 },
  data: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String, default: '' },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    estimatedMinutes: { type: Number, default: 15 },
    thumbnail: { type: String, default: '' },
    status: { type: String, enum: ['generating', 'ready', 'published'], default: 'generating' },
    script: {
      segments: [SegmentSchema],
    },
    interactions: [InteractionSchema],
    videoUrl: { type: String },
    audioUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
export default Course;
