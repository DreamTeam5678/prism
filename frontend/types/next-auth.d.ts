import NextAuth from "next-auth";
<<<<<<< HEAD
import { JWT } from "next-auth/jwt";


declare module "next-auth" {
    interface Session {
        accessToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
    }
}
=======

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
>>>>>>> f9c6f3dc8cf439c0b082913c0e955c3c59003480
