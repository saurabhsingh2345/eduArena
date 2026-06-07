import Link from 'next/link';
import { LayoutDashboard, BookOpen, Users, BarChart2, Layers, Zap } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/batches', label: 'Live Batches', icon: Layers },
  { href: '/admin/learners', label: 'Learners', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0F0F1A]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col bg-[#0D0D1A]">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">EduArena</span>
          </Link>
          <p className="text-xs text-slate-500 mt-1 ml-10">Admin Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
            >
              <Icon className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Switch to Learner View
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
