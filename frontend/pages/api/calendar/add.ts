// pages/api/calendar/add.ts
/*
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/prisma";
import { inferDuration } from '@/lib/utils/inferDuration';

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

    const getNextAvailableSlot = (
      existingEvents: { start: Date; end: Date }[],
      durationMinutes: number,
      priority: "High" | "Medium" | "Low"
    ): { start: Date; end: Date } | null => {
      const bufferMs = 5 * 60 * 1000;
      const now = new Date();

      const dayStart = new Date();
      dayStart.setHours(8, 0, 0, 0);

      const dayEnd = new Date();
      dayEnd.setHours(21, 0, 0, 0);

      // Clamp earliest candidate start time based on priority
      let candidate = new Date(Math.max(dayStart.getTime(), now.getTime() + 15 * 60 * 1000)); // 15-min prep buffer

      // Prioritize high priority tasks earlier in the day
      if (priority === "High") {
        candidate.setHours(8, 0, 0, 0);
      } else if (priority === "Medium") {
        candidate.setHours(10, 0, 0, 0);
      } else {
        candidate.setHours(13, 0, 0, 0); // Low priority: start looking mid-day
      }

      const latestStart = new Date(dayEnd.getTime() - durationMinutes * 60 * 1000);

      // Sort events by start time
      const sortedEvents = [...existingEvents].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      while (candidate <= latestStart) {
        let hasConflict = false;

        for (const event of sortedEvents) {
          const eventStart = new Date(event.start).getTime();
          const eventEnd = new Date(event.end).getTime();
          const candidateStart = candidate.getTime();
          const candidateEnd = candidateStart + durationMinutes * 60 * 1000;

          if (candidateEnd + bufferMs > eventStart && candidateStart < eventEnd + bufferMs) {
            candidate = new Date(Math.max(candidateEnd + bufferMs, eventEnd + bufferMs));
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict && candidate <= latestStart) {
          return {
            start: new Date(candidate),
            end: new Date(candidate.getTime() + durationMinutes * 60 * 1000),
          };
        }
      }

      return null; // No slot found
    };

  const getPriority = (suggestion: any): "High" | "Medium" | "Low" => {
    if (suggestion.priority === "High") return "High";
    if (suggestion.priority === "Medium") return "Medium";
    return "Low";
  };

    // Get all today's calendar event titles for this user
    const calendarTitlesToday = existingEvents
      .filter(e => {
        const eventDate = new Date(e.start).toDateString();
        return eventDate === new Date().toDateString();
      })
      .map(e => e.title?.toLowerCase());


    for (const t of tasks) {
      const normalizedTitle = (t.title || "").toLowerCase();
      if (calendarTitlesToday.includes(normalizedTitle)) continue;
      const priority = t.priority || "Medium";
      const duration = inferDuration(t.title, priority);
      const slot = getNextAvailableSlot(existingEvents, duration, priority as "High" | "Medium" | "Low");

      if (!slot) continue;

      existingEvents.push({ start: slot.start, end: slot.end } as any);
      allEntries.push({
        userId: user.id,
        title: t.title || "Task",
        start: slot.start,
        end: slot.end,
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
*/
// pages/api/calendar/add.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/prisma";
import { inferDuration } from '@/lib/utils/inferDuration';

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

    const getNextAvailableSlot = (
      existingEvents: { start: Date; end: Date }[],
      durationMinutes: number,
      priority: "High" | "Medium" | "Low"
    ): { start: Date; end: Date } | null => {
      const bufferMs = 30 * 60 * 1000; // 30-minute buffer
      const now = new Date();

      const dayStart = new Date();
      dayStart.setHours(8, 0, 0, 0);

      const dayEnd = new Date();
      dayEnd.setHours(21, 0, 0, 0);

      // Adjust candidate start time based on priority
      let candidate = new Date(Math.max(dayStart.getTime(), now.getTime() + bufferMs));
      if (priority === "High") {
        candidate.setHours(8, 0, 0, 0); // High-priority tasks start early
      } else if (priority === "Medium") {
        candidate.setHours(10, 0, 0, 0);
      } else {
        candidate.setHours(13, 0, 0, 0);
      }

      const latestStart = new Date(dayEnd.getTime() - durationMinutes * 60 * 1000);

      const sortedEvents = [...existingEvents].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      while (candidate <= latestStart) {
        let hasConflict = false;

        for (const event of sortedEvents) {
          const eventStart = new Date(event.start).getTime();
          const eventEnd = new Date(event.end).getTime();
          const candidateStart = candidate.getTime();
          const candidateEnd = candidateStart + durationMinutes * 60 * 1000;

          // Check for conflicts with 30-minute buffer
          if (candidateEnd + bufferMs > eventStart && candidateStart < eventEnd + bufferMs) {
            candidate = new Date(Math.max(candidateEnd + bufferMs, eventEnd + bufferMs));
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict && candidate <= latestStart) {
          return {
            start: new Date(candidate),
            end: new Date(candidate.getTime() + durationMinutes * 60 * 1000),
          };
        }
      }

      return null;
    };

    const getPriority = (item: { priority?: string }): "High" | "Medium" | "Low" => {
      if (item.priority === "High") return "High";
      if (item.priority === "Medium") return "Medium";
      return "Low";
    };

    // Sort tasks by priority (High > Medium > Low)
    const sortedTasks = [...tasks].sort((a: { priority?: string }, b: { priority?: string }) => {
      const priorityOrder: { [key: string]: number } = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority || "Low"] - priorityOrder[a.priority || "Low"];
    });

    // Sort suggestions by priority
    const sortedSuggestions = [...suggestions].sort((a: { priority?: string }, b: { priority?: string }) => {
      const priorityOrder: { [key: string]: number } = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority || "Low"] - priorityOrder[a.priority || "Low"];
    });

    // Get all today's calendar event titles
    const calendarTitlesToday = existingEvents
      .filter((e: { start: Date }) => new Date(e.start).toDateString() === new Date().toDateString())
      .map((e: { title?: string }) => e.title?.toLowerCase() || "");

    // Schedule task bank tasks first
    for (const t of sortedTasks) {
      const normalizedTitle = (t.title || "").toLowerCase();
      if (calendarTitlesToday.includes(normalizedTitle)) continue;
      const priority = getPriority(t);
      const duration = inferDuration(t.title, priority);
      const slot = getNextAvailableSlot(existingEvents, duration, priority);

      if (!slot) continue;

      existingEvents.push({ start: slot.start, end: slot.end });
      allEntries.push({
        userId: user.id,
        title: t.title || "Task",
        start: slot.start,
        end: slot.end,
        source: "task",
        color: "#ebdbb4",
        createdAt: new Date(),
      });
    }

    // Then schedule GPT suggestions
    for (const s of sortedSuggestions) {
      const normalizedTitle = (s.task || "").toLowerCase();
      if (calendarTitlesToday.includes(normalizedTitle)) continue;
      const priority = getPriority(s);
      const duration = inferDuration(s.task, priority);
      const slot = getNextAvailableSlot(existingEvents, duration, priority);

      if (!slot) continue;

      existingEvents.push({ start: slot.start, end: slot.end });
      allEntries.push({
        userId: user.id,
        title: s.task || "Suggestion",
        start: slot.start,
        end: slot.end,
        source: "gpt",
        color: "#9b87a6",
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