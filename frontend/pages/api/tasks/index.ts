import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  if (req.method === "GET") {
    const tasks = await prisma.task.findMany({ where: { userId: user.id } });
    return res.status(200).json(tasks);
  }

  if (req.method === "POST") {
    const { title, completed, priority } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Missing title" });
    }
    const newTask = await prisma.task.create({
      data: {
        title,
        completed: completed ?? false,
        priority: priority ?? "low",
        userId: user.id,
      },
    });
    return res.status(201).json(newTask);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}