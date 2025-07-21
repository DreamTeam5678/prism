import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  const { suggestions, tasks } = req.body;

  if (!Array.isArray(suggestions) || !Array.isArray(tasks)) {
    return res.status(400).json({ message: "Suggestions and tasks must be arrays" });
  }

  try {
    const allEntries: {
      userId: string;
      title: string;
      start: Date;
      end: Date;
      source: string;
      color: string | null;
      createdAt: Date;
    }[] = [];

    const existingEvents = await prisma.calendarEvent.findMany({
      where: { userId: user.id },
      orderBy: { start: "asc" },
    });

    const getNextAvailableSlot = (durationMinutes = 60) => {
      const buffer = 5 * 60 * 1000; // 5-minute buffer
      const now = new Date();
      let candidate = new Date();
      candidate.setHours(9, 0, 0, 0); // Start at 9 AM

      for (const event of existingEvents) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        if (candidate.getTime() + durationMinutes * 60 * 1000 <= eventStart.getTime() - buffer) {
          return {
            start: new Date(candidate),
            end: new Date(candidate.getTime() + durationMinutes * 60 * 1000),
          };
        }
        candidate = new Date(Math.max(candidate.getTime(), eventEnd.getTime() + buffer));
      }

      return {
        start: new Date(candidate),
        end: new Date(candidate.getTime() + durationMinutes * 60 * 1000),
      };
    };

    for (const s of suggestions) {
      const { start, end } = getNextAvailableSlot();
      existingEvents.push({ start, end } as any); // safe-ish cast to avoid TS errors
      allEntries.push({
        userId: user.id,
        title: s.suggestionText || "Untitled Suggestion",
        start,
        end,
        source: "suggestion",
        color: "#9b87a6",
        createdAt: new Date(),
      });
    }

    for (const t of tasks) {
      const { start, end } = getNextAvailableSlot();
      existingEvents.push({ start, end } as any);
      allEntries.push({
        userId: user.id,
        title: t.title || "Task",
        start,
        end,
        source: "task",
        color: "#ebdbb4",
        createdAt: new Date(),
      });
    }

    const created = await prisma.calendarEvent.createMany({
      data: allEntries,
      skipDuplicates: true, 
    });

    return res.status(200).json({ message: "Calendar entries added", count: created.count });
  } catch (e) {
    console.error("❌ Failed to add to calendar:", e);
    return res.status(500).json({ message: "Server error" });
  }
}
