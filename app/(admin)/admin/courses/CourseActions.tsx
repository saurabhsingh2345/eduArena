'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Trash2, Globe, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  courseId: string;
  status: string;
}

export default function CourseActions({ courseId, status }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const publish = async () => {
    setLoading(true);
    await fetch('/api/courses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: courseId, status: status === 'published' ? 'ready' : 'published' }),
    });
    router.refresh();
    setLoading(false);
  };

  const deleteCourse = async () => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    setLoading(true);
    await fetch(`/api/courses?id=${courseId}`, { method: 'DELETE' });
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Link href={`/admin/courses/${courseId}`}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="w-3.5 h-3.5" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${status === 'published' ? 'text-amber-400' : 'text-emerald-400'}`}
        onClick={publish}
        disabled={loading || status === 'generating'}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={deleteCourse} disabled={loading}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
