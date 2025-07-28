import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { eventId, start, end, title, description, color } = req.body;

  if (!eventId) {
    return res.status(400).json({ message: "Event ID is required" });
  }

  try {
    console.log("Update request received:", { eventId, start, end, title, description, color });
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.log("User not found for email:", session.user.email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Found user:", user.id);

    const updateData: any = {};
    
    if (start) updateData.start = new Date(start);
    if (end) updateData.end = new Date(end);
    if (title) updateData.title = title;
    if (description) updateData.source = description;
    if (color) updateData.color = color;

    console.log("Update data:", updateData);

    // First check if the event exists
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      console.log("Event not found with ID:", eventId);
      return res.status(404).json({ message: "Event not found" });
    }

    console.log("Found existing event:", existingEvent);

    const updatedEvent = await prisma.calendarEvent.update({
      where: {
        id: eventId,
        userId: user.id
      },
      data: updateData
    });

    console.log("Successfully updated event:", updatedEvent);
    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Failed to update calendar event:", error);
    return res.status(500).json({ 
      message: "Failed to update event", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 