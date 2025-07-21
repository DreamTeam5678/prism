// pages/api/moodlog.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: 'Unauthorized' });

  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const { mood } = req.body;
  if (!mood) return res.status(400).json({ message: "Mood is required" });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ message: "User not found" });

  await prisma.moodLog.create({
    data: {
      userId: user.id,
      mood,
    },
  });

  res.status(200).json({ message: "Mood saved" });
}
