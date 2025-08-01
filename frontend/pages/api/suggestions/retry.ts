// pages/api/suggestions/retry.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import moment from "moment-timezone";
import { mapTags } from '@/lib/tagEngine';
import { getGPTSuggestion } from "../../../lib/server/openaiClient";
import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: "Unauthorized" });

  const { originalSuggestion } = req.body;
  if (!originalSuggestion) return res.status(400).json({ message: "Missing original suggestion" });

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { userProfile: true },
    });
    if (!user?.userProfile) return res.status(400).json({ error: 'User profile not found' });

    const tags = mapTags({
      currentMode: user.userProfile.currentMode,
      idealSelf: user.userProfile.idealSelf,
      blockers: user.userProfile.blockers,
      dislikes: user.userProfile.dislikes,
    });

    // Get local database events
    const localEvents = await prisma.calendarEvent.findMany({
      where: { userId: user.id, start: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });

    // Get Google Calendar events
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = token?.accessToken as string | undefined;
    const googleEvents = await fetchGoogleCalendarEvents(accessToken);

    // Filter out all-day events and 0-minute events from Google events
    const validGoogleEvents = googleEvents.filter(event => {
      const duration = event.end.getTime() - event.start.getTime();
      const isZeroMinute = duration === 0;
      const isAllDay = duration >= 24 * 60 * 60 * 1000; // 24 hours or more
      return !isZeroMinute && !isAllDay;
    });

    // Filter out all-day events from local events
    const validLocalEvents = localEvents.filter(event => {
      const duration = event.end.getTime() - event.start.getTime();
      const isZeroMinute = duration === 0;
      const isAllDay = duration >= 24 * 60 * 60 * 1000; // 24 hours or more
      return !isZeroMinute && !isAllDay;
    });

    // Combine all valid events for conflict detection
    const allEvents = [...validLocalEvents, ...validGoogleEvents];

    console.log(`📊 Found ${localEvents.length} local events and ${googleEvents.length} Google events for retry`);

    const now = moment.tz(originalSuggestion.timeZone || 'America/Los_Angeles'); // Use consistent timezone
    
    // Get all scheduled tasks for today (both GPT and task bank)
    const allScheduledTasksToday = allEvents
      .filter(e => moment(e.start).isSame(now, 'day'))
      .map(e => e.title.toLowerCase());
    
    // Get GPT-specific scheduled titles for similarity filtering
    const gptScheduledTitlesToday = allEvents
      .filter(e => e.source === 'gpt' && moment(e.start).isSame(now, 'day'))
      .map(e => e.title.toLowerCase());

    const safeEvents = allEvents.map(e => ({ 
      start: e.start.toISOString(), 
      end: e.end.toISOString(),
      title: e.title || 'Untitled Event'
    }));

    // Get user history for better personalization
    const recentSuggestions = await prisma.suggestion.findMany({
      where: { 
        userId: user.id,
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    const userHistory = recentSuggestions.map(s => ({
      task: s.suggestionText,
      accepted: true, // If it's in the database, it was accepted
      timestamp: s.timestamp.toISOString()
    }));

    // Generate new suggestions with retry hint
    const suggestionsRaw = await getGPTSuggestion({
      userTags: tags,
      mood: originalSuggestion.mood || "Neutral",
      environment: originalSuggestion.environment || "home",
      weather: originalSuggestion.weather || "unknown",
      calendarConflicts: safeEvents,
      timeWindow: '8AM–12PM',
      timeZone: originalSuggestion.timeZone || 'UTC',
      avoidTitles: allScheduledTasksToday,
      userHistory,
      currentTime: new Date().toISOString(),
      retryHint: `The user rejected: "${originalSuggestion.title}". Please suggest something different.`,
    });

    if (!suggestionsRaw.length) {
      return res.status(200).json({ message: "No alternative suggestions available." });
    }

    // Filter out similar suggestions
    const filteredSuggestions = suggestionsRaw.filter(s => {
      const similarity = stringSimilarity(s.task.toLowerCase(), originalSuggestion.title.toLowerCase());
      return similarity < 0.7; // Only keep suggestions that are significantly different
    });

    if (!filteredSuggestions.length) {
      return res.status(200).json({ message: "No sufficiently different suggestions available." });
    }

    const retry = filteredSuggestions[0];
    
    // Use the original suggestion's time slot instead of finding a new one
    const originalStart = new Date(originalSuggestion.start);
    const originalEnd = new Date(originalSuggestion.end);
    
    // Validate that the original dates are valid
    if (isNaN(originalStart.getTime()) || isNaN(originalEnd.getTime())) {
      console.error('❌ Invalid original suggestion dates:', { start: originalSuggestion.start, end: originalSuggestion.end });
      return res.status(500).json({ message: "Invalid date format in original suggestion" });
    }

    // Return the new suggestion using the original time slot
    const retrySuggestion = {
      id: `retry_${Date.now()}`, // Generate a unique ID for the retry
      title: retry.task,
      start: originalStart.toISOString(),
      end: originalEnd.toISOString(),
      priority: retry.priority,
      reason: retry.reason || '',
      // Add timestamp for compatibility with frontend expectations
      timestamp: originalStart.toISOString(),
    };
    
    console.log('🔄 Retry suggestion created with original time slot:', retrySuggestion);
    return res.status(200).json(retrySuggestion);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("🔁 Retry failed:", message);
    return res.status(500).json({ message: "Retry failed", error: message });
  }
}

// Helper function to fetch Google Calendar events
async function fetchGoogleCalendarEvents(accessToken?: string) {
  if (!accessToken) {
    console.warn("⚠️ No Google access token available for retry");
    return [];
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    console.log('🔑 Using access token for retry conflict detection:', accessToken);

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
      start: new Date(event.start?.dateTime || event.start?.date || ""),
      end: new Date(event.end?.dateTime || event.end?.date || ""),
      source: "google",
    }));
  } catch (err) {
    console.error("❌ Error fetching Google events for retry:", err);
    return []; // Don't crash everything — fallback to DB events only
  }
}

// Simple string similarity function
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  const commonWords = words1.filter(w => words2.includes(w));
  
  return commonWords.length / Math.max(words1.length, words2.length);
}
