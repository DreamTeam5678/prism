import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { getGoogleOAuthClient } from "../../../lib/google";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const token = await getToken({ req });
        const calendar = getGoogleOAuthClient(token?.accessToken || "");

        if (!token || !token.accessToken) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
        });
        
        res.status(200).json(response.data.items);
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        res.status(500).json({ error: "Failed to fetch calendar events" });
    }
}   

