'use client';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
      title="Sign out"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
