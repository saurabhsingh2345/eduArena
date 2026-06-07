export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import Course from '@/lib/db/models/Course';
import { getLevelFromXP, getNextLevel, getProgressToNextLevel } from '@/lib/xp';
import ProgressRing from '@/components/shared/ProgressRing';
import LevelBadge from '@/components/shared/LevelBadge';
import Link from 'next/link';
import { BookOpen, Clock, ChevronRight, Star, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDifficultyColor } from '@/lib/utils';

async function getData(userId: string) {
  await connectDB();
  const [user, courses, topLearners] = await Promise.all([
    User.findById(userId).lean(),
    Course.find({ status: 'published' }).sort({ createdAt: -1 }).lean(),
    User.find({ role: 'learner' }).sort({ xpTotal: -1 }).limit(10).lean(),
  ]);
  return { user, courses, topLearners };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const { user, courses, topLearners } = await getData(userId);
  if (!user) return null;

  const levelInfo = getLevelFromXP(user.xpTotal);
  const nextLevel = getNextLevel(user.xpTotal);
  const progress = getProgressToNextLevel(user.xpTotal);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/40 rounded-2xl border border-indigo-500/20 p-6 flex items-center gap-6">
        <ProgressRing progress={progress} size={90} strokeWidth={7}>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{levelInfo.level}</div>
          </div>
        </ProgressRing>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Welcome back, {user.name.split(' ')[0]}!</h1>
          <LevelBadge xp={user.xpTotal} className="mt-1.5" />
          <div className="text-slate-400 text-sm mt-2">
            <span className="text-indigo-400 font-semibold">{user.xpTotal.toLocaleString()} XP</span>
            {nextLevel && (
              <span> · {nextLevel.xpRequired - user.xpTotal} XP to {nextLevel.title}</span>
            )}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="text-center px-4">
            <div className="text-2xl font-bold text-white">{user.coursesCompleted.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Completed</div>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-white">Available Courses</h2>
          <span className="text-sm text-slate-400">{courses.length} courses</span>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No courses published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {courses.map((course) => (
              <Link key={course._id.toString()} href={`/course/${course._id}`} className="group">
                <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 group-hover:border-indigo-500/40 p-6 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-indigo-500/10">
                  {/* Course icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/30 to-violet-600/30 flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-indigo-400" />
                  </div>

                  <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">{course.description}</p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span className={getDifficultyColor(course.difficulty) + ' capitalize font-medium'}>{course.difficulty}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.estimatedMinutes}m
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Star className="w-3 h-3" />
                      {course.interactions.length} challenges
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{course.script.segments.length} segments</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard preview */}
      <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Global Leaderboard
          </h2>
          <Link href="/leaderboard" className="text-sm text-indigo-400 hover:text-indigo-300">View all</Link>
        </div>
        <div className="space-y-3">
          {topLearners.map((learner, i) => {
            const isMe = learner._id.toString() === userId;
            return (
              <div key={learner._id.toString()} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isMe ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-[#0F0F1A]'}`}>
                <span className={`w-7 text-center font-bold text-sm ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-600'}`}>
                  #{i + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {learner.name.charAt(0).toUpperCase()}
                </div>
                <span className={`flex-1 text-sm font-medium ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                  {learner.name} {isMe && '(you)'}
                </span>
                <span className="text-sm font-semibold text-indigo-400">{learner.xpTotal.toLocaleString()} XP</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
