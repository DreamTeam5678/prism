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

  // Track scheduled times to avoid conflicts - include ALL existing calendar events
  const scheduledTimes: { start: Date; end: Date }[] = [];

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

  // Combine all events for conflict detection, but filter out 0-minute events
  const validGoogleEvents = googleEvents.filter(event => {
    const duration = event.end.getTime() - event.start.getTime();
    return duration > 0; // Only include events that actually have duration
  });
  
  const allEvents = [...localEvents, ...validGoogleEvents];

  console.log(`📊 Found ${localEvents.length} local events and ${validGoogleEvents.length} valid Google events for user (filtered out ${googleEvents.length - validGoogleEvents.length} 0-minute events)`);
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
    timeWindow: '8AM–12PM',
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
  const taskBankTasksRaw = await prisma.task.findMany({
    where: { userId: user.id, scheduled: false, completed: false },
  });

  // Sort task bank tasks by priority: High (3) → Medium (2) → Low (1), then by creation time
  const taskPriorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  const taskBankTasks = taskBankTasksRaw.sort((a, b) => {
    const priorityA = taskPriorityOrder[a.priority.toLowerCase() as keyof typeof taskPriorityOrder] || 1;
    const priorityB = taskPriorityOrder[b.priority.toLowerCase() as keyof typeof taskPriorityOrder] || 1;
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // High priority first
    }
    
    // If same priority, sort by creation time (oldest first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  console.log(`📋 Found ${taskBankTasks.length} unscheduled task bank tasks:`, taskBankTasks.map(t => `${t.title} (${t.priority})`));

  // Calculate estimated time needed for task bank tasks
  const taskBankTimeNeeded = taskBankTasks.reduce((total, task) => {
    const duration = inferDuration(task.title, task.priority);
    return total + duration;
  }, 0);

  // Calculate available time today (8AM-12PM = 16 hours = 960 minutes)
  const totalAvailableTime = 16 * 60; // 960 minutes
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
  
  // More intelligent logic based on available time and task bank tasks
  if (remainingTime < 120) { // Less than 2 hours available
    maxGptSuggestions = 1;
  } else if (remainingTime < 240) { // Less than 4 hours available
    maxGptSuggestions = 2;
  } else if (taskBankTasks.length >= 1 && remainingTime < 180) {
    // If there are any task bank tasks and less than 3 hours remaining, prioritize task bank
    maxGptSuggestions = 0;
  } else if (taskBankTasks.length >= 4 && remainingTime < 300) {
    // If there are 4+ task bank tasks AND less than 5 hours remaining, prioritize task bank
    maxGptSuggestions = 0;
  } else if (taskBankTasks.length >= 4) {
    // If there are 4+ task bank tasks but plenty of time, allow 1 GPT suggestion
    maxGptSuggestions = 1;
  } else if (taskBankTasks.length >= 3 && remainingTime < 240) {
    // Only limit to 1 if 3+ task bank tasks AND less than 4 hours remaining
    maxGptSuggestions = 1;
  } else if (taskBankTasks.length >= 3) {
    // If there are 3+ task bank tasks but plenty of time, allow 2 GPT suggestions
    maxGptSuggestions = 2;
  } else if (taskBankTasks.length >= 2 && remainingTime < 180) {
    // Only limit to 1 if 2+ task bank tasks AND less than 3 hours remaining
    maxGptSuggestions = 1;
  } else if (taskBankTasks.length >= 2) {
    // If there are 2+ task bank tasks but plenty of time, allow 2 GPT suggestions
    maxGptSuggestions = 2;
  } else if (taskBankTasks.length >= 1 && remainingTime < 120) {
    // Only limit to 1 if 1+ task bank tasks AND less than 2 hours remaining
    maxGptSuggestions = 1;
  } else if (taskBankTasks.length >= 1) {
    // If there is 1+ task bank task but plenty of time, allow 2 GPT suggestions
    maxGptSuggestions = 2;
  }

  console.log(`🎯 Limiting GPT suggestions to ${maxGptSuggestions} due to ${taskBankTasks.length} task bank tasks and ${remainingTime}min remaining`);

  // TRUE PRIORITY-BASED SCHEDULING: Combine all tasks and schedule by priority
  console.log(`🎯 Implementing true priority-based scheduling...`);
  
  // Get ALL existing calendar events for today (for scheduling)
  const todayEventsForScheduling = allEvents.filter((e: any) => {
    const eventDate = moment(e.start).tz(validatedTimeZone);
    const today = moment.tz(validatedTimeZone).startOf('day');
    return eventDate.isSame(today, 'day');
  });
  
  // Convert calendarEvents to the correct type
  const safeEventsForSchedule = todayEvents.map((e: any) => ({
    start: e.start instanceof Date ? e.start.toISOString() : e.start,
    end: e.end instanceof Date ? e.end.toISOString() : e.end,
    title: e.title,
  }));
  
  // Combine all tasks (task bank + GPT) into a single list
  const allTasks = [
    // Task bank tasks
    ...taskBankTasks.map(task => ({
      ...task,
      source: 'task_bank' as const,
      duration: inferDuration(task.title, task.priority)
    })),
    // GPT suggestions (limited by maxGptSuggestions)
    ...suggestions.slice(0, maxGptSuggestions).map(suggestion => ({
      title: suggestion.task,
      priority: suggestion.priority,
      source: 'gpt' as const,
      duration: inferDuration(suggestion.task, suggestion.priority),
      reason: suggestion.reason
    }))
  ];
  
  // Sort by source first (task_bank over gpt), then by priority: High (3) → Medium (2) → Low (1)
  const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
  allTasks.sort((a, b) => {
    // First, prioritize task_bank over gpt
    if (a.source !== b.source) {
      return a.source === 'task_bank' ? -1 : 1; // task_bank comes first
    }
    // Then sort by priority within each source
    const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
    const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
    return priorityB - priorityA; // High priority first
  });
  
  console.log(`📋 All tasks sorted by source (task_bank first) then priority:`, allTasks.map(t => `${t.title} (${t.priority} - ${t.source})`));
  
  // Schedule all tasks by priority
  const scheduled = [];
  const skipped = [];
  
  for (const task of allTasks) {
    console.log(`\n🔍 Processing task: ${task.title} (${task.priority} - ${task.source})`);
    
    // Include already scheduled slots from this session in the events list
    const eventsWithSessionSlots = [
      ...safeEventsForSchedule,
      ...scheduledTimes.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        title: 'Scheduled in this session'
      }))
    ];
    
    const schedule = await getTaskSchedule({
      taskTitle: task.title,
      priority: task.priority as 'High' | 'Medium' | 'Low',
      durationMinutes: task.duration,
      mood,
      events: eventsWithSessionSlots,
      timeZone: validatedTimeZone,
    });
    
    if (!schedule.recommendedStart || !schedule.recommendedEnd) {
      console.log(`❌ Task "${task.title}" cannot be scheduled - no available slots`);
      skipped.push({ title: task.title, reason: schedule.reason, source: task.source });
      continue;
    }
    
    console.log(`✅ Scheduled "${task.title}" at ${schedule.recommendedStart.toLocaleTimeString()}-${schedule.recommendedEnd.toLocaleTimeString()}`);
    
    // Add to scheduled times to avoid conflicts with subsequent tasks
    scheduledTimes.push({
      start: new Date(schedule.recommendedStart),
      end: new Date(schedule.recommendedEnd)
    });
    
    // Save to database based on source
    if (task.source === 'task_bank') {
      // Save task bank task
      await prisma.task.updateMany({
        where: {
          userId: user.id,
          title: task.title,
          priority: task.priority,
          scheduled: false
        },
        data: {
          scheduled: true,
          timestamp: new Date(schedule.recommendedStart)
        }
      });
      
      await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: task.title,
          start: new Date(schedule.recommendedStart),
          end: new Date(schedule.recommendedEnd),
          source: "task_bank",
          color: "#ebdbb4",
        }
      });
      
      console.log(`💾 Saved task bank task "${task.title}" to database`);
    } else {
      // Save GPT suggestion
      await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: task.title,
          start: new Date(schedule.recommendedStart),
          end: new Date(schedule.recommendedEnd),
          source: 'gpt',
          color: '#9b87a6',
        },
      });
      
      scheduled.push({
        id: crypto.randomUUID(),
        title: task.title,
        start: schedule.recommendedStart.toISOString(),
        end: schedule.recommendedEnd.toISOString(),
        priority: task.priority,
        reason: task.reason || '',
      });
      
      console.log(`💾 Saved GPT suggestion "${task.title}" to database`);
    }
    
    console.log(`📈 Updated scheduled times:`, scheduledTimes.map(st => `${st.start.toLocaleTimeString()}-${st.end.toLocaleTimeString()}`));
  }

  // The old GPT-only scheduling code has been replaced by the unified priority-based scheduling above

  // Task bank tasks are already saved to database above, so we don't need to send them to calendar/add
  console.log(`📋 Task bank tasks found: ${taskBankTasks.length}`, taskBankTasks.map(t => t.title));
  console.log(`✅ Task bank tasks already saved to database - no need to send to calendar/add`);

  return res.status(200).json({
    message: scheduled.length ? 
      (scheduled.length >= maxGptSuggestions ? 
        `Limited to ${maxGptSuggestions} GPT suggestions due to space constraints` : 
        'Suggestions scheduled') : 
      'Your day is already fully optimized - no room for additional suggestions',
    suggestions: scheduled,
    taskBankTasks: [], // Don't send task bank tasks to calendar/add since they're already saved
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
  } catch (err: any) {
    if (err.code === 401) {
      console.warn("⚠️ Google Calendar authentication failed for conflict detection - token may be expired.");
      return []; // Graceful fallback to local events only
    }
    console.error("❌ Error fetching Google events for conflict detection:", err);
    return []; // Don't crash everything — fallback to DB events only
  }
}