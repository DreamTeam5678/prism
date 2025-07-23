import { NextApiRequest, NextApiResponse } from "next";
import { differenceInCalendarDays } from "date-fns";
import prisma from "../../../lib/prisma"; // Adjust path if needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { title, completed, priority } = req.body;

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: id as string },
      include: { user: true },
    });

    if (!existingTask) return res.status(404).json({ error: "Task not found" });

    const updatedTask = await prisma.task.update({
      where: { id: id as string },
      data: {
        title,
        completed,
        priority,
        updatedAt: new Date(),
      },
    });

    // If completed, update XP and streak
    if (completed && !existingTask.completed) {
      const userId = existingTask.userId;
      const user = existingTask.user;

      let xpGain = 10;
      if (priority === "high") xpGain += 10;

      let newStreak = user.streak;
      const lastDate = user.lastCompletionDate ? new Date(user.lastCompletionDate) : null;
      const today = new Date();

      if (lastDate && differenceInCalendarDays(today, lastDate) === 1) {
        newStreak += 1;
      } else if (!lastDate || differenceInCalendarDays(today, lastDate) > 1) {
        newStreak = 1;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpGain },
          streak: newStreak,
          lastCompletionDate: today,
        },
      });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    console.error("[PUT /api/tasks/[id]] Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}