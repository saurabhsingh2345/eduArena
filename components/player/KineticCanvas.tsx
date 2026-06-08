'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import type { Segment } from '@/types';

const easeOut = 'easeOut' as const;

const VARIANTS = {
  zoom: {
    initial: { scale: 0.7, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.6, ease: easeOut } as Transition },
    exit: { scale: 1.08, opacity: 0, transition: { duration: 0.3 } as Transition },
  },
  fade: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } as Transition },
    exit: { opacity: 0, y: -12, transition: { duration: 0.25 } as Transition },
  },
  reveal: {
    initial: { x: '-60%', opacity: 0 },
    animate: { x: '0%', opacity: 1, transition: { duration: 0.45, ease: easeOut } as Transition },
    exit: { x: '60%', opacity: 0, transition: { duration: 0.25 } as Transition },
  },
  type: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.2 } as Transition },
  },
};

interface Props {
  segments: Segment[];
  currentSegment: number;
  isPlaying: boolean;
}

function TypewriterText({ text, emphasis }: { text: string; emphasis: string[] }) {
  const [displayedChars, setDisplayedChars] = useState(0);

  useEffect(() => {
    setDisplayedChars(0);
    const interval = setInterval(() => {
      setDisplayedChars((prev) => {
        if (prev >= text.length) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 22);
    return () => clearInterval(interval);
  }, [text]);

  const displayed = text.slice(0, displayedChars);
  const words = displayed.split(' ');

  return (
    <p className="text-xl md:text-2xl font-light leading-relaxed tracking-wide text-center">
      {words.map((word, i) => (
        <span
          key={i}
          className={`mx-0.5 ${
            emphasis?.includes(word.toLowerCase().replace(/[^a-z0-9]/g, ''))
              ? 'text-indigo-300 font-semibold'
              : 'text-white/90'
          }`}
        >
          {word}{' '}
        </span>
      ))}
    </p>
  );
}

function WordRevealText({ text, emphasis }: { text: string; emphasis: string[] }) {
  const words = text.split(' ');
  return (
    <p className="text-xl md:text-2xl font-light leading-relaxed tracking-wide text-center">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.055, duration: 0.25 }}
          className={`mx-0.5 inline-block ${
            emphasis?.includes(word.toLowerCase().replace(/[^a-z0-9]/g, ''))
              ? 'text-indigo-300 font-semibold'
              : 'text-white/90'
          }`}
        >
          {word}{' '}
        </motion.span>
      ))}
    </p>
  );
}

export default function KineticCanvas({ segments, currentSegment, isPlaying }: Props) {
  const segment = segments[currentSegment];

  if (!segment) return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-slate-600 text-xl">No content yet</div>
    </div>
  );

  const variant = VARIANTS[segment.animationStyle as keyof typeof VARIANTS] ?? VARIANTS.fade;
  const phaseLabel = (() => {
    const pct = currentSegment / Math.max(segments.length - 1, 1);
    if (pct < 0.15) return 'Hook';
    if (pct < 0.3) return 'Context';
    if (pct < 0.55) return 'Core Concepts';
    if (pct < 0.78) return 'Deep Dive';
    return 'Synthesis';
  })();

  return (
    <div className="w-full h-full flex items-center justify-center px-8 py-6 md:px-16 md:py-10 relative overflow-hidden">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial ambient glow — shifts by segment */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          key={currentSegment}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)' }}
        />
      </div>

      {/* Phase label */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <span className="text-[10px] font-semibold text-indigo-400/60 uppercase tracking-widest">{phaseLabel}</span>
      </div>

      {/* Segment dots */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 max-w-xs flex-wrap justify-center">
        {segments.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === currentSegment
                ? 'w-5 h-1.5 bg-indigo-400'
                : i < currentSegment
                ? 'w-1.5 h-1.5 bg-indigo-600/60'
                : 'w-1.5 h-1.5 bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Main text content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={segment.id}
          initial={variant.initial}
          animate={variant.animate}
          exit={variant.exit}
          className="text-center max-w-3xl relative z-10 w-full"
        >
          {segment.animationStyle === 'type' ? (
            <TypewriterText text={segment.text} emphasis={segment.emphasis ?? []} />
          ) : (
            <WordRevealText text={segment.text} emphasis={segment.emphasis ?? []} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar + counter */}
      <div className="absolute bottom-6 left-8 right-8 md:left-16 md:right-16">
        <div className="flex justify-between text-[10px] text-slate-600 mb-1.5">
          <span>{currentSegment + 1} / {segments.length}</span>
          <span>{Math.round(((currentSegment + 1) / segments.length) * 100)}%</span>
        </div>
        <div className="h-0.5 bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            animate={{ width: `${((currentSegment + 1) / segments.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}
