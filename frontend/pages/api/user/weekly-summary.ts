import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { startOfDay, subDays, format } from "date-fns";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  // Prepare summary for past 7 days
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, 6 - i);
    return {
      date,
      label: format(date, "EEE"), // e.g. Mon, Tue
    };
  });

  // Fetch all tasks + moods in past 7 days
  const [tasks, moods] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        completed: true,
        updatedAt: { gte: subDays(today, 6) },
      },
    }),
    prisma.moodLog.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: subDays(today, 6) },
      },
    }),
  ]);

  // Build per-day summary
  const summary = days.map(({ date, label }) => {
    const tasksCompleted = tasks.filter(
      (t) => format(t.updatedAt, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    ).length;

    const moodLogs = moods.filter(
      (m) => format(m.createdAt, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    ).length;

    return { day: label, tasksCompleted, moodLogs };
  });

  return res.status(200).json(summary);
}