'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { Users, Clock, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import type { Course, Batch } from '@/types';

interface Props {
  course: Course;
  activeBatch: Batch | null;
  userId: string;
  userName: string;
  userAvatar: string;
}

export default function CourseLobby({ course, activeBatch, userId, userName, userAvatar }: Props) {
  const [queued, setQueued] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [joinedBatch, setJoinedBatch] = useState<string | null>(activeBatch?._id ?? null);
  const [loading, setLoading] = useState(false);
  const [recentJoins, setRecentJoins] = useState<string[]>([]);
  const socket = useSocket();
  const router = useRouter();

  useEffect(() => {
    socket.emit('course:watch', { courseId: course._id, userId });

    socket.on('batch:countdown', ({ secondsUntilNext }: { secondsUntilNext: number }) => {
      setCountdown(secondsUntilNext);
    });

    socket.on('batch:started', ({ batchId }: { batchId: string }) => {
      setJoinedBatch(batchId);
      setTimeout(() => router.push(`/learn/${batchId}`), 1500);
    });

    socket.on('learner:joined', ({ name }: { name: string }) => {
      setRecentJoins((prev) => [name, ...prev].slice(0, 5));
      setQueueCount((c) => c + 1);
    });

    return () => {
      socket.off('batch:countdown');
      socket.off('batch:started');
      socket.off('learner:joined');
    };
  }, [course._id, socket, userId, router]);

  const joinQueue = async () => {
    setLoading(true);
    const res = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course._id, userId, userName, userAvatar }),
    });
    const data = await res.json();
    setQueued(true);
    setQueueCount(data.queueLength ?? 1);
    if (data.activeBatch) {
      setJoinedBatch(data.activeBatch._id);
      router.push(`/learn/${data.activeBatch._id}`);
    }
    setLoading(false);
  };

  if (joinedBatch && !activeBatch) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Batch Starting!</h3>
        <p className="text-slate-400">Launching your immersive learning session...</p>
        <div className="mt-4">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-400" />
        Join Learning Batch
      </h2>

      {activeBatch ? (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-emerald-400 font-semibold text-sm">Active Batch</div>
              <div className="text-white mt-0.5">Batch #{activeBatch.batchNumber} is live with {activeBatch.learners.length} learners</div>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={() => router.push(`/learn/${activeBatch._id}`)}
          >
            <ArrowRight className="w-4 h-4" />
            Join Current Batch
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Countdown */}
          <div className="bg-[#0F0F1A] rounded-xl p-4 flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-sm">Next batch starts in</span>
            </div>
            <span className="text-2xl font-bold text-indigo-400 font-mono">
              {countdown > 0 ? formatTime(countdown) : '--:--'}
            </span>
          </div>

          {/* Queue status */}
          {queued && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-indigo-300 font-medium text-sm">You&apos;re in the queue!</div>
                  <div className="text-slate-400 text-sm mt-0.5">{queueCount} learner{queueCount !== 1 ? 's' : ''} waiting</div>
                </div>
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>

              {/* Recent joins */}
              <AnimatePresence>
                {recentJoins.slice(0, 3).map((name, i) => (
                  <motion.div
                    key={`${name}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="text-xs text-slate-500 mt-1"
                  >
                    {name} joined
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!queued && (
            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={joinQueue}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Join Waiting List
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-slate-500 text-center">
            Batches form automatically every 1 minute. You&apos;ll compete with other learners in real time.
          </p>
        </div>
      )}
    </div>
  );
}
