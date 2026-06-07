import { connectDB } from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import { generateCourseContent } from '@/lib/groq';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { topic, difficulty, durationMinutes } = await req.json();
  if (!topic || !difficulty || !durationMinutes) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  (async () => {
    try {
      await send({ status: 'generating', message: 'Connecting to AI...' });

      const userId = (session.user as { id?: string }).id;
      await connectDB();

      // Create placeholder course first
      const course = await Course.create({
        title: `Generating: ${topic}`,
        topic,
        description: '',
        difficulty,
        estimatedMinutes: durationMinutes,
        status: 'generating',
        script: { segments: [] },
        interactions: [],
        createdBy: userId,
      });

      await send({ status: 'generating', message: 'Crafting your course with AI...', courseId: course._id.toString() });

      const courseData = await generateCourseContent(topic, difficulty, durationMinutes);

      await send({ status: 'processing', message: `Script generated — ${courseData.segments?.length ?? 0} segments` });

      // Compute cumulative start/end times
      let cumTime = 0;
      const segments = (courseData.segments ?? []).map((seg: { id: string; text: string; animationStyle: string; emphasis: string[]; durationSeconds: number }) => {
        const startTime = cumTime;
        cumTime += seg.durationSeconds ?? 15;
        return { ...seg, startTime, endTime: cumTime };
      });

      await send({ status: 'processing', message: `${courseData.interactions?.length ?? 0} interactions created` });

      await Course.findByIdAndUpdate(course._id, {
        title: courseData.title,
        description: courseData.description,
        status: 'ready',
        script: { segments },
        interactions: courseData.interactions ?? [],
      });

      await send({ status: 'complete', message: 'Course ready!', courseId: course._id.toString() });
    } catch (err) {
      await send({ status: 'error', message: String(err) });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
