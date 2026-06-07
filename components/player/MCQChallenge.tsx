'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MCQData, Interaction } from '@/types';

interface Props {
  interaction: Interaction & { data: MCQData };
  onComplete: (result: { interactionId: string; answer: number; timeTaken: number; isCorrect: boolean }) => void;
  batchCorrectCount?: number;
  batchTotalCount?: number;
}

export default function MCQChallenge({ interaction, onComplete, batchCorrectCount, batchTotalCount }: Props) {
  const { data, timeLimit, xpReward, id } = interaction;
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          if (!submitted) handleSubmit(selected ?? -1, true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, selected]);

  const handleSubmit = (idx: number, timedOut = false) => {
    if (submitted) return;
    setSelected(idx);
    setSubmitted(true);
    const timeTaken = Date.now() - startTime.current;
    const isCorrect = idx === data.correctIndex;
    setTimeout(() => {
      onComplete({ interactionId: id, answer: idx, timeTaken, isCorrect });
    }, timedOut ? 500 : 2000);
  };

  const timerPercent = (timeLeft / timeLimit) * 100;
  const isCorrect = submitted && selected === data.correctIndex;
  const isWrong = submitted && selected !== data.correctIndex && selected !== -1;

  return (
    <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 max-w-2xl w-full mx-4 shadow-2xl overflow-hidden">
      {/* Timer bar */}
      <div className="h-1.5 bg-white/10">
        <motion.div
          className={`h-full rounded-full transition-all ${timerPercent > 50 ? 'bg-indigo-500' : timerPercent > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${timerPercent}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Multiple Choice</span>
          <div className="flex items-center gap-3">
            {batchTotalCount ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5" />
                {batchCorrectCount}/{batchTotalCount} got it right
              </span>
            ) : null}
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              {timeLeft}s
            </span>
            <span className="text-xs font-semibold text-indigo-300">+{xpReward} XP</span>
          </div>
        </div>

        {/* Question */}
        <h3 className="text-xl font-semibold text-white mb-6 leading-relaxed">{data.question}</h3>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {data.options.map((option, i) => {
            const isSelected = selected === i;
            const isCorrectOption = submitted && i === data.correctIndex;
            const isWrongSelected = submitted && isSelected && i !== data.correctIndex;

            return (
              <motion.button
                key={i}
                onClick={() => !submitted && handleSubmit(i)}
                whileHover={!submitted ? { scale: 1.02 } : {}}
                whileTap={!submitted ? { scale: 0.98 } : {}}
                className={`p-4 rounded-xl text-left text-sm font-medium border transition-all ${
                  isCorrectOption
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : isWrongSelected
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : isSelected && !submitted
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : !submitted
                    ? 'bg-[#0F0F1A] border-white/10 text-white hover:border-indigo-500/50 hover:bg-indigo-500/5'
                    : 'bg-[#0F0F1A] border-white/5 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isCorrectOption ? 'bg-emerald-500/30 text-emerald-300' :
                    isWrongSelected ? 'bg-red-500/30 text-red-300' :
                    'bg-white/10 text-slate-400'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                  {isCorrectOption && <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />}
                  {isWrongSelected && <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Result / Explanation */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border text-sm ${
                isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/20 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold mb-1">
                {isCorrect ? (
                  <><CheckCircle className="w-4 h-4" /> Correct! +{xpReward} XP</>
                ) : (
                  <><XCircle className="w-4 h-4" /> {selected === -1 ? "Time's up!" : 'Incorrect'}</>
                )}
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{data.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
