'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import KineticCanvas from './KineticCanvas';
import InteractionOverlay from './InteractionOverlay';
import LiveLeaderboard from '../multiplayer/LiveLeaderboard';
import BatchPresence from '../multiplayer/BatchPresence';
import ReactionBar from '../multiplayer/ReactionBar';
import XPFloater from '../shared/XPFloater';
import { Play, Pause, X, Volume2, VolumeX } from 'lucide-react';
import type { Course, Batch, LeaderboardEntry, Interaction } from '@/types';

interface XPEvent { id: number; amount: number; }
interface Props { course: Course; batch: Batch; userId: string; }

export default function ImmersivePlayer({ course, batch, userId }: Props) {
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeInteraction, setActiveInteraction] = useState<Interaction | null>(null);
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(batch.leaderboard);
  const [recentJoins, setRecentJoins] = useState<string[]>([]);
  const [batchStats, setBatchStats] = useState<Record<string, { correct: number; total: number }>>({});
  const [muted, setMuted] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [totalXP, setTotalXP] = useState(0);

  const segmentTimer = useRef<NodeJS.Timeout | null>(null);
  const socket = useSocket();
  const router = useRouter();

  // Advance segments on a timer based on durationSeconds
  const advanceSegment = useCallback(() => {
    setCurrentSegment((prev) => {
      const next = prev + 1;
      if (next >= course.script.segments.length) {
        setIsPlaying(false);
        // Course completed
        socket.emit('interaction:answer', {
          interactionId: 'course_complete',
          batchId: batch._id,
          courseId: course._id,
          answer: true,
          timeTaken: 0,
          interactionType: 'course_completed',
          xpReward: 200,
        });
        return prev;
      }
      return next;
    });
  }, [course.script.segments.length, batch._id, course._id, socket]);

  // Schedule segment advance when playing
  useEffect(() => {
    if (segmentTimer.current) clearTimeout(segmentTimer.current);
    if (!isPlaying || activeInteraction) return;

    const seg = course.script.segments[currentSegment];
    if (!seg) return;

    segmentTimer.current = setTimeout(advanceSegment, seg.durationSeconds * 1000);
    return () => {
      if (segmentTimer.current) clearTimeout(segmentTimer.current);
    };
  }, [isPlaying, currentSegment, activeInteraction, advanceSegment, course.script.segments]);

  // Check if current segment should trigger an interaction
  useEffect(() => {
    const seg = course.script.segments[currentSegment];
    if (!seg || !isPlaying) return;

    const interaction = course.interactions.find((i) => i.afterSegmentId === seg.id);
    if (interaction && !activeInteraction) {
      // Pause and show interaction after segment completes
      const seg = course.script.segments[currentSegment];
      const delay = (seg.durationSeconds - 0.5) * 1000;
      const t = setTimeout(() => {
        setIsPlaying(false);
        setActiveInteraction(interaction);
      }, Math.max(delay, 500));
      return () => clearTimeout(t);
    }
  }, [currentSegment, isPlaying, course.script.segments, course.interactions, activeInteraction]);

  // Socket setup
  useEffect(() => {
    socket.emit('batch:join', { batchId: batch._id, userId });
    socket.emit('player:ready', { batchId: batch._id });

    socket.on('leaderboard:update', (lb: LeaderboardEntry[]) => {
      setLeaderboard(lb.map((e, i, arr) => {
        const prev = leaderboard.find((p) => p.userId === e.userId);
        return { ...e, delta: prev ? e.xp - prev.xp : 0 };
      }));
    });

    socket.on('xp:awarded', ({ amount, total }: { amount: number; total: number; newLevel?: unknown }) => {
      setXpEvents((prev) => [...prev, { id: Date.now(), amount }]);
      setTotalXP(total);
    });

    socket.on('learner:joined', ({ name }: { name: string }) => {
      setRecentJoins((prev) => [name, ...prev].slice(0, 3));
    });

    socket.on('interaction:stats', ({ interactionId, correctCount, totalCount }: { interactionId: string; correctCount: number; totalCount: number }) => {
      setBatchStats((prev) => ({ ...prev, [interactionId]: { correct: correctCount, total: totalCount } }));
    });

    socket.on('player:sync', ({ videoTimestamp }: { videoTimestamp: number }) => {
      // Find segment index from timestamp
      let cumTime = 0;
      for (let i = 0; i < course.script.segments.length; i++) {
        cumTime += course.script.segments[i].durationSeconds;
        if (cumTime >= videoTimestamp) {
          setCurrentSegment(i);
          break;
        }
      }
    });

    return () => {
      socket.off('leaderboard:update');
      socket.off('xp:awarded');
      socket.off('learner:joined');
      socket.off('interaction:stats');
      socket.off('player:sync');
    };
  }, [batch._id, userId, socket, leaderboard, course.script.segments]);

  const handleInteractionComplete = (result: {
    interactionId: string;
    answer: unknown;
    timeTaken: number;
    isCorrect: boolean;
  }) => {
    socket.emit('interaction:answer', {
      ...result,
      batchId: batch._id,
      courseId: course._id,
      interactionType: activeInteraction?.type,
      xpReward: activeInteraction?.xpReward,
    });
    setActiveInteraction(null);
    setIsPlaying(true);
  };

  const batchInfo = activeInteraction
    ? batchStats[activeInteraction.id]
    : null;

  return (
    <div className="relative w-full h-screen bg-[#0F0F1A] overflow-hidden flex">
      {/* Main kinetic display */}
      <div className="flex-1 relative">
        <KineticCanvas
          segments={course.script.segments}
          currentSegment={currentSegment}
          isPlaying={isPlaying}
        />

        {/* Interaction overlay */}
        <AnimatePresence>
          {activeInteraction && (
            <InteractionOverlay
              interaction={activeInteraction}
              onComplete={handleInteractionComplete}
              batchCorrectCount={batchInfo?.correct}
              batchTotalCount={batchInfo?.total}
            />
          )}
        </AnimatePresence>

        {/* XP floaters */}
        {xpEvents.map((ev) => (
          <XPFloater
            key={ev.id}
            amount={ev.amount}
            onDone={() => setXpEvents((prev) => prev.filter((e) => e.id !== ev.id))}
          />
        ))}

        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPlaying((p) => !p)}
              disabled={!!activeInteraction}
              className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
            </motion.button>

            <button
              onClick={() => setMuted((m) => !m)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          {totalXP > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 px-4 py-2 rounded-full"
            >
              <span className="text-indigo-400 font-bold text-sm">+{totalXP} XP</span>
              <span className="text-slate-400 text-xs">this session</span>
            </motion.div>
          )}

          <button
            onClick={() => setShowExit(true)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Exit confirmation */}
        <AnimatePresence>
          {showExit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-8 max-w-sm w-full mx-4 text-center"
              >
                <h3 className="text-xl font-bold text-white mb-2">Leave session?</h3>
                <p className="text-slate-400 mb-6 text-sm">Your progress will be saved but you&apos;ll exit this batch.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowExit(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 py-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                  >
                    Exit
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start prompt */}
        {!isPlaying && !activeInteraction && currentSegment === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-3">{course.title}</h2>
              <p className="text-slate-400 mb-8">{batch.learners.length} learners in this batch</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPlaying(true)}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg shadow-2xl shadow-indigo-500/30"
              >
                Start Learning
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-72 border-l border-white/10 flex flex-col bg-[#0D0D1A]">
        <BatchPresence batch={batch} recentJoins={recentJoins} />
        <LiveLeaderboard leaderboard={leaderboard} currentUserId={userId} />
        <ReactionBar onReact={(emoji) => socket.emit('reaction:send', { emoji })} />
      </div>
    </div>
  );
}
