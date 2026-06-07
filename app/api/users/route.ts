import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';

export async function POST(req: NextRequest) {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) {
    return Response.json({ error: 'Email already registered' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role: role ?? 'learner' });

  return Response.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  }, { status: 201 });
}

export async function GET() {
  await connectDB();
  const users = await User.find({}, { passwordHash: 0 }).lean();
  return Response.json(users);
}
