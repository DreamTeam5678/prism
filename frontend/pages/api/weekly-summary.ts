import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { startOfDay, subDays, format } from "date-fns";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  try {
    const today = startOfDay(new Date());

    const data = await Promise.all(
      [...Array(7).keys()].map(async (i) => {
        const date = subDays(today, i);
        const nextDate = subDays(today, i - 1);

        const completedTasks = await prisma.task.count({
          where: {
            userId: user.id,
            completed: true,
            timestamp: {
              gte: date,
              lt: nextDate,
            },
          },
        });

        return {
          date: format(date, "EEE"), // e.g., "Mon", "Tue"
          completedCount: completedTasks,
        };
      })
    );

    res.status(200).json(data.reverse()); // Show oldest to newest
  } catch (error) {
    console.error("❌ Weekly summary fetch error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}