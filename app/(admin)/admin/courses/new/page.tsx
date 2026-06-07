'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StreamEvent {
  status: 'generating' | 'processing' | 'complete' | 'error';
  message: string;
  courseId?: string;
}

export default function NewCoursePage() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [duration, setDuration] = useState(15);
  const [generating, setGenerating] = useState(false);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    setGenerating(true);
    setEvents([]);
    setCourseId(null);

    try {
      const response = await fetch('/api/ai/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, durationMinutes: duration }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamEvent = JSON.parse(line.slice(6));
              setEvents((prev) => [...prev, data]);
              if (data.courseId) setCourseId(data.courseId);
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch (err) {
      setEvents((prev) => [...prev, { status: 'error', message: String(err) }]);
    } finally {
      setGenerating(false);
    }
  };

  const isComplete = events.some((e) => e.status === 'complete');
  const hasError = events.some((e) => e.status === 'error');

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Course with AI</h1>
          <p className="text-slate-400 mt-1">Generate a complete course from a single topic</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Course Parameters</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={generating}
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                placeholder="e.g., JavaScript Closures, Binary Search Trees, React Hooks"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                {['beginner', 'intermediate', 'advanced'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    disabled={generating}
                    className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all border ${
                      difficulty === d
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-[#0F0F1A] border-white/10 text-slate-400 hover:border-indigo-500/50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Duration: <span className="text-indigo-400 font-semibold">{duration} minutes</span>
              </label>
              <input
                type="range"
                min={10}
                max={30}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={generating}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>10 min</span>
                <span>30 min</span>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || generating}
              variant="gradient"
              size="lg"
              className="w-full"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Zap className="w-4 h-4" /> Generate with AI</>
              )}
            </Button>
          </div>
        </div>

        {/* Live stream panel */}
        <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Generation Status</h2>

          {events.length === 0 && !generating && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <Zap className="w-12 h-12 mb-3 opacity-30" />
              <p>Fill in the form and click Generate</p>
            </div>
          )}

          <div className="space-y-3">
            <AnimatePresence>
              {events.map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    event.status === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                    event.status === 'complete' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                    'bg-[#0F0F1A] border border-white/5'
                  }`}
                >
                  {event.status === 'complete' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : event.status === 'error' ? (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : generating && i === events.length - 1 ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${
                    event.status === 'error' ? 'text-red-300' :
                    event.status === 'complete' ? 'text-emerald-300' :
                    'text-slate-300'
                  }`}>
                    {event.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {isComplete && courseId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex gap-3"
            >
              <Link href={`/admin/courses/${courseId}`} className="flex-1">
                <Button variant="outline" className="w-full">Preview Course</Button>
              </Link>
              <Button
                variant="gradient"
                className="flex-1"
                onClick={async () => {
                  await fetch('/api/courses', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: courseId, status: 'published' }),
                  });
                  router.push('/admin/courses');
                }}
              >
                Publish Course
              </Button>
            </motion.div>
          )}

          {hasError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
              <Button variant="outline" onClick={() => { setEvents([]); }} className="w-full">
                Try Again
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
