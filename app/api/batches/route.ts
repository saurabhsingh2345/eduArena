import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Batch from '@/lib/db/models/Batch';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const status = searchParams.get('status');
  const query: Record<string, unknown> = {};
  if (courseId) query.courseId = courseId;
  if (status) query.status = status;
  const batches = await Batch.find(query).sort({ createdAt: -1 }).lean();
  return Response.json(batches);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { courseId, userId, userName, userAvatar } = await req.json();
  if (!courseId || !userId) return Response.json({ error: 'Missing fields' }, { status: 400 });

  await connectDB();

  // If an active batch already exists, send them straight to it
  const activeBatch = await Batch.findOne({ courseId, status: 'active' }).lean();
  if (activeBatch) {
    return Response.json({ queued: true, activeBatch });
  }

  // Find or create a "waiting" batch for this course
  let waitingBatch = await Batch.findOne({ courseId, status: 'waiting' });

  if (!waitingBatch) {
    const batchNumber = (await Batch.countDocuments({ courseId })) + 1;
    waitingBatch = await Batch.create({
      courseId,
      batchNumber,
      startTime: new Date(),
      status: 'waiting',
      learners: [],
      leaderboard: [],
    });
  }

  // Avoid duplicate entries
  const alreadyIn = (waitingBatch.learners as { userId: { toString(): string } }[])
    .some((l) => l.userId.toString() === userId);

  if (!alreadyIn) {
    await Batch.findByIdAndUpdate(waitingBatch._id, {
      $push: {
        learners: { userId, joinedAt: new Date(), xpEarned: 0, interactionsCompleted: 0, rank: 0 },
        leaderboard: { userId, name: userName, avatar: userAvatar ?? '', xp: 0, rank: 0 },
      },
    });
  }

  const updated = await Batch.findById(waitingBatch._id).lean();
  return Response.json({ queued: true, queueLength: (updated?.learners?.length ?? 1) });
}
