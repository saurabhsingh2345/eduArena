import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongoose';
import Batch from '@/lib/db/models/Batch';
import Course from '@/lib/db/models/Course';
import User from '@/lib/db/models/User';
import { notFound, redirect } from 'next/navigation';
import ImmersivePlayer from '@/components/player/ImmersivePlayer';

async function getData(batchId: string, userId: string) {
  await connectDB();
  const batch = await Batch.findById(batchId).lean();
  if (!batch) notFound();

  const [course, user] = await Promise.all([
    Course.findById(batch.courseId).lean(),
    User.findById(userId).lean(),
  ]);

  if (!course) notFound();
  return { batch, course, user };
}

export default async function LearnPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) redirect('/login');

  const { batch, course } = await getData(batchId, userId);

  // Serialize for client components
  const batchData = JSON.parse(JSON.stringify(batch));
  const courseData = JSON.parse(JSON.stringify(course));

  return (
    <ImmersivePlayer
      course={courseData}
      batch={batchData}
      userId={userId}
    />
  );
}
