'use client';
import { motion } from 'framer-motion';
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
  batchCorrectCount?: number;
  batchTotalCount?: number;
}

export default function InteractionOverlay({ interaction, onComplete, batchCorrectCount, batchTotalCount }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(15, 15, 26, 0.85)' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full flex items-center justify-center"
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
