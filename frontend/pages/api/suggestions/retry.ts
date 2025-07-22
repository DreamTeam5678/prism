// pages/api/suggestions/retry.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import moment from "moment-timezone";
import { getGPTSuggestion, getTaskSchedule } from "../../../lib/server/openaiClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "Missing suggestion ID" });

  try {
    const old = await prisma.suggestion.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ message: "Original suggestion not found" });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { userProfile: true },
    });

    const userTags = user?.userProfile?.behaviorTags || [];

    const now = new Date();
    const todayStart = new Date(now.setHours(9, 0, 0, 0));
    const todayEnd = new Date(now.setHours(21, 0, 0, 0));

    const rawConflicts = await prisma.calendarEvent.findMany({
      where: {
        user: { email: session.user.email },
        OR: [{ start: { lte: todayEnd }, end: { gte: todayStart } }],
      },
      select: { start: true, end: true },
    });

    // Convert Dates to strings for GPT input
    const calendarConflicts = rawConflicts.map((e) => ({
      start: e.start.toISOString(),
      end: e.end.toISOString(),
    }));

    // Validate and fallback for timezone
    const timeZone = old.timeZone || "America/Los_Angeles";
    const validatedTimeZone = moment.tz.names().includes(timeZone) ? timeZone : "UTC";

    const suggestions = await getGPTSuggestion({
      userTags,
      mood: old.mood ?? "Neutral",
      environment: old.environment ?? "home",
      weather: old.weather ?? "unknown",
      calendarConflicts,
      timeWindow: "today",
      timeZone: validatedTimeZone,
    });

    if (!suggestions.length) {
      return res.status(200).json({ message: "No suggestions available to retry." });
    }

    const retry = suggestions[0];

    const schedule = await getTaskSchedule({
      taskTitle: retry.task,
      priority: retry.priority,
      durationMinutes: (() => {
        const task = retry.task.toLowerCase();
        if (task.includes("walk") || task.includes("call") || task.includes("email")) return 30;
        if (task.includes("meditate") || task.includes("journal")) return 15;
        if (task.includes("brainstorm") || task.includes("read") || task.includes("design")) return 45;
        if (retry.priority === "High") return 60;
        if (retry.priority === "Medium") return 45;
        return 30;
      })(),
      mood: old.mood ?? undefined,
      events: calendarConflicts,
      timeZone: validatedTimeZone,
    });

    if (!schedule) {
      throw new Error("Could not find time slot for suggestion");
    }

    const newSuggestion = await prisma.suggestion.create({
      data: {
        userId: old.userId,
        suggestionText: retry.task,
        mood: old.mood ?? undefined,
        environment: old.environment ?? "home",
        weather: old.weather ?? "unknown",
        start: new Date(schedule.recommendedStart),
        end: new Date(schedule.recommendedEnd),
        timeZone: validatedTimeZone,
        source: "gpt",
        priority: retry.priority,
        reason: retry.reason,
        timestamp: new Date(),
      },
    });

    return res.status(200).json(newSuggestion);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("🔁 Retry failed:", message);
    return res.status(500).json({ message: "Retry failed", error: message });
  }
}
