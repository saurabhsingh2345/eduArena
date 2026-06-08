'use client';
import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Play, Lightbulb, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CodeData, Interaction } from '@/types';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

interface Props {
  interaction: Interaction & { data: CodeData };
  segmentText?: string;
  onComplete: (result: { interactionId: string; answer: boolean; timeTaken: number; isCorrect: boolean }) => void;
}

export default function CodeChallenge({ interaction, segmentText = '', onComplete }: Props) {
  const { data, timeLimit, xpReward, id } = interaction;
  const [code, setCode] = useState(data.starterCode);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [allPassed, setAllPassed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hintOpen, setHintOpen] = useState(false);
  const [hintText, setHintText] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          if (!submitted) finish(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const runTests = async () => {
    setRunning(true);
    const testResults: TestResult[] = [];

    for (const tc of data.testCases) {
      try {
        const res = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: data.language, code, testInput: tc.input }),
        });

        const result = await res.json() as { stdout?: string; stderr?: string; exitCode?: number; error?: string };

        let actual: string;
        if (!res.ok || result.error) {
          actual = result.error ?? 'Execution error';
        } else if (result.exitCode !== 0 && result.stderr) {
          actual = `Error: ${result.stderr.trim()}`;
        } else {
          actual = (result.stdout ?? '').trim();
        }

        testResults.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: actual,
          passed: actual === tc.expectedOutput.trim(),
        });
      } catch {
        testResults.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: 'Network error',
          passed: false,
        });
      }
    }

    setResults(testResults);
    const passed = testResults.every((r) => r.passed);

    if (passed) {
      setAllPassed(true);
      setSubmitted(true);
      finish(true);
    }
    setRunning(false);
  };

  const finish = (success: boolean) => {
    const timeTaken = Date.now() - startTime.current;
    setTimeout(() => {
      onComplete({ interactionId: id, answer: success, timeTaken, isCorrect: success });
    }, success ? 2000 : 500);
  };

  const fetchHint = useCallback(async () => {
    if (hintLoading) return;
    setHintOpen(true);
    setHintText('');
    setHintLoading(true);

    const failedTests = results
      .filter((r) => !r.passed)
      .map((r) => ({ input: r.input, expected: r.expectedOutput, actual: r.actualOutput }));

    const errorMessage = results.find((r) => r.actualOutput.startsWith('Error:'))?.actualOutput;

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentText,
          interactionType: 'code',
          challengeText: data.instruction,
          userCode: code,
          starterCode: data.starterCode,
          language: data.language,
          errorMessage,
          failedTests: failedTests.length ? failedTests : undefined,
        }),
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
      setHintText('Could not load hint. Check your connection and try again.');
    } finally {
      setHintLoading(false);
    }
  }, [hintLoading, results, segmentText, data.instruction, data.starterCode, data.language, code]);

  const timerPercent = (timeLeft / timeLimit) * 100;

  return (
    <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 w-full max-w-4xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
      {/* Timer bar */}
      <div className="h-1.5 bg-white/10 flex-shrink-0">
        <motion.div
          className={`h-full ${timerPercent > 50 ? 'bg-indigo-500' : timerPercent > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${timerPercent}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: instruction + test cases + hint */}
        <div className="w-72 flex-shrink-0 border-r border-white/10 p-5 overflow-y-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Code Challenge</span>
            <span className="text-xs font-semibold text-amber-400">{timeLeft}s</span>
          </div>
          <h3 className="text-sm font-semibold text-white leading-relaxed">{data.instruction}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-300">+{xpReward} XP</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-400 font-mono">
              {data.language}
            </span>
          </div>

          {/* Test results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase">Test Results</div>
              {results.map((r, i) => (
                <div key={i} className={`p-2.5 rounded-lg text-xs border ${r.passed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {r.passed ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    <span className={r.passed ? 'text-emerald-300' : 'text-red-300'}>Test {i + 1}</span>
                  </div>
                  {!r.passed && (
                    <div className="text-slate-400 space-y-0.5 font-mono text-[11px]">
                      <div>Expected: <span className="text-white">{r.expectedOutput}</span></div>
                      <div>Got: <span className="text-red-300">{r.actualOutput}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* AI Hint panel */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={hintOpen ? () => setHintOpen(false) : fetchHint}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-amber-400 hover:bg-white/5 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 text-left">AI Hint</span>
              {hintLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : hintOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
              {hintOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5">
                    {hintText || (hintLoading && <span className="text-slate-500 italic">Thinking…</span>)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {allPassed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center"
            >
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
              <div className="text-emerald-300 font-semibold text-sm">All tests passed!</div>
              <div className="text-emerald-400 text-xs">+{xpReward} XP earned</div>
            </motion.div>
          )}
        </div>

        {/* Right: Monaco Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language={data.language}
                value={code}
                onChange={(v) => !submitted && setCode(v ?? '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'var(--font-geist-mono), JetBrains Mono, monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  readOnly: submitted,
                  padding: { top: 16, bottom: 16 },
                  renderLineHighlight: 'line',
                }}
              />
            </div>
          </Suspense>

          <div className="p-3 border-t border-white/10 flex items-center gap-3 bg-[#1A1A2E] flex-shrink-0">
            <Button
              onClick={runTests}
              disabled={running || submitted}
              variant="default"
              size="sm"
              className="gap-2"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Tests
            </Button>
            {results.length > 0 && !allPassed && (
              <span className="text-xs text-slate-400">
                {results.filter((r) => r.passed).length}/{results.length} tests passing
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
