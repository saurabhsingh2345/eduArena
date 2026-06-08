'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward, Lightbulb, Loader2, X } from 'lucide-react';
import MCQChallenge from './MCQChallenge';
import FillBlankChallenge from './FillBlankChallenge';
import CodeChallenge from './CodeChallenge';
import ConceptMatchChallenge from './ConceptMatchChallenge';
import type { Interaction, MCQData, FillBlankData, ConceptMatchData } from '@/types';

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
  segmentText?: string;
  segmentIndex?: number;
  totalSegments?: number;
  interactionIndex?: number;
  totalInteractions?: number;
}

function useAITutor(interaction: Interaction, segmentText: string) {
  const [hintText, setHintText] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);

  const fetchHint = useCallback(async () => {
    if (hintLoading) return;
    setHintOpen(true);
    setHintText('');
    setHintLoading(true);

    const type = interaction.type;
    const d = interaction.data;
    let payload: Record<string, unknown> = { segmentText, interactionType: type };

    if (type === 'mcq') {
      const mcq = d as MCQData;
      payload = { ...payload, challengeText: mcq.question };
    } else if (type === 'fill_blank') {
      const fb = d as FillBlankData;
      payload = { ...payload, challengeText: fb.sentence, hint: fb.hint };
    } else if (type === 'concept_match') {
      const cm = d as ConceptMatchData;
      payload = {
        ...payload,
        challengeText: cm.pairs.map((p) => `${p.term}: ${p.definition}`).join('\n'),
      };
    }

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.body) throw new Error('No stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setHintText(accumulated);
      }
    } catch {
      setHintText('Could not load hint. Try again.');
    } finally {
      setHintLoading(false);
    }
  }, [hintLoading, interaction, segmentText]);

  return { hintText, hintOpen, hintLoading, fetchHint, closeHint: () => setHintOpen(false) };
}

export default function InteractionOverlay({
  interaction,
  onComplete,
  onSkip,
  batchCorrectCount,
  batchTotalCount,
  segmentText = '',
  segmentIndex,
  totalSegments,
  interactionIndex,
  totalInteractions,
}: Props) {
  const { hintText, hintOpen, hintLoading, fetchHint, closeHint } = useAITutor(interaction, segmentText);
  const showHintButton = interaction.type !== 'code';

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Breadcrumb + skip row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          {segmentIndex !== undefined && totalSegments !== undefined && (
            <span>Segment {segmentIndex + 1}/{totalSegments}</span>
          )}
          {interactionIndex !== undefined && totalInteractions !== undefined && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-indigo-500 font-medium">
                Checkpoint {interactionIndex + 1}/{totalInteractions}
              </span>
            </>
          )}
        </div>
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          Skip <SkipForward className="w-3 h-3" />
        </button>
      </div>

      {/* Challenge card (each component renders its own card shell) */}
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
          segmentText={segmentText}
          onComplete={onComplete}
        />
      )}
      {interaction.type === 'concept_match' && (
        <ConceptMatchChallenge
          interaction={interaction as Parameters<typeof ConceptMatchChallenge>[0]['interaction']}
          onComplete={onComplete}
        />
      )}

      {/* AI Hint for non-code types */}
      {showHintButton && (
        <div className="mt-3">
          <AnimatePresence mode="wait">
            {hintOpen ? (
              <motion.div
                key="hint-open"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="bg-[#1A1A2E] border border-amber-500/20 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                    <Lightbulb className="w-3.5 h-3.5" />
                    AI Tutor
                  </span>
                  <button onClick={closeHint} className="text-slate-600 hover:text-slate-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed min-h-[2rem]">
                  {hintLoading && !hintText
                    ? <span className="flex items-center gap-2 text-slate-500 text-xs"><Loader2 className="w-3 h-3 animate-spin" />Thinking…</span>
                    : hintText}
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="hint-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={fetchHint}
                className="flex items-center gap-2 text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Get AI hint
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
