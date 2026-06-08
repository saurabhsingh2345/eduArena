'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { Batch } from '@/types';

interface Props {
  batch: Batch;
  onlineCount?: number;
  recentJoins?: string[];
}

export default function BatchPresence({ batch, onlineCount, recentJoins = [] }: Props) {
  const count = onlineCount ?? batch.learners.length;

  return (
    <div className="p-4 border-b border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Batch #{batch.batchNumber}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">{count} live</span>
        </div>
      </div>

      {/* Avatar stack */}
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {batch.learners.slice(0, 6).map((learner, i) => {
            const entry = batch.leaderboard.find((e) => e.userId === learner.userId);
            const name = entry?.name ?? (learner as { name?: string }).name;
            return (
              <motion.div
                key={learner.userId}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="w-7 h-7 rounded-full border-2 border-[#0D0D1A] bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                title={name}
              >
                {getInitials(name)}
              </motion.div>
            );
          })}
          {batch.learners.length > 6 && (
            <div className="w-7 h-7 rounded-full border-2 border-[#0D0D1A] bg-[#2A2A3E] flex items-center justify-center text-[10px] text-slate-400 font-medium">
              +{batch.learners.length - 6}
            </div>
          )}
        </div>
      </div>


      {/* Recent joins */}
      <AnimatePresence>
        {recentJoins.slice(0, 2).map((name, i) => (
          <motion.div
            key={`${name}-${i}`}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-slate-500"
          >
            <span className="text-indigo-400">{name.split(' ')[0]}</span> joined
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
