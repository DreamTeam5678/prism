import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma"; // assuming you have this setup

export default async function handler(req, res) {
  const { userId } = getAuth(req);

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email: req.body.email,
      name: req.body.name,
    },
  });

  res.status(200).json(user);
}
