// pages/api/suggestions/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import moment from 'moment-timezone';
import { mapTags } from '@/lib/tagEngine';
import { getGPTSuggestion, getTaskSchedule } from '../../../lib/server/openaiClient';
import { inferDuration } from '@/lib/utils/inferDuration';
import crypto from 'crypto';
import stringSimilarity from 'string-similarity';
import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { mood, location, weather, timeZone } = req.body;
  if (!mood || !location || !weather || !timeZone) return res.status(400).json({ error: 'Missing fields' });

  const validatedTimeZone = moment.tz.names().includes(timeZone) ? timeZone : 'UTC';
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: 'Unauthorized' });

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

  // Combine all events for conflict detection
  const allEvents = [...localEvents, ...googleEvents];

  console.log(`📊 Found ${localEvents.length} local events and ${googleEvents.length} Google events for user`);
  console.log(`📅 All events:`, allEvents.map(e => `${e.title} (${e.start.toLocaleTimeString()}-${e.end.toLocaleTimeString()}) [${e.source}]`));

  const now = moment.tz(validatedTimeZone);
  
  // Get all scheduled tasks for today (both GPT and task bank)
  const allScheduledTasksToday = allEvents
    .filter(e => moment(e.start).isSame(now, 'day'))
    .map(e => e.title.toLowerCase());
  
  // Get GPT-specific scheduled titles for similarity filtering
  const gptScheduledTitlesToday = allEvents
    .filter(e => e.source === 'gpt' && moment(e.start).isSame(now, 'day'))
    .map(e => e.title.toLowerCase());

  const safeEvents = allEvents.map(e => ({ start: e.start.toISOString(), end: e.end.toISOString() }));

  // Get user history for better personalization
  const recentSuggestions = await prisma.suggestion.findMany({
    where: { 
      userId: user.id,
      timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    },
    orderBy: { timestamp: 'desc' },
    take: 20
  });

  const userHistory = recentSuggestions.map((s: { suggestionText: string; timestamp: Date }) => ({
    task: s.suggestionText,
    accepted: true,
    timestamp: s.timestamp.toISOString(),
  }));

  const suggestionsRaw = await getGPTSuggestion({
    userTags: tags,
    mood,
    environment: location,
    weather,
    calendarConflicts: safeEvents,
    timeWindow: '8AM–10PM',
    timeZone: validatedTimeZone,
    avoidTitles: allScheduledTasksToday, // Avoid ALL scheduled tasks, not just GPT ones
    userHistory,
    currentTime: new Date().toISOString(),
  });

  // Backend-side similarity filtering
  function filterSimilarSuggestions(suggestions: { task: string; priority: string; reason?: string }[], alreadyScheduledTitles: string[]): { task: string; priority: string; reason?: string }[] {
    const unique: { task: string; priority: string; reason?: string }[] = [];
    for (const s of suggestions) {
      // Check against already scheduled
      if (alreadyScheduledTitles.some((title: string) => stringSimilarity.compareTwoStrings(s.task, title) > 0.8)) {
        continue;
      }
      // Check against already accepted in this batch
      if (unique.some((u: { task: string; priority: string; reason?: string }) => stringSimilarity.compareTwoStrings(s.task, u.task) > 0.8)) {
        continue;
      }
      unique.push(s);
    }
    return unique;
  }

  const suggestions = filterSimilarSuggestions(suggestionsRaw, gptScheduledTitlesToday);

  // Get unscheduled task bank tasks
  const taskBankTasks = await prisma.task.findMany({
    where: { userId: user.id, scheduled: false, completed: false },
  });

  console.log(`📋 Found ${taskBankTasks.length} unscheduled task bank tasks:`, taskBankTasks.map(t => `${t.title} (${t.priority})`));

  // Calculate estimated time needed for task bank tasks
  const taskBankTimeNeeded = taskBankTasks.reduce((total, task) => {
    const duration = inferDuration(task.title, task.priority);
    return total + duration;
  }, 0);

  // Calculate available time today (8AM-10PM = 14 hours = 840 minutes)
  const totalAvailableTime = 14 * 60; // 840 minutes
  const todayEvents = allEvents.filter((e: any) => {
    const eventDate = moment(e.start).tz(validatedTimeZone);
    const today = moment.tz(validatedTimeZone).startOf('day');
    return eventDate.isSame(today, 'day');
  });
  
  const existingEventTime = todayEvents.reduce((total, event) => {
    const start = moment(event.start);
    const end = moment(event.end);
    const duration = end.diff(start, 'minutes');
    return total + duration;
  }, 0);

  const remainingTime = totalAvailableTime - existingEventTime - taskBankTimeNeeded;
  
  console.log(`📊 Time analysis: ${totalAvailableTime}min total, ${existingEventTime}min existing events, ${taskBankTimeNeeded}min task bank tasks, ${remainingTime}min remaining`);

  // Limit GPT suggestions based on available space and number of task bank tasks
  let maxGptSuggestions = 3; // Default max
  
  // If there are many task bank tasks, limit GPT suggestions more aggressively
  if (taskBankTasks.length >= 4) {
    maxGptSuggestions = 1; // Only 1 GPT suggestion if 4+ task bank tasks
  } else if (taskBankTasks.length >= 2 && remainingTime < 180) {
    // Only limit to 2 if there are 2-3 task bank tasks AND less than 3 hours remaining
    maxGptSuggestions = 2;
  } else if (remainingTime < 120) { // Less than 2 hours available
    maxGptSuggestions = 1;
  } else if (remainingTime < 240) { // Less than 4 hours available
    maxGptSuggestions = 2;
  }

  console.log(`🎯 Limiting GPT suggestions to ${maxGptSuggestions} due to ${taskBankTasks.length} task bank tasks and ${remainingTime}min remaining`);

  // Only schedule GPT suggestions here
  const scheduled = [];
  const skipped = [];

  // Track scheduled times to avoid conflicts - include ALL existing calendar events
  const scheduledTimes: { start: Date; end: Date }[] = [];

  // Schedule only GPT suggestions
  let scheduledCount = 0;
  for (const suggestion of suggestions) {
    // Stop if we've reached the maximum GPT suggestions
    if (scheduledCount >= maxGptSuggestions) {
      console.log(`🛑 Reached maximum GPT suggestions (${maxGptSuggestions}), skipping remaining suggestions`);
      break;
    }

    const duration = inferDuration(suggestion.task, suggestion.priority);
    
    // Get ALL existing calendar events for today (including GPT, task bank, and Google Calendar)
    const todayEvents = allEvents.filter((e: any) => {
      const eventDate = moment(e.start).tz(validatedTimeZone);
      const today = moment.tz(validatedTimeZone).startOf('day');
      return eventDate.isSame(today, 'day');
    });
    
    console.log(`📅 Today's events (${todayEvents.length}):`, todayEvents.map((e: any) => `${e.title} (${moment(e.start).tz(validatedTimeZone).format('HH:mm')}-${moment(e.end).tz(validatedTimeZone).format('HH:mm')}) [${e.source}]`));
    
    // Convert calendarEvents to the correct type (start/end as strings)
    const safeEventsForSchedule = todayEvents.map((e: any) => ({
      start: e.start instanceof Date ? e.start.toISOString() : e.start,
      end: e.end instanceof Date ? e.end.toISOString() : e.end,
      title: e.title,
    }));
    
    // Add already scheduled times from this session to avoid conflicts
    const allEventsForSchedule = [...safeEventsForSchedule, ...scheduledTimes.map(st => ({
      start: st.start.toISOString(),
      end: st.end.toISOString(),
      title: 'Scheduled in this session'
    }))];
    
    // ALSO include task bank tasks that will be scheduled later to avoid conflicts
    const taskBankEvents = taskBankTasks.map(task => {
      // Estimate a default time for task bank tasks (they'll be scheduled by add.ts)
      // Use priority-based time slots to avoid conflicts
      let estimatedStart;
      if (task.priority === 'high') {
        estimatedStart = moment.tz(validatedTimeZone).startOf('day').hour(8).minute(0); // 8:00 AM
      } else if (task.priority === 'medium') {
        estimatedStart = moment.tz(validatedTimeZone).startOf('day').hour(13).minute(0); // 1:00 PM
      } else {
        estimatedStart = moment.tz(validatedTimeZone).startOf('day').hour(16).minute(0); // 4:00 PM
      }
      
      const estimatedDuration = inferDuration(task.title, task.priority);
      const estimatedEnd = estimatedStart.clone().add(estimatedDuration, 'minutes');
      
      return {
        start: estimatedStart.toISOString(),
        end: estimatedEnd.toISOString(),
        title: `Task Bank: ${task.title}`,
      };
    });
    
    // Include task bank events in conflict detection
    const allEventsWithTaskBank = [...allEventsForSchedule, ...taskBankEvents];
    
    console.log(`🔍 Scheduling "${suggestion.task}" with ${allEventsWithTaskBank.length} existing events (including ${taskBankEvents.length} task bank tasks)`);
    console.log(`📅 Existing events:`, allEventsWithTaskBank.map((e: any) => `${e.title} (${new Date(e.start).toLocaleTimeString()}-${new Date(e.end).toLocaleTimeString()})`));
    console.log(`📊 Scheduled times in this session:`, scheduledTimes.map(st => `${st.start.toLocaleTimeString()}-${st.end.toLocaleTimeString()}`));
    console.log(`📋 Task bank tasks to avoid:`, taskBankEvents.map((e: any) => `${e.title} (${new Date(e.start).toLocaleTimeString()}-${new Date(e.end).toLocaleTimeString()})`));
    
    const schedule = await getTaskSchedule({
      taskTitle: suggestion.task,
      priority: suggestion.priority as 'High' | 'Medium' | 'Low',
      durationMinutes: duration,
      mood,
      events: allEventsWithTaskBank, // Include task bank tasks in conflict detection
      timeZone: validatedTimeZone,
    });

    if (!schedule.recommendedStart || !schedule.recommendedEnd) {
      skipped.push({ title: suggestion.task, reason: schedule.reason });
      continue;
    }

    console.log(`✅ Scheduled "${suggestion.task}" at ${schedule.recommendedStart.toLocaleTimeString()}`);

    // Track this scheduled time to avoid conflicts with subsequent tasks
    scheduledTimes.push({
      start: schedule.recommendedStart,
      end: schedule.recommendedEnd
    });
    
    console.log(`📈 Updated scheduled times:`, scheduledTimes.map(st => `${st.start.toLocaleTimeString()}-${st.end.toLocaleTimeString()}`));

    // Save GPT suggestion to calendar
    await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: suggestion.task,
        start: schedule.recommendedStart,
        end: schedule.recommendedEnd,
        source: 'gpt',
        color: '#9b87a6',
      },
    });

    scheduled.push({
      id: crypto.randomUUID(),
      title: suggestion.task,
      start: schedule.recommendedStart.toISOString(),
      end: schedule.recommendedEnd.toISOString(),
      priority: suggestion.priority,
      reason: suggestion.reason || '',
    });
    scheduledCount++; // Increment the counter after successful scheduling
  }

  // Return task bank tasks separately for add.ts to handle
  const taskBankForAdd = taskBankTasks.map(task => ({
    id: task.id,
    title: task.title,
    priority: task.priority,
    source: 'taskbank' as const,
  }));

  console.log(`📋 Task bank tasks found: ${taskBankTasks.length}`, taskBankTasks.map(t => t.title));
  console.log(`📤 Task bank tasks for add API: ${taskBankForAdd.length}`, taskBankForAdd.map(t => t.title));

  return res.status(200).json({
    message: scheduled.length ? 
      (scheduledCount >= maxGptSuggestions ? 
        `Limited to ${maxGptSuggestions} GPT suggestions due to space constraints` : 
        'Suggestions scheduled') : 
      'Your day is already fully optimized - no room for additional suggestions',
    suggestions: scheduled,
    taskBankTasks: taskBankForAdd,
    skippedSuggestions: skipped,
  });
}

// Helper function to fetch Google Calendar events
async function fetchGoogleCalendarEvents(accessToken?: string) {
  if (!accessToken) {
    console.warn("⚠️ No Google access token available");
    return [];
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    console.log('🔑 Using access token for conflict detection:', accessToken);

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
    console.error("❌ Error fetching Google events for conflict detection:", err);
    return []; // Don't crash everything — fallback to DB events only
  }
}