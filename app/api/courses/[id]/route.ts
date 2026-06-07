import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Course from '@/lib/db/models/Course';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const course = await Course.findById(id).lean();
  if (!course) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(course);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  await connectDB();
  const course = await Course.findByIdAndUpdate(id, body, { new: true }).lean();
  if (!course) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(course);
}
