import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { title, start, end, description, color } = req.body;

  if (!title || !start || !end) {
    return res.status(400).json({ message: "Title, start, and end are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newEvent = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title,
        start: new Date(start),
        end: new Date(end),
        source: description || "Manual",
        color: color || "#3174ad"
      }
    });

    return res.status(201).json(newEvent);
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    return res.status(500).json({ message: "Failed to create event" });
  }
}
