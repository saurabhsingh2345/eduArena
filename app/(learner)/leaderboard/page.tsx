export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { getLevelFromXP } from '@/lib/xp';
import { Trophy } from 'lucide-react';
import { formatNumber, getInitials } from '@/lib/utils';

async function getLeaderboard() {
  await connectDB();
  return User.find({ role: 'learner' }).sort({ xpTotal: -1 }).limit(100).lean();
}

export default async function LeaderboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const learners = await getLeaderboard();

  const myRank = learners.findIndex((l) => l._id.toString() === userId) + 1;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="w-8 h-8 text-amber-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Global Leaderboard</h1>
          <p className="text-slate-400">All-time top learners</p>
        </div>
      </div>

      {myRank > 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-indigo-300 text-sm">Your rank</span>
          <span className="text-2xl font-bold text-indigo-400">#{myRank}</span>
        </div>
      )}

      <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 overflow-hidden">
        {learners.map((learner, i) => {
          const isMe = learner._id.toString() === userId;
          const level = getLevelFromXP(learner.xpTotal);
          const initials = getInitials(learner.name);

          return (
            <div
              key={learner._id.toString()}
              className={`flex items-center gap-4 p-4 border-b border-white/5 last:border-0 transition-colors ${
                isMe ? 'bg-indigo-500/10' : i % 2 === 0 ? '' : 'bg-white/[0.02]'
              }`}
            >
              {/* Rank */}
              <div className={`w-8 text-center font-bold text-sm flex-shrink-0 ${
                i === 0 ? 'text-amber-400' :
                i === 1 ? 'text-slate-300' :
                i === 2 ? 'text-amber-600' :
                'text-slate-600'
              }`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {initials}
              </div>

              {/* Name + level */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                  {learner.name} {isMe && <span className="text-xs text-indigo-400">(you)</span>}
                </div>
                <div className="text-xs text-slate-500">Lv.{level.level} {level.title}</div>
              </div>

              {/* XP */}
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-indigo-400">{formatNumber(learner.xpTotal)}</div>
                <div className="text-xs text-slate-500">XP</div>
              </div>
            </div>
          );
        })}

        {learners.length === 0 && (
          <div className="text-center py-16 text-slate-400">No learners yet. Be the first!</div>
        )}
      </div>
    </div>
  );
}
