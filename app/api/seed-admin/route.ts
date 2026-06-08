import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';

export async function POST() {
  await connectDB();

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    return Response.json({ message: 'Admin already exists', email: existing.email });
  }

  const email = process.env.ADMIN_EMAIL || 'admin@eduurena.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({ name: 'Admin', email, passwordHash, role: 'admin' });

  return Response.json({ message: 'Admin created', email, password }, { status: 201 });
}
