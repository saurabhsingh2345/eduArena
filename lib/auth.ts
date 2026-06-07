import NextAuth, { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { connectDB } from './db/mongoose';
import User from './db/models/User';

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
      const isLearnerPath = nextUrl.pathname.startsWith('/dashboard') ||
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
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      async profile(profile) {
        await connectDB();
        let user = await User.findOne({ email: profile.email });
        if (!user) {
          user = await User.create({
            name: profile.name,
            email: profile.email,
            avatar: profile.picture ?? '',
            role: 'learner',
          });
        }
        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  session: { strategy: 'jwt' },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
