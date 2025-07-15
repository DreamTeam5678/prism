import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from "../../../lib/prisma"; 
console.log("🧠 PRISMA CLIENT:", typeof prisma?.$connect === 'function' ? '✅ READY' : '❌ BROKEN');
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { google } from 'googleapis';
import NextAuth from 'next-auth';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'openid email profile https://www.googleapis.com/auth/calendar',
                },
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, user, account }) {
            // If user just signed in
            if (user) {
            token.id = user.id; // 👈 attach user id from DB
            }
            if (account) {
            token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.id) {
            session.user.id = token.id as string; // 👈 make sure it's typed as string
            }
            if (token?.accessToken) {
            session.accessToken = token.accessToken as string;
            }
            return session;
        },
    }
};

export default NextAuth(authOptions);
