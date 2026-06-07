export const dynamic = 'force-dynamic';
import { connectDB } from '@/lib/db/mongoose';
import XPEvent from '@/lib/db/models/XPEvent';
import InteractionModel from '@/lib/db/models/Interaction';
import Course from '@/lib/db/models/Course';
import User from '@/lib/db/models/User';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';

async function getAnalyticsData() {
  await connectDB();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [xpByDay, interactionStats, topCourses, userGrowth] = await Promise.all([
    XPEvent.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    InteractionModel.aggregate([
      { $group: { _id: '$type', total: { $sum: 1 }, correct: { $sum: { $cond: ['$isCorrect', 1, 0] } } } },
    ]),
    InteractionModel.aggregate([
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      { $project: { title: '$course.title', count: 1 } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, role: 'learner' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    xpByDay: xpByDay.map((d) => ({ date: d._id, xp: d.total, events: d.count })),
    interactionStats: interactionStats.map((d) => ({
      type: d._id,
      total: d.total,
      correct: d.correct,
      rate: d.total ? Math.round((d.correct / d.total) * 100) : 0,
    })),
    topCourses: topCourses.map((d) => ({ title: d.title, count: d.count })),
    userGrowth: userGrowth.map((d) => ({ date: d._id, users: d.count })),
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 mt-1">Platform performance — last 7 days</p>
      </div>
      <AnalyticsCharts data={data} />
    </div>
  );
}
