import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Batch from '@/lib/db/models/Batch';
import User from '@/lib/db/models/User';
import { notFound } from 'next/navigation';
import { Clock, Star, BookOpen, Users } from 'lucide-react';
import CourseLobby from './CourseLobby';
import { getDifficultyColor } from '@/lib/utils';

async function getData(courseId: string) {
  await connectDB();
  const [course, activeBatch] = await Promise.all([
    Course.findById(courseId).lean(),
    Batch.findOne({ courseId, status: 'active' }).lean(),
  ]);
  if (!course) notFound();
  return { course, activeBatch };
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const { course, activeBatch } = await getData(id);
  const user = await User.findById(userId).lean();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Course header */}
      <div className="bg-gradient-to-br from-indigo-900/30 to-violet-900/30 rounded-2xl border border-indigo-500/20 p-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-5">
          <BookOpen className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
        <p className="text-slate-400 text-lg mb-6">{course.description}</p>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className={`capitalize font-semibold ${getDifficultyColor(course.difficulty)}`}>{course.difficulty}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            {course.estimatedMinutes} minutes
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Star className="w-4 h-4 text-amber-400" />
            {course.interactions.length} interactive challenges
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <BookOpen className="w-4 h-4" />
            {course.script.segments.length} segments
          </div>
        </div>
      </div>

      {/* Course content preview */}
      <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">What you&apos;ll learn</h2>
        <div className="space-y-3">
          {course.script.segments.slice(0, 4).map((seg, i) => (
            <div key={seg.id} className="flex items-start gap-3 text-sm text-slate-400">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="line-clamp-2">{seg.text}</p>
            </div>
          ))}
          {course.script.segments.length > 4 && (
            <p className="text-xs text-slate-600 ml-8">+{course.script.segments.length - 4} more segments</p>
          )}
        </div>
      </div>

      {/* Batch lobby */}
      <CourseLobby
        course={JSON.parse(JSON.stringify(course))}
        activeBatch={activeBatch ? JSON.parse(JSON.stringify(activeBatch)) : null}
        userId={userId}
        userName={user?.name ?? 'Learner'}
        userAvatar={user?.avatar ?? ''}
      />
    </div>
  );
}
