'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

interface Props {
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
}

export default function LiveLeaderboard({ leaderboard, currentUserId }: Props) {
  const sorted = [...leaderboard].sort((a, b) => b.xp - a.xp).slice(0, 10);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-white">Leaderboard</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {sorted.map((entry, i) => {
            const isMe = entry.userId === currentUserId;
            const initials = getInitials(entry.name);
            return (
              <motion.div
                key={entry.userId}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors ${
                  isMe ? 'bg-indigo-500/15 border border-indigo-500/20' : 'bg-white/[0.03]'
                }`}
              >
                {/* Rank */}
                <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${
                  i === 0 ? 'text-amber-400' :
                  i === 1 ? 'text-slate-300' :
                  i === 2 ? 'text-amber-600' :
                  'text-slate-600'
                }`}>
                  {i === 0 ? '🥇' : `#${i + 1}`}
                </span>

                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isMe ? 'bg-indigo-500' : 'bg-gradient-to-br from-indigo-700 to-violet-700'
                } text-white`}>
                  {initials}
                </div>

                {/* Name */}
                <span className={`flex-1 text-xs font-medium truncate ${isMe ? 'text-indigo-300' : 'text-slate-300'}`}>
                  {isMe ? 'You' : entry.name.split(' ')[0]}
                </span>

                {/* XP */}
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-semibold text-indigo-400">{entry.xp}</span>
                  {entry.delta && entry.delta > 0 && (
                    <motion.div
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 0, y: -10 }}
                      transition={{ duration: 1.5 }}
                      className="text-[10px] text-emerald-400 font-semibold"
                    >
                      +{entry.delta}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sorted.length === 0 && (
          <div className="text-center py-8 text-slate-600 text-xs">
            Waiting for answers...
          </div>
        )}
      </div>
    </div>
  );
}
