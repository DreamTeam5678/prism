// pages/api/calendar/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from '@/lib/prisma';
import { google } from "googleapis";
import { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";



type CalendarEvent = Awaited<ReturnType<typeof prisma.calendarEvent.findMany>>[number];


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) return res.status(401).json({ message: "Unauthorized" });
  const accessToken = token.accessToken as string | undefined;


  try {
    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // --- Get local DB events
    const rawLocalEvents = await prisma.calendarEvent.findMany({
        where: { userId: user.id },
        orderBy: { start: "asc" },
    });


    const localEvents = rawLocalEvents.flatMap((event: CalendarEvent) => {
  // Check if title contains multiple time blocks (heuristic: contains "AM" or "PM" more than once)
        const timeBlockPattern = /(\d{1,2}:\d{2} [AP]M) ?– ?(\d{1,2}:\d{2} [AP]M)/g;
        const matches = [...(event.title?.matchAll(timeBlockPattern) || [])];

        if (matches.length > 1 && event.source !== "gpt") {
            // Split into separate events
            return matches.map((match, index) => {
            const [ , startStr, endStr ] = match;
            const baseDate = new Date(event.start).toISOString().split('T')[0]; // Get date only
            const parseTime = (t: string) => new Date(`${baseDate} ${t}`);
            return {
                id: `${event.id}-${index}`,
                title: event.title ?? "Block",
                start: parseTime(startStr),
                end: parseTime(endStr),
                source: event.source || "local",
                color: event.color ?? (event.source === "gpt"
                  ? "#9b87a6"
                  : event.source === "task_bank"
                    ? "#ebdbb4"
                    : "#dddddd")
            };
            });
        }

        // Default: single event
        return [{
            id: event.id,
            title: event.title || "No Title",
            start: event.start,
            end: event.end,
            source: event.source || "local",
            color: event.color || (event.source === "gpt" ? "#9b87a6" : "#ebdbb4"),
        }];
    });



    // --- Get Google Calendar events
    const googleEvents = await fetchGoogleCalendarEvents(accessToken);

    // --- Merge both sets
    const allEvents = [...googleEvents, ...localEvents];

    return res.status(200).json(allEvents);
  } catch (err) {
    console.error("❌ Error in /api/calendar/list:", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
}

async function fetchGoogleCalendarEvents(accessToken?: string) {
  if (!accessToken) {
    console.warn("⚠️ No Google access token available");
    return [];
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    console.log('🔑 Using access token:', accessToken);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    return (response.data.items || []).map((event) => ({
      id: event.id,
      title: event.summary || "Untitled",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      source: "google",
    }));
  } catch (error: any) {
    console.error("❌ Error fetching Google events:", error);
    
    // Check if it's an authentication error
    if (error.message && error.message.includes('invalid authentication credentials')) {
      console.warn("🔐 Google Calendar authentication expired - user needs to re-authenticate");
      // Return empty array but don't throw - let the app continue with local events
      return [];
    }
    
    // For other errors, still return empty array but log the error
    console.error("❌ Unexpected error fetching Google Calendar events:", error);
    return [];
  }
}
