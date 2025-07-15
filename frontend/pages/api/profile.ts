// frontend/pages/api/profile.ts

import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "../../lib/prisma"; // 
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { userProfile: true },
    });

    if (!user || !user.userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }
    
    

    res.status(200).json(user.userProfile);
  } catch (err) {
    console.error("[API /profile]", err);
    res.status(500).json({ message: "Server error" });
  }
}
