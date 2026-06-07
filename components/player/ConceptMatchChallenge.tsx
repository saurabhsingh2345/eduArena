'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ConceptMatchData, Interaction } from '@/types';

interface Props {
  interaction: Interaction & { data: ConceptMatchData };
  onComplete: (result: { interactionId: string; answer: unknown; timeTaken: number; isCorrect: boolean }) => void;
}

export default function ConceptMatchChallenge({ interaction, onComplete }: Props) {
  const { data, timeLimit, xpReward, id } = interaction;
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const startTime = useRef(Date.now());

  const shuffledDefs = useRef(
    [...data.pairs.map((p) => p.definition)].sort(() => Math.random() - 0.5)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          if (!submitted) finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const selectDef = (def: string) => {
    if (!selectedTerm || submitted) return;
    setMatched((prev) => ({ ...prev, [selectedTerm]: def }));
    setSelectedTerm(null);
  };

  const finish = () => {
    const pairs = Object.entries(matched).map(([term, definition]) => ({ term, definition }));
    const isCorrect = data.pairs.every((p) => matched[p.term] === p.definition);
    setSubmitted(true);
    const timeTaken = Date.now() - startTime.current;
    setTimeout(() => {
      onComplete({ interactionId: id, answer: pairs, timeTaken, isCorrect });
    }, 2000);
  };

  const timerPercent = (timeLeft / timeLimit) * 100;
  const allMatched = Object.keys(matched).length === data.pairs.length;

  return (
    <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 max-w-2xl w-full mx-4 shadow-2xl overflow-hidden">
      <div className="h-1.5 bg-white/10">
        <motion.div
          className={`h-full rounded-full ${timerPercent > 50 ? 'bg-indigo-500' : timerPercent > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${timerPercent}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Concept Match</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-amber-400">{timeLeft}s</span>
            <span className="text-xs font-semibold text-indigo-300">+{xpReward} XP</span>
          </div>
        </div>

        <p className="text-slate-400 text-sm mb-5">Match each term with its correct definition.</p>

        <div className="grid grid-cols-2 gap-4">
          {/* Terms */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Terms</div>
            {data.pairs.map((p) => {
              const isMatched = !!matched[p.term];
              const isSelected = selectedTerm === p.term;
              return (
                <button
                  key={p.term}
                  onClick={() => !submitted && !isMatched && setSelectedTerm(p.term)}
                  disabled={isMatched || submitted}
                  className={`w-full p-3 rounded-xl text-sm text-left border transition-all ${
                    submitted && isMatched
                      ? matched[p.term] === p.definition
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                      : isMatched ? 'bg-white/5 border-white/5 text-slate-500'
                      : isSelected ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-[#0F0F1A] border-white/10 text-white hover:border-indigo-500/30'
                  }`}
                >
                  {p.term}
                  {isMatched && (
                    <div className="text-xs mt-0.5 opacity-70 truncate">{matched[p.term]}</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Definitions */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Definitions</div>
            {shuffledDefs.current.map((def) => {
              const isUsed = Object.values(matched).includes(def);
              return (
                <button
                  key={def}
                  onClick={() => selectedTerm && !isUsed && !submitted && selectDef(def)}
                  disabled={isUsed || !selectedTerm || submitted}
                  className={`w-full p-3 rounded-xl text-sm text-left border transition-all ${
                    isUsed
                      ? 'bg-white/5 border-white/5 text-slate-600'
                      : selectedTerm
                      ? 'bg-[#0F0F1A] border-indigo-500/30 text-white hover:border-indigo-500/60 hover:bg-indigo-500/5 cursor-pointer'
                      : 'bg-[#0F0F1A] border-white/5 text-slate-400'
                  }`}
                >
                  {def}
                </button>
              );
            })}
          </div>
        </div>

        {!submitted && allMatched && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
            <Button variant="gradient" onClick={finish} className="w-full">
              Submit Matches
            </Button>
          </motion.div>
        )}

        {selectedTerm && !submitted && (
          <p className="text-xs text-indigo-400 text-center mt-3">
            Now click a definition to match with &quot;{selectedTerm}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
