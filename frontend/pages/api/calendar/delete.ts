import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { getGoogleOAuthClient } from "../../../lib/google";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try{
        const { eventId } = req.query;
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!token || !token.accessToken) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const calendar = getGoogleOAuthClient(token.accessToken);
        await calendar.events.delete({
            calendarId: "primary",
            eventId: String(eventId),
        });
        res.status(200).json({success: true, message: "Event deleted successfully"});

    }
    catch (error) {
        console.error("Error creating calendar event:", error);
        res.status(500).json({ error: "Failed to create calendar event" });
    }
    
}   