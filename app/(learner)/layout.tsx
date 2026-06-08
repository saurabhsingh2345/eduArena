import Link from 'next/link';
import { auth } from '@/lib/auth';
import { LayoutDashboard, Trophy, Zap } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import LogoutButton from '@/components/shared/LogoutButton';

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const initials = user?.name ? getInitials(user.name) : '?';

  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      {/* Top nav */}
      <header className="border-b border-white/10 bg-[#0D0D1A]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">EduArena</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link href="/leaderboard" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {user?.name && (
              <span className="hidden md:block text-sm text-slate-400 max-w-[120px] truncate">
                {user.name}
              </span>
            )}
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              title={user?.name ?? ''}
            >
              {initials}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
