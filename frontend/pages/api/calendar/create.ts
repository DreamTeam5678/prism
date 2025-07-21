import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { getGoogleOAuthClient } from "../../../lib/google";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.accessToken || !token.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const calendar = getGoogleOAuthClient(token.accessToken);

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: "Task 1",
        description: "Do this now",
        start: {
          dateTime: "2025-07-10T14:00:00-07:00",
        },
        end: {
          dateTime: "2025-07-10T15:00:00-07:00",
        },
      },
    });

    const event = response.data;

    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (user) {
      await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: event.summary || "Untitled",
          start: new Date(event.start?.dateTime || event.start?.date || ""),
          end: new Date(event.end?.dateTime || event.end?.date || ""),
          source: "google",
          color: "#d0e4ec", // consistent color for Google events
        },
      });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("❌ Error creating calendar event:", error);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
}
