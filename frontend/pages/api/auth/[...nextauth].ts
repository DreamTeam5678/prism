import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma"; 
import type { NextAuthOptions } from "next-auth";
import type { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
  }
  interface User extends DefaultUser {
    id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
  }
}
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
    async signIn({ user }) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: user.email!,
            name: user.name,
            image: user.image,
          },
        });
      }

      return true;
    },
  },
};

export default NextAuth(authOptions);
