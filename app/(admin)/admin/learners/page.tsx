export const dynamic = 'force-dynamic';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { getLevelFromXP } from '@/lib/xp';
import { getInitials, formatNumber } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Users } from 'lucide-react';

async function getLearners() {
  await connectDB();
  return User.find({ role: 'learner' }).sort({ xpTotal: -1 }).lean();
}

export default async function LearnersPage() {
  const learners = await getLearners();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Learners</h1>
        <p className="text-slate-400 mt-1">{learners.length} registered learners</p>
      </div>

      <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 overflow-hidden">
        {learners.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No learners yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Learner</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Level</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Total XP</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Courses</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((learner, i) => {
                const level = getLevelFromXP(learner.xpTotal);
                const initials = getInitials(learner.name);
                return (
                  <tr key={learner._id.toString()} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-white">{learner.name}</div>
                          <div className="text-xs text-slate-500">{learner.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 font-medium">
                        Lv.{level.level} {level.title}
                      </span>
                    </td>
                    <td className="p-4 text-white font-semibold">{formatNumber(learner.xpTotal)}</td>
                    <td className="p-4 text-slate-400">{learner.coursesCompleted.length}</td>
                    <td className="p-4 text-xs text-slate-500">
                      {formatDistanceToNow(new Date(learner.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
