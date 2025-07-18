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

  const taskId = req.query.id as string;

  if (req.method === "GET") {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== user.id) {
      return res.status(404).json({ error: "Task not found" });
    }
    return res.status(200).json(task);
  }

  if (req.method === "PUT") {
    const { title, completed, priority } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Missing title" });
    }
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { title, completed, priority },
    });
    if (updated.userId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== user.id) {
      return res.status(404).json({ error: "Task not found" });
    }
    await prisma.task.delete({ where: { id: taskId } });
    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}