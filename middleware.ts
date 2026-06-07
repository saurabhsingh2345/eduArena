export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/course/:path*', '/learn/:path*', '/leaderboard/:path*'],
};
