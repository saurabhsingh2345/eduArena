import { connectDB } from './db/mongoose';
import Batch from './db/models/Batch';
import Course from './db/models/Course';
import { redis, REDIS_KEYS } from './redis';

const BATCH_INTERVAL_MS = 5 * 60 * 1000;

interface WaitingLearner {
  userId: string;
  name: string;
  avatar: string;
}

export async function startBatchEngine(io: import('socket.io').Server) {
  console.log('[batch-engine] started — creating batches every 5 minutes');

  const run = async () => {
    try {
      await connectDB();
      const courses = await Course.find({ status: 'published' }).lean();

      for (const course of courses) {
        const courseId = course._id.toString();
        const key = REDIS_KEYS.waitingQueue(courseId);
        const waitingRaw = await redis.lrange(key, 0, -1);
        if (waitingRaw.length === 0) continue;

        const waitingLearners: WaitingLearner[] = waitingRaw.map((r) => {
          try { return JSON.parse(r); } catch { return { userId: r, name: 'Learner', avatar: '' }; }
        });

        const batchNumber = (await Batch.countDocuments({ courseId: course._id })) + 1;
        const batch = await Batch.create({
          courseId: course._id,
          batchNumber,
          startTime: new Date(),
          status: 'active',
          learners: waitingLearners.map((l) => ({
            userId: l.userId,
            joinedAt: new Date(),
            xpEarned: 0,
            interactionsCompleted: 0,
            rank: 0,
          })),
          leaderboard: waitingLearners.map((l, i) => ({
            userId: l.userId,
            name: l.name,
            avatar: l.avatar,
            xp: 0,
            rank: i + 1,
          })),
        });

        await redis.del(key);

        io.to(`course:${courseId}`).emit('batch:started', {
          batchId: batch._id.toString(),
          batchNumber,
          learnerCount: waitingLearners.length,
        });

        console.log(`[batch-engine] created batch #${batchNumber} for course ${course.title} with ${waitingLearners.length} learners`);
      }
    } catch (err) {
      console.error('[batch-engine] error:', err);
    }
  };

  // Run immediately on start, then every 5 min
  await run();
  setInterval(run, BATCH_INTERVAL_MS);

  // Broadcast countdown every second
  setInterval(() => {
    // Calculate seconds until next batch tick
    const now = Date.now();
    const nextBatch = Math.ceil(now / BATCH_INTERVAL_MS) * BATCH_INTERVAL_MS;
    const secondsUntilNext = Math.round((nextBatch - now) / 1000);
    io.emit('batch:countdown', { secondsUntilNext });
  }, 1000);
}
