export const dynamic = 'force-dynamic';
import { connectDB } from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import Link from 'next/link';
import { Plus, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CourseActions from './CourseActions';

async function getCourses() {
  await connectDB();
  return Course.find().sort({ createdAt: -1 }).lean();
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Courses</h1>
          <p className="text-slate-400 mt-1">{courses.length} courses total</p>
        </div>
        <Link href="/admin/courses/new">
          <Button variant="gradient">
            <Plus className="w-4 h-4" />
            New Course
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-4">No courses yet</p>
          <Link href="/admin/courses/new">
            <Button variant="gradient">Create your first course</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Course</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Difficulty</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, i) => (
                <tr key={course._id.toString()} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <td className="p-4">
                    <Link href={`/admin/courses/${course._id}`} className="flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600/30 to-violet-600/30 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">{course.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{course.topic}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className={`capitalize text-sm ${
                      course.difficulty === 'beginner' ? 'text-emerald-400' :
                      course.difficulty === 'intermediate' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {course.difficulty}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-sm text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {course.estimatedMinutes} min
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      course.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                      course.status === 'ready' ? 'bg-indigo-500/20 text-indigo-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <CourseActions courseId={course._id.toString()} status={course.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
