'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import StepCard from './StepCard';
import InteractionOverlay from './InteractionOverlay';
import LiveLeaderboard from '../multiplayer/LiveLeaderboard';
import BatchPresence from '../multiplayer/BatchPresence';
import ReactionBar from '../multiplayer/ReactionBar';
import XPFloater from '../shared/XPFloater';
import { BookOpen, CheckCircle, X, Zap } from 'lucide-react';
import type { Course, Batch, LeaderboardEntry, Interaction } from '@/types';

type Phase = 'reading' | 'interacting' | 'result';

interface ResultState {
  isCorrect: boolean;
  xpAwarded: number;
  explanation?: string;
}

interface XPEvent { id: number; amount: number; }
interface Props { course: Course; batch: Batch; userId: string; }

export default function ImmersivePlayer({ course, batch, userId }: Props) {
  const [currentSegment, setCurrentSegment] = useState(0);
  const [phase, setPhase] = useState<Phase>('reading');
  const [activeInteraction, setActiveInteraction] = useState<Interaction | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [muted, setMuted] = useState(false);
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(batch.leaderboard);
  const [recentJoins, setRecentJoins] = useState<string[]>([]);
  const [batchStats, setBatchStats] = useState<Record<string, { correct: number; total: number }>>({});
  const [totalXP, setTotalXP] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [courseComplete, setCourseComplete] = useState(false);
  // Browsers block Web Speech API until a user gesture has occurred.
  // Gate all TTS behind this flag; it flips on first Continue/Back click.
  const [voiceUnlocked, setVoiceUnlocked] = useState(false);

  const leaderboardRef = useRef(leaderboard);
  leaderboardRef.current = leaderboard;

  const socket = useSocket();
  const router = useRouter();
  const segments = course.script.segments;
  const totalSegments = segments.length;

  // ── TTS ───────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || muted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
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

  // Speak when segment changes during reading — only after the user has clicked
  // something (voiceUnlocked), which satisfies the browser's gesture requirement.
  useEffect(() => {
    if (phase !== 'reading' || !voiceUnlocked) { stopSpeech(); return; }
    speak(segments[currentSegment]?.text ?? '');
  }, [currentSegment, phase, muted, voiceUnlocked]); // eslint-disable-line react-hooks/exhaustive-deps

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

    return () => {
      socket.off('leaderboard:update');
      socket.off('xp:awarded');
      socket.off('learner:joined');
      socket.off('interaction:stats');
    };
  }, [batch._id, userId, socket]);

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || phase !== 'reading') return;
      if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); handleNext(); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentSegment, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    setVoiceUnlocked(true);
    const seg = segments[currentSegment];
    if (!seg) return;

    // Check if this segment has an interaction
    const interaction = course.interactions.find((i) => i.afterSegmentId === seg.id);
    if (interaction) {
      stopSpeech();
      setActiveInteraction(interaction);
      setPhase('interacting');
      return;
    }

    // Advance to next segment
    if (currentSegment + 1 >= totalSegments) {
      // Course complete
      socket.emit('interaction:answer', {
        interactionId: 'course_complete',
        batchId: batch._id,
        courseId: course._id,
        answer: true,
        timeTaken: 0,
        interactionType: 'course_completed',
        xpReward: 200,
      });
      setCourseComplete(true);
      return;
    }
    setCurrentSegment((p) => p + 1);
  }, [currentSegment, segments, course.interactions, totalSegments, batch._id, course._id, socket, stopSpeech]);

  const handlePrev = useCallback(() => {
    setVoiceUnlocked(true);
    setPhase('reading');
    setActiveInteraction(null);
    setResult(null);
    setCurrentSegment((p) => Math.max(0, p - 1));
  }, []);

  // ── Interaction complete ──────────────────────────────────────
  const handleInteractionComplete = (res: {
    interactionId: string;
    answer: unknown;
    timeTaken: number;
    isCorrect: boolean;
  }) => {
    socket.emit('interaction:answer', {
      ...res,
      batchId: batch._id,
      courseId: course._id,
      interactionType: activeInteraction?.type,
      xpReward: activeInteraction?.xpReward,
    });

    // Pull explanation from MCQ data if available
    const explanation = activeInteraction?.type === 'mcq'
      ? (activeInteraction.data as { explanation?: string }).explanation
      : undefined;

    setResult({
      isCorrect: res.isCorrect,
      xpAwarded: res.isCorrect ? (activeInteraction?.xpReward ?? 0) : 0,
      explanation,
    });
    setPhase('result');
  };

  const handleInteractionSkip = () => {
    setActiveInteraction(null);
    setPhase('reading');
    setCurrentSegment((p) => Math.min(totalSegments - 1, p + 1));
  };

  const handleResultContinue = () => {
    setResult(null);
    setActiveInteraction(null);
    setPhase('reading');
    if (currentSegment + 1 >= totalSegments) {
      setCourseComplete(true);
    } else {
      setCurrentSegment((p) => p + 1);
    }
  };

  const interactionIndex = activeInteraction
    ? course.interactions.findIndex((i) => i.id === activeInteraction.id)
    : -1;
  const batchInfo = activeInteraction ? batchStats[activeInteraction.id] : null;
  const seg = segments[currentSegment];

  // ── Course complete screen ────────────────────────────────────
  if (courseComplete) {
    return (
      <div className="w-full h-screen bg-[#0A0A14] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-6 max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Course Complete!</h2>
          <p className="text-slate-400 mb-2">{course.title}</p>
          {totalXP > 0 && (
            <p className="text-indigo-400 font-semibold text-lg mb-6">+{totalXP} XP earned</p>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#0A0A14] overflow-hidden flex flex-col">
      {/* ── Top bar ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0D0D1A]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-none">{course.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {totalXP > 0 && (
            <span className="text-xs text-indigo-400 font-semibold tabular-nums">+{totalXP} XP</span>
          )}
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors"
            title="Toggle leaderboard"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowExit(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">
              {/* READING PHASE */}
              {phase === 'reading' && seg && (
                <StepCard
                  key={`step-${seg.id}`}
                  segment={seg}
                  segmentIndex={currentSegment}
                  totalSegments={totalSegments}
                  muted={muted}
                  onToggleMute={() => { setVoiceUnlocked(true); setMuted((m) => !m); }}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  canGoBack={currentSegment > 0}
                  canGoNext={true}
                />
              )}

              {/* INTERACTING PHASE */}
              {phase === 'interacting' && activeInteraction && (
                <motion.div
                  key={`interaction-${activeInteraction.id}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.28 }}
                >
                  <InteractionOverlay
                    interaction={activeInteraction}
                    onComplete={handleInteractionComplete}
                    onSkip={handleInteractionSkip}
                    batchCorrectCount={batchInfo?.correct}
                    batchTotalCount={batchInfo?.total}
                    segmentText={seg?.text ?? ''}
                    segmentIndex={currentSegment}
                    totalSegments={totalSegments}
                    interactionIndex={interactionIndex >= 0 ? interactionIndex : undefined}
                    totalInteractions={course.interactions.length}
                  />
                </motion.div>
              )}

              {/* RESULT PHASE */}
              {phase === 'result' && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.28 }}
                  className="w-full max-w-2xl"
                >
                  <div className={`rounded-2xl border p-8 text-center shadow-2xl ${
                    result.isCorrect
                      ? 'bg-emerald-500/8 border-emerald-500/25'
                      : 'bg-red-500/8 border-red-500/20'
                  }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      result.isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/15'
                    }`}>
                      {result.isCorrect
                        ? <CheckCircle className="w-8 h-8 text-emerald-400" />
                        : <X className="w-8 h-8 text-red-400" />}
                    </div>
                    <h3 className={`text-xl font-bold mb-1 ${result.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                      {result.isCorrect ? 'Correct!' : 'Not quite'}
                    </h3>
                    {result.xpAwarded > 0 && (
                      <p className="text-indigo-400 font-semibold mb-3">+{result.xpAwarded} XP</p>
                    )}
                    {result.explanation && (
                      <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto mb-6">
                        {result.explanation}
                      </p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleResultContinue}
                      className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg transition-colors"
                    >
                      Continue →
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 264, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="border-l border-white/8 flex flex-col bg-[#0D0D1A] overflow-hidden flex-shrink-0"
            >
              <div className="w-[264px] flex flex-col h-full">
                <BatchPresence batch={batch} recentJoins={recentJoins} />
                <LiveLeaderboard leaderboard={leaderboard} currentUserId={userId} />
                <ReactionBar onReact={(emoji) => socket.emit('reaction:send', { emoji })} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* XP floaters */}
      {xpEvents.map((ev) => (
        <XPFloater
          key={ev.id}
          amount={ev.amount}
          onDone={() => setXpEvents((prev) => prev.filter((e) => e.id !== ev.id))}
        />
      ))}

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
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              className="bg-[#1A1A2E] rounded-2xl border border-white/10 p-8 max-w-sm w-full mx-4 text-center"
            >
              <h3 className="text-xl font-bold text-white mb-2">Leave session?</h3>
              <p className="text-slate-400 mb-6 text-sm">Your progress will be saved.</p>
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
    </div>
  );
}
