import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { getGoogleOAuthClient } from "../../../lib/google";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try{
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!token || !token.accessToken) {
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
    res.status(200).json(response.data);

    }
    catch (error) {
        console.error("Error creating calendar event:", error);
        res.status(500).json({ error: "Failed to create calendar event" });
    }
    
}   