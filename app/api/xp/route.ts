import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import XPEvent from '@/lib/db/models/XPEvent';
import { getLevelFromXP } from '@/lib/xp';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, amount, reason, batchId, courseId } = await req.json();
  if (!userId || !amount) return Response.json({ error: 'Missing fields' }, { status: 400 });

  await connectDB();
  await XPEvent.create({ userId, amount, reason, batchId, courseId });

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { xpTotal: amount } },
    { new: true }
  );
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  const levelInfo = getLevelFromXP(user.xpTotal);
  const leveledUp = levelInfo.level > user.level;
  if (leveledUp) {
    await User.findByIdAndUpdate(userId, { level: levelInfo.level });
  }

  return Response.json({
    xpTotal: user.xpTotal,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    leveledUp,
  });
}
