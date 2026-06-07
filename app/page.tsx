'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap, BookOpen, Users, Trophy, Code, Brain, ArrowRight,
  CheckCircle, Star, Layers, Play, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEMO_SEGMENTS = [
  { text: 'A closure is a function that remembers variables from its outer scope even after that scope has finished executing.', emphasis: ['closure', 'remembers', 'outer', 'scope'] },
  { text: 'This powerful concept allows functions to maintain state between calls — making closures fundamental to JavaScript design patterns.', emphasis: ['state', 'fundamental', 'JavaScript'] },
  { text: 'Every time you create a function inside another function, you are creating a closure.', emphasis: ['closure'] },
];

function DemoPlayer() {
  const [current, setCurrent] = useState(0);
  const seg = DEMO_SEGMENTS[current];

  return (
    <div className="relative bg-[#0F0F1A] rounded-2xl border border-indigo-500/30 overflow-hidden aspect-video max-w-2xl mx-auto shadow-2xl shadow-indigo-500/20">
      {/* Grid bg */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
      </div>

      <div className="relative h-full flex items-center justify-center p-10">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center max-w-lg"
        >
          <p className="text-2xl font-light text-white/90 leading-relaxed">
            {seg.text.split(' ').map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className={`mx-1 ${
                  seg.emphasis.includes(word.toLowerCase().replace(/[^a-z]/g, ''))
                    ? 'text-indigo-400 font-semibold'
                    : ''
                }`}
              >
                {word}
              </motion.span>
            ))}
          </p>
        </motion.div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {DEMO_SEGMENTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-indigo-400' : 'w-2 bg-white/20'}`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrent((c) => (c + 1) % DEMO_SEGMENTS.length)}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
        >
          Next <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* LIVE badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 px-2.5 py-1 rounded-full">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-xs font-semibold text-red-300">LIVE</span>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Generated Courses',
    desc: 'Enter any topic — our AI writes the script, designs interactions, and builds a complete course in under 60 seconds.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: Users,
    title: 'Battle in Batches',
    desc: 'Every 5 minutes, learners are grouped into competitive batches. Race through the material, answer challenges, climb the live leaderboard.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Code,
    title: 'Master by Doing',
    desc: 'MCQs, live coding challenges, fill-in-the-blank, and concept matching — every interaction is designed to reinforce real understanding.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
];

const STEPS = [
  { step: '01', title: 'Admin Creates', desc: 'Enter a topic, choose difficulty and duration. AI generates the full course in seconds.' },
  { step: '02', title: 'Learners Compete', desc: 'Batch up every 5 minutes. Watch kinetic text, answer challenges, earn XP.' },
  { step: '03', title: 'Analytics Follow', desc: 'Track completion rates, interaction scores, learner progress with real-time dashboards.' },
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: email.split('@')[0], email, password: 'demo123456' }),
    }).catch(() => {});
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#0D0D1A]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">EduArena</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="gradient" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 text-sm text-indigo-400 mb-6 font-medium"
          >
            <Zap className="w-3.5 h-3.5" />
            Powered by Groq · Open Source · Free to Deploy
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Where{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Competitive Learning
            </span>
            <br />Meets AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto mb-10"
          >
            AI-generated kinetic courses. Real-time multiplayer battles. XP and leaderboards that make learning feel like a game.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center mb-16"
          >
            <Link href="/register">
              <Button variant="gradient" size="xl">
                Start Learning Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="xl">
                <Play className="w-5 h-5" />
                Admin Demo
              </Button>
            </Link>
          </motion.div>

          {/* Demo player */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <DemoPlayer />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-[#0D0D1A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything learners need. Nothing they don&apos;t.</h2>
            <p className="text-slate-400 text-lg">Built for colleges. Designed to impress. Zero cost to deploy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border ${bg}`}
              >
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400">Three steps from topic to competitive learning session</p>
          </div>

          <div className="space-y-6">
            {STEPS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-6 p-6 bg-[#1E1E2E] rounded-2xl border border-white/10"
              >
                <div className="text-5xl font-bold text-white/10 flex-shrink-0 font-mono">{step}</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                  <p className="text-slate-400">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Institutions */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-[#0D0D1A]">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 rounded-3xl border border-indigo-500/20 p-10 md:p-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-400 text-sm font-medium px-3 py-1.5 rounded-full mb-4">
                  <BookOpen className="w-4 h-4" />
                  For Institutions
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Transform how your students learn
                </h2>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  EduArena turns passive watching into active competition. Instructors create courses with AI, students battle in batches every 5 minutes, and analytics show exactly who&apos;s learning and who needs help.
                </p>
                <div className="space-y-3">
                  {[
                    'Zero cost — entirely open-source',
                    'One command to deploy with Docker',
                    'Admin portal for course management',
                    'Real-time analytics and learner tracking',
                  ].map((point) => (
                    <div key={point} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA form */}
              <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white mb-2">You&apos;re on the list!</h3>
                    <p className="text-slate-400 text-sm">We&apos;ll be in touch about a demo.</p>
                    <Link href="/register" className="inline-block mt-4">
                      <Button variant="gradient">Try it now</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-2">Request a Demo</h3>
                    <p className="text-slate-400 text-sm mb-5">Get a walkthrough for your institution.</p>
                    <form onSubmit={submitDemo} className="space-y-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your.email@university.edu"
                        className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <Button type="submit" variant="gradient" size="lg" className="w-full">
                        Request Demo
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">EduArena</span>
          </div>
          <p className="text-slate-500 text-sm">Open-source · Built for the future of education</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
