import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { role?: string; id?: string }).role = token.role as string;
        (session.user as { role?: string; id?: string }).id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminPath = nextUrl.pathname.startsWith('/admin');
      const isLearnerPath =
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/course') ||
        nextUrl.pathname.startsWith('/learn') ||
        nextUrl.pathname.startsWith('/leaderboard');

      if (isAdminPath) {
        const role = (auth?.user as { role?: string })?.role;
        return isLoggedIn && role === 'admin';
      }
      if (isLearnerPath) return isLoggedIn;
      return true;
    },
  },
  providers: [],
};
