export const dynamic = 'force-dynamic';
import { connectDB } from '@/lib/db/mongoose';
import Batch from '@/lib/db/models/Batch';
import Course from '@/lib/db/models/Course';
import { Layers, Users, Clock, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

async function getData() {
  await connectDB();
  const [activeBatches, recentBatches] = await Promise.all([
    Batch.find({ status: 'active' }).populate('courseId', 'title').sort({ startTime: -1 }).lean(),
    Batch.find({ status: { $in: ['completed', 'waiting'] } }).populate('courseId', 'title').sort({ startTime: -1 }).limit(20).lean(),
  ]);
  return { activeBatches, recentBatches };
}

export default async function BatchesPage() {
  const { activeBatches, recentBatches } = await getData();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Live Batches</h1>
        <p className="text-slate-400 mt-1">Monitor active learning sessions in real time</p>
      </div>

      {/* Active batches */}
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Active Now ({activeBatches.length})
      </h2>

      {activeBatches.length === 0 ? (
        <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-12 text-center mb-8">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No active batches right now</p>
          <p className="text-slate-500 text-sm mt-1">Batches start automatically every 5 minutes when learners are waiting</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          {activeBatches.map((batch) => (
            <div key={batch._id.toString()} className="bg-[#1E1E2E] rounded-2xl border border-emerald-500/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-emerald-400 font-medium mb-1">LIVE</div>
                  <div className="font-semibold text-white">
                    {(batch.courseId as { title?: string })?.title ?? 'Unknown Course'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Batch #{batch.batchNumber}</div>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0F0F1A] rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Users className="w-3.5 h-3.5" />
                    Learners
                  </div>
                  <div className="text-xl font-bold text-white">{batch.learners.length}</div>
                </div>
                <div className="bg-[#0F0F1A] rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    Running
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {formatDistanceToNow(new Date(batch.startTime), { addSuffix: false })}
                  </div>
                </div>
              </div>

              {/* Mini leaderboard */}
              {batch.leaderboard.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-slate-500 font-medium">Top Learners</div>
                  {batch.leaderboard.slice(0, 3).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-4">#{i + 1}</span>
                        <span className="text-sm text-white">{entry.name}</span>
                      </div>
                      <span className="text-xs text-indigo-400 font-semibold">{entry.xp} XP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent batches */}
      <h2 className="text-lg font-semibold text-white mb-4">Recent Batches</h2>
      <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Course</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Batch</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Learners</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Started</th>
            </tr>
          </thead>
          <tbody>
            {recentBatches.map((batch) => (
              <tr key={batch._id.toString()} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-4 text-sm text-white">{(batch.courseId as { title?: string })?.title ?? '—'}</td>
                <td className="p-4 text-sm text-slate-400">#{batch.batchNumber}</td>
                <td className="p-4 text-sm text-white">{batch.learners.length}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    batch.status === 'completed' ? 'bg-slate-500/20 text-slate-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>{batch.status}</span>
                </td>
                <td className="p-4 text-xs text-slate-500">
                  {formatDistanceToNow(new Date(batch.startTime), { addSuffix: true })}
                </td>
              </tr>
            ))}
            {recentBatches.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No batch history yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
