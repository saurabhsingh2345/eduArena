'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import type { Segment } from '@/types';

const easeOut = 'easeOut' as const;

const VARIANTS = {
  zoom: {
    initial: { scale: 0.3, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.8, ease: easeOut } as Transition },
    exit: { scale: 1.5, opacity: 0, transition: { duration: 0.4 } as Transition },
  },
  fade: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } as Transition },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } as Transition },
  },
  reveal: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: '0%', opacity: 1, transition: { duration: 0.5, ease: easeOut } as Transition },
    exit: { x: '100%', opacity: 0, transition: { duration: 0.3 } as Transition },
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
        if (prev >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [text]);

  const displayed = text.slice(0, displayedChars);
  const words = displayed.split(' ');

  return (
    <p className="text-4xl font-light leading-relaxed tracking-wide text-center">
      {words.map((word, i) => (
        <span
          key={i}
          className={`mx-1 ${
            emphasis?.includes(word.toLowerCase().replace(/[^a-z]/g, ''))
              ? 'text-indigo-400 font-semibold'
              : 'text-white/90'
          }`}
        >
          {word}
        </span>
      ))}
    </p>
  );
}

function WordRevealText({ text, emphasis }: { text: string; emphasis: string[] }) {
  const words = text.split(' ');
  return (
    <p className="text-4xl font-light leading-relaxed tracking-wide text-center">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.3 }}
          className={`mx-1 inline-block ${
            emphasis?.includes(word.toLowerCase().replace(/[^a-z]/g, ''))
              ? 'text-indigo-400 font-semibold'
              : 'text-white/90'
          }`}
        >
          {word}
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

  const variant = VARIANTS[segment.animationStyle] ?? VARIANTS.fade;

  return (
    <div className="w-full h-full flex items-center justify-center p-16 relative overflow-hidden">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />
      </div>

      {/* Main text content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={segment.id}
          initial={variant.initial}
          animate={variant.animate}
          exit={variant.exit}
          className="text-center max-w-4xl relative z-10"
        >
          {segment.animationStyle === 'type' ? (
            <TypewriterText text={segment.text} emphasis={segment.emphasis ?? []} />
          ) : (
            <WordRevealText text={segment.text} emphasis={segment.emphasis ?? []} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Segment counter */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {segments.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentSegment
                ? 'w-6 bg-indigo-400'
                : i < currentSegment
                ? 'w-2 bg-indigo-600'
                : 'w-2 bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-8 left-16 right-16">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            style={{ width: `${((currentSegment + 1) / segments.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-slate-600">Segment {currentSegment + 1} of {segments.length}</span>
          <span className="text-xs text-slate-600">{Math.round(((currentSegment + 1) / segments.length) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
