'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FillBlankData, Interaction } from '@/types';

interface Props {
  interaction: Interaction & { data: FillBlankData };
  onComplete: (result: { interactionId: string; answer: string; timeTaken: number; isCorrect: boolean }) => void;
}

export default function FillBlankChallenge({ interaction, onComplete }: Props) {
  const { data, timeLimit, xpReward, id } = interaction;
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    inputRef.current?.focus();
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          if (!submitted) handleSubmit('', true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const handleSubmit = (val = answer, timedOut = false) => {
    if (submitted) return;
    const correct = data.blanks[0].toLowerCase().trim() === val.toLowerCase().trim();
    setIsCorrect(correct);
    setSubmitted(true);
    const timeTaken = Date.now() - startTime.current;
    setTimeout(() => {
      onComplete({ interactionId: id, answer: val, timeTaken, isCorrect: correct });
    }, timedOut ? 500 : 1800);
  };

  const timerPercent = (timeLeft / timeLimit) * 100;
  const parts = data.sentence.split('___');

  return (
    <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 max-w-lg w-full mx-4 shadow-2xl overflow-hidden">
      <div className="h-1.5 bg-white/10">
        <motion.div
          className={`h-full rounded-full ${timerPercent > 50 ? 'bg-indigo-500' : timerPercent > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${timerPercent}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Fill in the Blank</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-amber-400">{timeLeft}s</span>
            <span className="text-xs font-semibold text-indigo-300">+{xpReward} XP</span>
          </div>
        </div>

        {/* Sentence with inline input */}
        <div className="text-xl text-white mb-6 leading-relaxed flex flex-wrap items-center gap-2">
          <span>{parts[0]}</span>
          <input
            ref={inputRef}
            type="text"
            value={submitted ? (isCorrect ? answer : data.blanks[0]) : answer}
            onChange={(e) => !submitted && setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !submitted && handleSubmit()}
            disabled={submitted}
            className={`px-3 py-1 rounded-lg border-b-2 bg-transparent font-semibold outline-none min-w-[120px] transition-colors text-center ${
              submitted
                ? isCorrect ? 'border-emerald-500 text-emerald-300' : 'border-red-500 text-red-300'
                : 'border-indigo-500 text-indigo-300 focus:border-violet-500'
            }`}
            placeholder="type here..."
          />
          {parts[1] && <span>{parts[1]}</span>}
        </div>

        {/* Hint */}
        {data.hint && !submitted && (
          <div className="mb-5">
            {showHint ? (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3"
              >
                <Lightbulb className="w-4 h-4 flex-shrink-0" />
                {data.hint}
              </motion.div>
            ) : (
              <button onClick={() => setShowHint(true)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors">
                <Lightbulb className="w-3.5 h-3.5" />
                Show hint
              </button>
            )}
          </div>
        )}

        {!submitted && (
          <Button variant="gradient" onClick={() => handleSubmit()} disabled={!answer.trim()} className="w-full">
            Submit Answer
          </Button>
        )}

        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border text-sm mt-4 ${
                isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/20 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {isCorrect ? (
                  <><CheckCircle className="w-4 h-4" /> Correct! +{xpReward} XP</>
                ) : (
                  <><XCircle className="w-4 h-4" /> The answer was: <span className="text-white">{data.blanks[0]}</span></>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
