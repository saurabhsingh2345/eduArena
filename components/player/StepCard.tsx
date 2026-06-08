'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import type { Segment } from '@/types';

interface Props {
  segment: Segment;
  segmentIndex: number;
  totalSegments: number;
  muted: boolean;
  onToggleMute: () => void;
  onNext: () => void;
  onPrev: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  autoAdvanceSeconds?: number; // if set, auto-advance after N seconds
}

const PHASE_COLORS: Record<string, string> = {
  Hook:           'text-pink-400 bg-pink-500/10 border-pink-500/20',
  Context:        'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Core Concepts':'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'Deep Dive':    'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Synthesis:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function getPhase(index: number, total: number): string {
  const pct = index / Math.max(total - 1, 1);
  if (pct < 0.15) return 'Hook';
  if (pct < 0.30) return 'Context';
  if (pct < 0.55) return 'Core Concepts';
  if (pct < 0.78) return 'Deep Dive';
  return 'Synthesis';
}

function HighlightedText({ text, emphasis }: { text: string; emphasis: string[] }) {
  const emphasisSet = new Set(emphasis.map((e) => e.toLowerCase().replace(/[^a-z0-9]/g, '')));
  const words = text.split(' ');

  return (
    <p className="text-[1.05rem] leading-[1.85] text-slate-200 font-light tracking-wide">
      {words.map((word, i) => {
        const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isEm = emphasisSet.has(clean);
        return (
          <span key={i}>
            <span className={isEm ? 'text-indigo-300 font-medium' : undefined}>
              {word}
            </span>
            {' '}
          </span>
        );
      })}
    </p>
  );
}

export default function StepCard({
  segment,
  segmentIndex,
  totalSegments,
  muted,
  onToggleMute,
  onNext,
  onPrev,
  canGoBack,
  canGoNext,
  autoAdvanceSeconds,
}: Props) {
  const [timer, setTimer] = useState(autoAdvanceSeconds ?? 0);

  // Reset timer when segment changes
  useEffect(() => {
    if (!autoAdvanceSeconds) return;
    setTimer(autoAdvanceSeconds);
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onNext();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [segment.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const phase = getPhase(segmentIndex, totalSegments);
  const phaseStyle = PHASE_COLORS[phase] ?? PHASE_COLORS.Context;
  const progress = ((segmentIndex + 1) / totalSegments) * 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={segment.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-2xl"
      >
        {/* Card */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Progress bar */}
          <div className="h-0.5 bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="p-7">
            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${phaseStyle}`}>
                {phase}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 tabular-nums">
                  {segmentIndex + 1} <span className="text-slate-700">/</span> {totalSegments}
                </span>
                <button
                  onClick={onToggleMute}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-white/8 transition-colors"
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="mb-7 min-h-[8rem]">
              <HighlightedText text={segment.text} emphasis={segment.emphasis ?? []} />
            </div>

            {/* Key terms strip */}
            {segment.emphasis?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-7">
                {segment.emphasis.slice(0, 6).map((term) => (
                  <span
                    key={term}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/15"
                  >
                    {term}
                  </span>
                ))}
              </div>
            )}

            {/* Navigation row */}
            <div className="flex items-center justify-between">
              <button
                onClick={onPrev}
                disabled={!canGoBack}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {/* Auto-advance ring + continue button */}
              <div className="flex items-center gap-3">
                {autoAdvanceSeconds && timer > 0 && (
                  <span className="text-xs text-slate-600 tabular-nums">{timer}s</span>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onNext}
                  disabled={!canGoNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Segment dot trail below card */}
        <div className="flex items-center justify-center gap-1 mt-4 flex-wrap px-2">
          {Array.from({ length: Math.min(totalSegments, 24) }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ${
                i === segmentIndex
                  ? 'w-4 h-1.5 bg-indigo-400'
                  : i < segmentIndex
                  ? 'w-1.5 h-1.5 bg-indigo-700'
                  : 'w-1.5 h-1.5 bg-white/8'
              }`}
            />
          ))}
          {totalSegments > 24 && (
            <span className="text-[10px] text-slate-700 ml-1">+{totalSegments - 24}</span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
