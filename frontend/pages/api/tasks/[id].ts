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
    const { title, completed, priority } = req.body;
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
    console.log('🗑️ DELETE request for task ID:', taskId);
    console.log('🗑️ User ID:', user.id);
    
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    console.log('🗑️ Found task:', task);
    
    if (!task) {
      console.log('❌ Task not found in database');
      return res.status(404).json({ error: "Task not found" });
    }
    
    if (task.userId !== user.id) {
      console.log('❌ User ID mismatch. Task user:', task.userId, 'Current user:', user.id);
      return res.status(403).json({ error: "Forbidden" });
    }
    
    try {
      await prisma.task.delete({ where: { id: taskId } });
      console.log('✅ Task deleted from database');
      return res.status(204).end();
    } catch (error) {
      console.error('❌ Database error during delete:', error);
      return res.status(500).json({ error: "Database error during delete" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}