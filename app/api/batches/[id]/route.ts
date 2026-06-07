import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Batch from '@/lib/db/models/Batch';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const batch = await Batch.findById(id).lean();
  if (!batch) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(batch);
}
