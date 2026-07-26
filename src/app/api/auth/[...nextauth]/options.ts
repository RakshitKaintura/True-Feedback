import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

export const authOptions: NextAuthConfig = {
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email/Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await dbConnect();
        try {
          const identifier = String(credentials?.identifier ?? '');
          const password = String(credentials?.password ?? '');
          const user = await UserModel.findOne({
            $or: [
              { email: identifier },
              { username: identifier },
            ],
          });
          if (!user) {
            throw new Error('No user found with this email');
          }
          if (!user.isVerified) {
            throw new Error('Please verify your account before logging in');
          }
          if (!user.password) {
             throw new Error('This account uses Google Sign In');
          }
          const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
          );
          if (isPasswordCorrect) {
            return {
              id: user._id.toString(),
              _id: user._id.toString(),
              email: user.email,
              isVerified: user.isVerified,
              isAcceptingMessages: user.isAcceptingMessages,
              username: user.username,
            };
          }

          throw new Error('Incorrect password');
        } catch (err) {
          throw err instanceof Error ? err : new Error('Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await dbConnect();
        try {
          const existingUser = await UserModel.findOne({ email: user.email });
          if (!existingUser) {
            let baseUsername = user.email ? user.email.split('@')[0] : 'user';
            baseUsername = baseUsername.replace(/[^a-zA-Z0-9]/g, '');
            let uniqueUsername = baseUsername;
            let counter = 0;
            while (await UserModel.findOne({ username: uniqueUsername })) {
              counter++;
              uniqueUsername = `${baseUsername}${counter}`;
            }

            const newUser = new UserModel({
              email: user.email,
              username: uniqueUsername,
              isVerified: true,
              isAcceptingMessages: true,
              isOAuth: true,
              projects: [],
              messages: [],
            });
            await newUser.save();
          }
          return true;
        } catch (error) {
          console.error("Error creating Google user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'google') {
          await dbConnect();
          const dbUser = await UserModel.findOne({ email: user.email });
          if (dbUser) {
            token._id = dbUser._id.toString();
            token.isVerified = dbUser.isVerified;
            token.isAcceptingMessages = dbUser.isAcceptingMessages;
            token.username = dbUser.username;
          }
        } else {
          token._id = user._id?.toString();
          token.isVerified = user.isVerified;
          token.isAcceptingMessages = user.isAcceptingMessages;
          token.username = user.username;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.isVerified = token.isVerified;
        session.user.isAcceptingMessages = token.isAcceptingMessages;
        session.user.username = token.username;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/sign-in',
  },
};
