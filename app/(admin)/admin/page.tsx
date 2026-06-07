export const dynamic = 'force-dynamic';
import { connectDB } from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Batch from '@/lib/db/models/Batch';
import User from '@/lib/db/models/User';
import XPEvent from '@/lib/db/models/XPEvent';
import { BookOpen, Users, Layers, Star, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';

async function getStats() {
  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalCourses, activeBatches, totalLearners, xpToday] = await Promise.all([
    Course.countDocuments(),
    Batch.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'learner' }),
    XPEvent.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return {
    totalCourses,
    activeBatches,
    totalLearners,
    xpToday: xpToday[0]?.total ?? 0,
  };
}

async function getRecentCourses() {
  await connectDB();
  return Course.find().sort({ createdAt: -1 }).limit(5).lean();
}

export default async function AdminDashboard() {
  const [stats, recentCourses] = await Promise.all([getStats(), getRecentCourses()]);

  const statCards = [
    { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Active Batches', value: stats.activeBatches, icon: Layers, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Total Learners', value: stats.totalLearners, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'XP Awarded Today', value: formatNumber(stats.xpToday), icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back, Admin</p>
        </div>
        <Link href="/admin/courses/new">
          <Button variant="gradient" size="lg">
            <Plus className="w-4 h-4" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent courses */}
      <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Courses</h2>
          <Link href="/admin/courses" className="text-sm text-indigo-400 hover:text-indigo-300">
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {recentCourses.length === 0 && (
            <p className="text-slate-500 text-center py-8">No courses yet. Create your first one!</p>
          )}
          {recentCourses.map((course) => (
            <Link
              key={course._id.toString()}
              href={`/admin/courses/${course._id}`}
              className="flex items-center justify-between p-4 bg-[#0F0F1A] rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600/30 to-violet-600/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">{course.title}</div>
                  <div className="text-xs text-slate-500">{course.difficulty} · {course.estimatedMinutes} min</div>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                course.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                course.status === 'ready' ? 'bg-indigo-500/20 text-indigo-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {course.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
