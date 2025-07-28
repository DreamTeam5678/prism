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

  if (req.method === "PUT" || req.method === "PATCH") {
    const { title, completed, priority, completedAt } = req.body;
    console.log(`${req.method} request for task:`, taskId, { title, completed, priority });

    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        console.error("❌ Task not found");
        return res.status(404).json({ error: "Task not found" });
      }

      if (task.userId !== user.id) {
        console.error("❌ User ID mismatch:", task.userId, user.id);
        return res.status(403).json({ error: "Forbidden" });
      }

      const safeTask = task; // TypeScript-safe reference

      const updated = await prisma.task.update({
        where: { id: taskId },
        data: {
          title: title ?? safeTask.title,
          completed: typeof completed === "boolean" ? completed : safeTask.completed,
          priority: priority ?? safeTask.priority,
          completedAt:
            typeof completed === "boolean"
              ? completed
                ? completedAt
                  ? new Date(completedAt)
                  : new Date()
                : null
              : safeTask.completedAt,
        },
      });

      console.log("✅ Task updated successfully:", updated);
      return res.status(200).json(updated);
    } catch (error) {
      console.error("❌ Database error:", error);
      return res.status(500).json({ error: "Database error" });
    }
  }

  if (req.method === "DELETE") {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== user.id) {
      return res.status(404).json({ error: "Task not found" });
    }
    await prisma.task.delete({ where: { id: taskId } });
    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}