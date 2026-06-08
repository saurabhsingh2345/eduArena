'use client';
import { motion } from 'framer-motion';
import { SkipForward } from 'lucide-react';
import MCQChallenge from './MCQChallenge';
import FillBlankChallenge from './FillBlankChallenge';
import CodeChallenge from './CodeChallenge';
import ConceptMatchChallenge from './ConceptMatchChallenge';
import type { Interaction } from '@/types';

interface Props {
  interaction: Interaction;
  onComplete: (result: {
    interactionId: string;
    answer: unknown;
    timeTaken: number;
    isCorrect: boolean;
  }) => void;
  onSkip: () => void;
  batchCorrectCount?: number;
  batchTotalCount?: number;
}

export default function InteractionOverlay({ interaction, onComplete, onSkip, batchCorrectCount, batchTotalCount }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{ backdropFilter: 'blur(14px)', backgroundColor: 'rgba(10, 10, 20, 0.88)' }}
    >
      {/* Skip button — top right */}
      <button
        onClick={onSkip}
        className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors z-40"
        title="Skip this challenge (no XP awarded)"
      >
        Skip <SkipForward className="w-3 h-3" />
      </button>

      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="w-full flex items-center justify-center px-4"
      >
        {interaction.type === 'mcq' && (
          <MCQChallenge
            interaction={interaction as Parameters<typeof MCQChallenge>[0]['interaction']}
            onComplete={onComplete}
            batchCorrectCount={batchCorrectCount}
            batchTotalCount={batchTotalCount}
          />
        )}
        {interaction.type === 'fill_blank' && (
          <FillBlankChallenge
            interaction={interaction as Parameters<typeof FillBlankChallenge>[0]['interaction']}
            onComplete={onComplete}
          />
        )}
        {interaction.type === 'code' && (
          <CodeChallenge
            interaction={interaction as Parameters<typeof CodeChallenge>[0]['interaction']}
            onComplete={onComplete}
          />
        )}
        {interaction.type === 'concept_match' && (
          <ConceptMatchChallenge
            interaction={interaction as Parameters<typeof ConceptMatchChallenge>[0]['interaction']}
            onComplete={onComplete}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
