import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Batch from '@/lib/db/models/Batch';
import { auth } from '@/lib/auth';
import { redis, REDIS_KEYS, REDIS_TTL } from '@/lib/redis';

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

  // Add user to Redis waiting queue
  const key = REDIS_KEYS.waitingQueue(courseId);
  await redis.lpush(key, JSON.stringify({ userId, name: userName, avatar: userAvatar ?? '' }));
  await redis.expire(key, REDIS_TTL.waitingQueue);

  // Check if active batch exists for this course
  const activeBatch = await Batch.findOne({ courseId, status: 'active' }).lean();
  if (activeBatch) {
    return Response.json({ queued: true, activeBatch });
  }

  const queueLength = await redis.llen(key);
  return Response.json({ queued: true, queueLength });
}
