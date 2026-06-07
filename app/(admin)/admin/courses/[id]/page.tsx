import { connectDB } from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, BookOpen, Zap, Code, AlignLeft, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function getCourse(id: string) {
  await connectDB();
  const course = await Course.findById(id).lean();
  if (!course) notFound();
  return course;
}

const typeIcons = { mcq: Grid, code: Code, fill_blank: AlignLeft, concept_match: Grid };

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourse(id);

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{course.title}</h1>
          <p className="text-slate-400 mt-0.5">{course.description}</p>
        </div>
        <span className={`text-sm px-4 py-1.5 rounded-full font-medium ${
          course.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
          course.status === 'ready' ? 'bg-indigo-500/20 text-indigo-400' :
          'bg-amber-500/20 text-amber-400'
        }`}>
          {course.status}
        </span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: BookOpen, label: 'Difficulty', value: course.difficulty },
          { icon: Clock, label: 'Duration', value: `${course.estimatedMinutes} minutes` },
          { icon: Zap, label: 'Interactions', value: `${course.interactions.length} challenges` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[#1E1E2E] rounded-xl border border-white/10 p-4 flex items-center gap-3">
            <Icon className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-xs text-slate-500">{label}</div>
              <div className="font-semibold text-white capitalize">{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Segments */}
        <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Script Segments <span className="text-slate-500 font-normal text-sm">({course.script.segments.length})</span>
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {course.script.segments.map((seg, i) => (
              <div key={seg.id} className="p-3 bg-[#0F0F1A] rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-mono">Segment {i + 1}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">{seg.animationStyle}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{seg.text}</p>
                {seg.emphasis.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {seg.emphasis.map((w) => (
                      <span key={w} className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded">{w}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Interactions */}
        <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Interactions <span className="text-slate-500 font-normal text-sm">({course.interactions.length})</span>
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {course.interactions.map((interaction) => {
              const Icon = typeIcons[interaction.type as keyof typeof typeIcons] ?? Zap;
              return (
                <div key={interaction.id} className="p-3 bg-[#0F0F1A] rounded-xl border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-medium text-white capitalize">{interaction.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400">+{interaction.xpReward} XP</span>
                      <span className="text-xs text-slate-500">{interaction.timeLimit}s</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">After: {interaction.afterSegmentId}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
