import { Server as SocketServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { connectDB } from './db/mongoose';
import Batch from './db/models/Batch';
import User from './db/models/User';
import InteractionModel from './db/models/Interaction';
import XPEvent from './db/models/XPEvent';
import { redis, REDIS_KEYS, REDIS_TTL } from './redis';
import { calculateXP, getLevelFromXP } from './xp';

let io: SocketServer | null = null;

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function initSocket(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on('batch:join', async ({ batchId, userId }: { batchId: string; userId: string }) => {
      socket.join(`batch:${batchId}`);
      socket.data.batchId = batchId;
      socket.data.userId = userId;

      try {
        await connectDB();
        const user = await User.findById(userId).lean();
        if (user) {
          socket.to(`batch:${batchId}`).emit('learner:joined', {
            name: user.name,
            avatar: user.avatar,
          });
        }

        // Send current leaderboard from Redis or DB
        const cached = await redis.get(REDIS_KEYS.leaderboard(batchId));
        if (cached) {
          socket.emit('leaderboard:update', JSON.parse(cached));
        } else {
          const batch = await Batch.findById(batchId).lean();
          if (batch) {
            socket.emit('leaderboard:update', batch.leaderboard);
          }
        }
      } catch (err) {
        console.error('[socket] batch:join error', err);
      }
    });

    socket.on('player:ready', ({ batchId }: { batchId: string }) => {
      // Sync video timestamp to new learner
      const syncKey = `sync:${batchId}`;
      redis.get(syncKey).then((ts) => {
        if (ts) socket.emit('player:sync', { videoTimestamp: parseInt(ts) });
      });
    });

    socket.on('interaction:answer', async (payload: {
      interactionId: string;
      batchId: string;
      courseId: string;
      answer: unknown;
      timeTaken: number;
      interactionType: string;
      xpReward: number;
    }) => {
      const { interactionId, batchId, courseId, answer, timeTaken, interactionType, xpReward } = payload;
      const userId = socket.data.userId;
      if (!userId) return;

      try {
        await connectDB();

        // Check correctness based on type
        const batch = await Batch.findById(batchId).lean();
        const course = await (await import('./db/mongoose')).connectDB().then(() =>
          import('./db/models/Course').then(m => m.default.findById(courseId).lean())
        );

        let isCorrect = false;
        if (course) {
          const interactions = (course as { interactions?: Array<{ id: string; data: Record<string, unknown> }> }).interactions ?? [];
          const interactionDef = interactions.find((i) => i.id === interactionId);
          if (interactionDef) {
            isCorrect = checkAnswer(interactionType, interactionDef.data, answer);
          }
        }

        const xpAwarded = calculateXP(interactionType, timeTaken, isCorrect);

        // Save interaction record
        await InteractionModel.create({
          batchId, userId, courseId, interactionId,
          type: interactionType, timeTaken, isCorrect, xpAwarded,
          answer, answeredAt: new Date(),
        });

        if (isCorrect && xpAwarded > 0) {
          await XPEvent.create({ userId, amount: xpAwarded, reason: `${interactionType}_correct`, batchId, courseId });
          await User.findByIdAndUpdate(userId, { $inc: { xpTotal: xpAwarded } });

          // Update batch leaderboard
          if (batch) {
            const user = await User.findById(userId).lean();
            const lb = batch.leaderboard as Array<{ userId: { toString(): string }; xp: number; rank: number }>;
            const entryIdx = lb.findIndex((e) => e.userId.toString() === userId);
            if (entryIdx >= 0) {
              lb[entryIdx].xp += xpAwarded;
            } else if (user) {
              lb.push({ userId: user._id as { toString(): string }, xp: xpAwarded, rank: 0, ...{ name: user.name, avatar: user.avatar } });
            }
            // Re-rank
            lb.sort((a, b) => b.xp - a.xp).forEach((e, i) => { e.rank = i + 1; });

            await Batch.findByIdAndUpdate(batchId, { leaderboard: lb });
            const lbWithDelta = lb.map((e) => ({ ...e, userId: e.userId.toString() }));
            await redis.setex(REDIS_KEYS.leaderboard(batchId), REDIS_TTL.leaderboard, JSON.stringify(lbWithDelta));
            io!.to(`batch:${batchId}`).emit('leaderboard:update', lbWithDelta);
          }

          // Notify user of XP
          const updatedUser = await User.findById(userId).lean();
          const newLevel = updatedUser ? getLevelFromXP(updatedUser.xpTotal) : null;
          socket.emit('xp:awarded', { userId, amount: xpAwarded, total: updatedUser?.xpTotal ?? 0, newLevel });
        }

        // Confirm result to the answering user
        socket.emit('interaction:result', { interactionId, isCorrect, xpAwarded });

        // Broadcast how many got it right
        const correctCount = await InteractionModel.countDocuments({ batchId, interactionId, isCorrect: true });
        const totalCount = await InteractionModel.countDocuments({ batchId, interactionId });
        io!.to(`batch:${batchId}`).emit('interaction:stats', { interactionId, correctCount, totalCount });
      } catch (err) {
        console.error('[socket] interaction:answer error', err);
      }
    });

    socket.on('reaction:send', ({ emoji }: { emoji: string }) => {
      const batchId = socket.data.batchId;
      if (batchId) {
        socket.to(`batch:${batchId}`).emit('reaction:received', { emoji, userId: socket.data.userId });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });

  return io;
}

function checkAnswer(type: string, data: Record<string, unknown>, answer: unknown): boolean {
  switch (type) {
    case 'mcq': {
      const correctIndex = data.correctIndex as number;
      return answer === correctIndex;
    }
    case 'fill_blank': {
      const blanks = (data.blanks as string[]).map((b) => b.toLowerCase().trim());
      if (Array.isArray(answer)) {
        return (answer as string[]).every((a, i) => blanks[i] === a.toLowerCase().trim());
      }
      return blanks[0] === String(answer).toLowerCase().trim();
    }
    case 'concept_match': {
      const pairs = data.pairs as Array<{ term: string; definition: string }>;
      if (!Array.isArray(answer)) return false;
      const ans = answer as Array<{ term: string; definition: string }>;
      return pairs.every((p) => ans.some((a) => a.term === p.term && a.definition === p.definition));
    }
    case 'code': {
      // Code correctness checked client-side (test cases run in browser sandbox)
      // Server trusts the result flag passed by client
      return answer === true;
    }
    default:
      return false;
  }
}
