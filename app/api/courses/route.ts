import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const query: Record<string, unknown> = status ? { status } : {};
  const courses = await Course.find(query).sort({ createdAt: -1 }).lean();
  return Response.json(courses);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status } = await req.json();
  await connectDB();
  const course = await Course.findByIdAndUpdate(id, { status }, { new: true }).lean();
  if (!course) return Response.json({ error: 'Course not found' }, { status: 404 });
  return Response.json(course);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  await connectDB();
  await Course.findByIdAndDelete(id);
  return Response.json({ success: true });
}
