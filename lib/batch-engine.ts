import { connectDB } from './db/mongoose';
import Batch from './db/models/Batch';

const BATCH_INTERVAL_MS = 1 * 60 * 1000; // 1 minute

export async function startBatchEngine(io: import('socket.io').Server) {
  console.log('[batch-engine] started — activating waiting batches every 1 minute');

  const run = async () => {
    try {
      await connectDB();

      // Find all waiting batches that have at least one learner
      const waitingBatches = await Batch.find({
        status: 'waiting',
        'learners.0': { $exists: true },
      }).lean();

      for (const batch of waitingBatches) {
        const courseId = batch.courseId.toString();
        const batchId = batch._id.toString();

        // Promote to active
        await Batch.findByIdAndUpdate(batch._id, {
          status: 'active',
          startTime: new Date(),
        });

        // Notify all learners waiting on this course
        io.to(`course:${courseId}`).emit('batch:started', {
          batchId,
          batchNumber: batch.batchNumber,
          learnerCount: batch.learners.length,
        });

        console.log(`[batch-engine] batch #${batch.batchNumber} activated for course ${courseId} — ${batch.learners.length} learner(s)`);
      }

      // Clean up empty waiting batches older than 10 minutes
      await Batch.deleteMany({
        status: 'waiting',
        'learners.0': { $exists: false },
        startTime: { $lte: new Date(Date.now() - 10 * 60 * 1000) },
      });
    } catch (err) {
      console.error('[batch-engine] error:', err);
    }
  };

  // Run once on start, then every minute
  await run();
  setInterval(run, BATCH_INTERVAL_MS);

  // Countdown broadcast every second
  setInterval(() => {
    const now = Date.now();
    const nextBatch = Math.ceil(now / BATCH_INTERVAL_MS) * BATCH_INTERVAL_MS;
    const secondsUntilNext = Math.round((nextBatch - now) / 1000);
    io.emit('batch:countdown', { secondsUntilNext });
  }, 1000);
}
