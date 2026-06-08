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
import { Play, Pause, X, Volume2, VolumeX, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const segmentTimer = useRef<NodeJS.Timeout | null>(null);
  const interactionTimer = useRef<NodeJS.Timeout | null>(null);
  const leaderboardRef = useRef(leaderboard);
  leaderboardRef.current = leaderboard;

  const socket = useSocket();
  const router = useRouter();

  const segments = course.script.segments;
  const totalSegments = segments.length;

  // ── Voice / TTS ───────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (muted) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    // Prefer a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Samantha') || v.name.includes('Google'))
    ) ?? voices.find((v) => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, [muted]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Speak current segment when it changes (and is playing)
  useEffect(() => {
    if (!isPlaying) { stopSpeech(); return; }
    const seg = segments[currentSegment];
    if (seg) speak(seg.text);
  }, [currentSegment, isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop/resume speech on mute toggle
  useEffect(() => {
    if (muted) { stopSpeech(); }
    else if (isPlaying) {
      const seg = segments[currentSegment];
      if (seg) speak(seg.text);
    }
  }, [muted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Segment timer ─────────────────────────────────────────────
  const advanceSegment = useCallback(() => {
    setCurrentSegment((prev) => {
      const next = prev + 1;
      if (next >= totalSegments) {
        setIsPlaying(false);
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
  }, [totalSegments, batch._id, course._id, socket]);

  useEffect(() => {
    if (segmentTimer.current) clearTimeout(segmentTimer.current);
    if (!isPlaying || activeInteraction) return;

    const seg = segments[currentSegment];
    if (!seg) return;

    segmentTimer.current = setTimeout(advanceSegment, seg.durationSeconds * 1000);
    return () => { if (segmentTimer.current) clearTimeout(segmentTimer.current); };
  }, [isPlaying, currentSegment, activeInteraction, advanceSegment, segments]);

  // ── Interaction trigger ───────────────────────────────────────
  useEffect(() => {
    if (interactionTimer.current) clearTimeout(interactionTimer.current);
    const seg = segments[currentSegment];
    if (!seg || !isPlaying || activeInteraction) return;

    const interaction = course.interactions.find((i) => i.afterSegmentId === seg.id);
    if (!interaction) return;

    const delay = Math.max((seg.durationSeconds - 1) * 1000, 500);
    interactionTimer.current = setTimeout(() => {
      setIsPlaying(false);
      stopSpeech();
      setActiveInteraction(interaction);
    }, delay);

    return () => { if (interactionTimer.current) clearTimeout(interactionTimer.current); };
  }, [currentSegment, isPlaying, segments, course.interactions, activeInteraction, stopSpeech]);

  // ── Navigation ────────────────────────────────────────────────
  const goToPrev = useCallback(() => {
    if (segmentTimer.current) clearTimeout(segmentTimer.current);
    if (interactionTimer.current) clearTimeout(interactionTimer.current);
    setActiveInteraction(null);
    setCurrentSegment((p) => Math.max(0, p - 1));
  }, []);

  const goToNext = useCallback(() => {
    if (segmentTimer.current) clearTimeout(segmentTimer.current);
    if (interactionTimer.current) clearTimeout(interactionTimer.current);
    setActiveInteraction(null);
    setCurrentSegment((p) => Math.min(totalSegments - 1, p + 1));
  }, [totalSegments]);

  // Keyboard shortcuts: Space = play/pause, ← → = prev/next
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying((p) => !p); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); goToPrev(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); goToNext(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToPrev, goToNext]);

  // ── Socket setup ──────────────────────────────────────────────
  useEffect(() => {
    socket.emit('batch:join', { batchId: batch._id, userId });
    socket.emit('player:ready', { batchId: batch._id });

    socket.on('leaderboard:update', (lb: LeaderboardEntry[]) => {
      setLeaderboard(
        lb.map((e) => {
          const prev = leaderboardRef.current.find((p) => p.userId === e.userId);
          return { ...e, delta: prev ? e.xp - prev.xp : 0 };
        })
      );
    });

    socket.on('xp:awarded', ({ amount, total }: { amount: number; total: number }) => {
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
      let cumTime = 0;
      for (let i = 0; i < segments.length; i++) {
        cumTime += segments[i].durationSeconds;
        if (cumTime >= videoTimestamp) { setCurrentSegment(i); break; }
      }
    });

    return () => {
      socket.off('leaderboard:update');
      socket.off('xp:awarded');
      socket.off('learner:joined');
      socket.off('interaction:stats');
      socket.off('player:sync');
    };
  }, [batch._id, userId, socket, segments]);

  // ── Interaction complete / skip ───────────────────────────────
  const handleInteractionComplete = (result: {
    interactionId: string; answer: unknown; timeTaken: number; isCorrect: boolean;
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

  const handleInteractionSkip = () => {
    setActiveInteraction(null);
    setIsPlaying(true);
  };

  const batchInfo = activeInteraction ? batchStats[activeInteraction.id] : null;

  return (
    <div className="relative w-full h-screen bg-[#0A0A14] overflow-hidden flex">
      {/* ── Main content area ─────────────────────────────────── */}
      <div className="flex-1 relative flex flex-col min-w-0">
        <KineticCanvas segments={segments} currentSegment={currentSegment} isPlaying={isPlaying} />

        {/* Interaction overlay */}
        <AnimatePresence>
          {activeInteraction && (
            <InteractionOverlay
              interaction={activeInteraction}
              onComplete={handleInteractionComplete}
              onSkip={handleInteractionSkip}
              batchCorrectCount={batchInfo?.correct}
              batchTotalCount={batchInfo?.total}
            />
          )}
        </AnimatePresence>

        {/* XP floaters */}
        {xpEvents.map((ev) => (
          <XPFloater key={ev.id} amount={ev.amount} onDone={() => setXpEvents((prev) => prev.filter((e) => e.id !== ev.id))} />
        ))}

        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 flex items-center gap-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
          {/* Prev */}
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={goToPrev}
            disabled={currentSegment === 0}
            className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors disabled:opacity-30"
            title="Previous (←)"
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </motion.button>

          {/* Play / Pause */}
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={() => setIsPlaying((p) => !p)}
            disabled={!!activeInteraction}
            className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-colors"
            title="Play/Pause (Space)"
          >
            {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
          </motion.button>

          {/* Next */}
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={goToNext}
            disabled={currentSegment >= totalSegments - 1}
            className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors disabled:opacity-30"
            title="Next (→)"
          >
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </motion.button>

          {/* Mute */}
          <button
            onClick={() => setMuted((m) => !m)}
            className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors ml-1"
            title={muted ? 'Unmute voice' : 'Mute voice'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>

          {/* Course title */}
          <div className="flex-1 min-w-0 ml-2">
            <p className="text-xs text-slate-500 truncate">{course.title}</p>
          </div>

          {/* XP pill */}
          {totalXP > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-full"
            >
              <span className="text-indigo-400 font-bold text-xs">+{totalXP} XP</span>
            </motion.div>
          )}

          {/* Toggle sidebar */}
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
            title="Toggle sidebar"
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
          </button>

          {/* Exit */}
          <button
            onClick={() => setShowExit(true)}
            className="w-9 h-9 rounded-full bg-white/8 hover:bg-red-500/20 flex items-center justify-center transition-colors"
            title="Exit session"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Exit confirmation */}
        <AnimatePresence>
          {showExit && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
                className="bg-[#1A1A2E] rounded-2xl border border-white/10 p-8 max-w-sm w-full mx-4 text-center"
              >
                <h3 className="text-xl font-bold text-white mb-2">Leave session?</h3>
                <p className="text-slate-400 mb-6 text-sm">Your progress will be saved but you&apos;ll exit this batch.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowExit(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => { stopSpeech(); router.push('/dashboard'); }}
                    className="flex-1 py-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors text-sm"
                  >
                    Exit
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start prompt */}
        <AnimatePresence>
          {!isPlaying && !activeInteraction && currentSegment === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
                className="text-center px-6 max-w-lg"
              >
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full text-xs text-indigo-300 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  {batch.learners.length} learner{batch.learners.length !== 1 ? 's' : ''} in batch
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{course.title}</h2>
                <p className="text-slate-400 text-sm mb-2">{course.description}</p>
                <p className="text-slate-600 text-xs mb-8">
                  {segments.length} segments · ~{course.estimatedMinutes} min · Voice narrated
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setIsPlaying(true)}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-base shadow-2xl shadow-indigo-500/30"
                  >
                    Start Learning
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => { setIsPlaying(true); setMuted(true); }}
                    className="px-8 py-3.5 rounded-xl border border-white/10 text-slate-300 text-base hover:bg-white/5 transition-colors"
                  >
                    Start (Silent)
                  </motion.button>
                </div>
                <p className="text-slate-700 text-xs mt-4">Space = play/pause · ← → = navigate</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: 272, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-l border-white/8 flex flex-col bg-[#0D0D1A] overflow-hidden flex-shrink-0"
          >
            <div className="w-[272px] flex flex-col h-full">
              <BatchPresence batch={batch} recentJoins={recentJoins} />
              <LiveLeaderboard leaderboard={leaderboard} currentUserId={userId} />
              <ReactionBar onReact={(emoji) => socket.emit('reaction:send', { emoji })} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
