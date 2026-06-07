'use client';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: {
    xpByDay: { date: string; xp: number; events: number }[];
    interactionStats: { type: string; total: number; correct: number; rate: number }[];
    topCourses: { title: string; count: number }[];
    userGrowth: { date: string; users: number }[];
  };
}

const tooltipStyle = {
  backgroundColor: '#1E1E2E',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#F8FAFC',
};

export default function AnalyticsCharts({ data }: Props) {
  return (
    <div className="space-y-8">
      {/* XP Awarded */}
      <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">XP Awarded per Day</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.xpByDay}>
            <defs>
              <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="xp" stroke="#6366F1" fill="url(#xpGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Interaction completion rates */}
        <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Interaction Completion Rates</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.interactionStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="type" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Correct Rate']} />
              <Bar dataKey="rate" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top courses */}
        <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Most Active Courses</h2>
          {data.topCourses.length === 0 ? (
            <p className="text-slate-500 text-center py-16">No data yet</p>
          ) : (
            <div className="space-y-4">
              {data.topCourses.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm w-5">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white truncate">{c.title}</span>
                      <span className="text-xs text-slate-400 ml-2">{c.count} interactions</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        style={{ width: `${Math.min(100, (c.count / (data.topCourses[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
