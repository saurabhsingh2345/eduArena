import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { connectDB } from './db/mongoose';
import User from './db/models/User';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
});
