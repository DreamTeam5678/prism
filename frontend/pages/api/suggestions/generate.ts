// pages/api/suggestions/generate.ts
/*
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import moment from 'moment-timezone';
import { mapTags } from '@/lib/tagEngine';
import { getGPTSuggestion } from '../../../lib/server/openaiClient';
import { inferDuration } from '@/lib/utils/inferDuration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 Hit /api/suggestions/generate');

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { mood, location, weather, timeZone } = req.body as {
    mood?: string;
    location?: string;
    weather?: string;
    timeZone?: string;
  };

  if (!mood || !location || !weather || !timeZone) {
    return res.status(400).json({ error: 'Missing mood, weather, location, or timeZone' });
  }

  const validatedTimeZone = moment.tz.names().includes(timeZone) ? timeZone : 'UTC';

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { userProfile: true },
  });

  if (!user?.userProfile) {
    return res.status(400).json({ error: 'User profile not found' });
  }

  const tags = mapTags({
    currentMode: user.userProfile.currentMode,
    idealSelf: user.userProfile.idealSelf,
    blockers: user.userProfile.blockers,
    dislikes: user.userProfile.dislikes,
  });

  const calendarEvents = await prisma.calendarEvent.findMany({
    where: {
      userId: user.id,
      start: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });
  const now = moment.tz(validatedTimeZone);
  const gptScheduledTitlesToday = calendarEvents
    .filter(e => e.source === 'gpt' && moment(e.start).isSame(now, 'day'))
    .map(e => e.title.toLowerCase());
  const safeEvents = calendarEvents.map(e => ({
    start: e.start.toISOString(),
    end: e.end.toISOString(),
  }));


  const suggestions = (await getGPTSuggestion({
    userTags: tags,
    mood,
    environment: location,
    weather,
    calendarConflicts: safeEvents,
    timeWindow: '8AM–9PM',
    timeZone: validatedTimeZone,
  })).filter(s => !gptScheduledTitlesToday.includes(s.task.toLowerCase()));


  const conflicts = [...calendarEvents.map(e => ({ start: e.start.toISOString(), end: e.end.toISOString() }))];
  const startOfDay = now.clone().startOf('day').hour(8);
  const endOfDay = now.clone().startOf('day').hour(21);
  const scheduled = [];
  const skippedSuggestions = [];

  for (const s of suggestions) {
    let cursor = moment.max(now, startOfDay);
    const sorted = conflicts.map(c => ({ start: moment(c.start), end: moment(c.end) })).sort((a, b) => a.start.diff(b.start));
    let scheduledSlot = null;
    const duration = inferDuration(s.task, s.priority);

  

    for (const block of sorted) {
      if (cursor.clone().add(duration, 'minutes').isBefore(block.start)) {
        scheduledSlot = {
          start: cursor.clone(),
          end: cursor.clone().add(duration, 'minutes')
        };
        break;
      }
      cursor = moment.max(cursor, block.end);
    }

    const proposedEnd = cursor.clone().add(duration, 'minutes');
    if (!scheduledSlot && proposedEnd.isSame(now, 'day') && proposedEnd.isBefore(endOfDay)) {
      scheduledSlot = {
        start: cursor.clone(),
        end: proposedEnd,
      };
    }

    if (
      scheduledSlot &&
      scheduledSlot.start.isSame(now, 'day') &&
      scheduledSlot.end.isSame(now, 'day') &&
      scheduledSlot.end.isBefore(endOfDay)
    ) {
      // schedule it
    } else {
      skippedSuggestions.push({
        title: s.task,
        reason: "No valid time slot today"
      });
    }


    if (scheduledSlot) {
      const newEvent = await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: s.task,
          start: scheduledSlot.start.toDate(),
          end: scheduledSlot.end.toDate(),
          source: 'gpt',
          color: '#9b87a6',
        },
      });

      const newSuggestion = await prisma.suggestion.create({
        data: {
          userId: user.id,
          suggestionText: s.task,
          timestamp: new Date(),
          start: scheduledSlot.start.toDate(),
          end: scheduledSlot.end.toDate(),
          priority: s.priority,
          reason: s.reason,
          mood,
          weather,
          environment: location,
          source: 'gpt',
          timeZone: validatedTimeZone,
        },
      });

      scheduled.push(newSuggestion);
      conflicts.push({ start: scheduledSlot.start.toISOString(), end: scheduledSlot.end.toISOString() });
    } else {
      skippedSuggestions.push({ title: s.task, reason: 'No available time slot' });
    }
  }

  return res.status(200).json({
    message: scheduled.length ? 'Suggestions scheduled' : 'Nothing could be scheduled',
    suggestions: scheduled,
    skippedSuggestions,
  });
}
*/
// pages/api/suggestions/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import moment from 'moment-timezone';
import { mapTags } from '@/lib/tagEngine';
import { getGPTSuggestion, getTaskSchedule } from '../../../lib/server/openaiClient';
import { inferDuration } from '@/lib/utils/inferDuration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 Hit /api/suggestions/generate');

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { mood, location, weather, timeZone } = req.body as {
    mood?: string;
    location?: string;
    weather?: string;
    timeZone?: string;
  };

  if (!mood || !location || !weather || !timeZone) {
    return res.status(400).json({ error: 'Missing mood, weather, location, or timeZone' });
  }

  const validatedTimeZone = moment.tz.names().includes(timeZone) ? timeZone : 'UTC';

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { userProfile: true },
  });

  if (!user?.userProfile) {
    return res.status(400).json({ error: 'User profile not found' });
  }

  const tags = mapTags({
    currentMode: user.userProfile.currentMode,
    idealSelf: user.userProfile.idealSelf,
    blockers: user.userProfile.blockers,
    dislikes: user.userProfile.dislikes,
  });

  const calendarEvents = await prisma.calendarEvent.findMany({
    where: {
      userId: user.id,
      start: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  const now = moment.tz(validatedTimeZone);
  const gptScheduledTitlesToday = calendarEvents
    .filter(e => e.source === 'gpt' && moment(e.start).isSame(now, 'day'))
    .map(e => e.title.toLowerCase());
  const safeEvents = calendarEvents.map(e => ({
    start: e.start.toISOString(),
    end: e.end.toISOString(),
  }));

  const suggestions = (await getGPTSuggestion({
    userTags: tags,
    mood,
    environment: location,
    weather,
    calendarConflicts: safeEvents,
    timeWindow: '8AM–9PM',
    timeZone: validatedTimeZone,
  })).filter(s => !gptScheduledTitlesToday.includes(s.task.toLowerCase()));

  const conflicts = [...calendarEvents.map(e => ({ start: e.start.toISOString(), end: e.end.toISOString() }))];
  const startOfDay = now.clone().startOf('day').hour(8);
  const endOfDay = now.clone().startOf('day').hour(21);
  const scheduled = [];
  const skippedSuggestions = [];

  // Sort suggestions by priority
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  for (const s of sortedSuggestions) {
    const duration = inferDuration(s.task, s.priority);
    const schedule = await getTaskSchedule({
      taskTitle: s.task,
      priority: s.priority,
      durationMinutes: duration,
      mood,
      events: conflicts,
      timeZone: validatedTimeZone,
    });

    if (!schedule.recommendedStart || !schedule.recommendedEnd) {
      skippedSuggestions.push({
        title: s.task,
        reason: schedule.reason || "No valid time slot today",
      });
      continue;
    }

    const scheduledSlot = {
      start: moment(schedule.recommendedStart),
      end: moment(schedule.recommendedEnd),
    };

    // Verify slot is valid and respects 30-minute buffer
    const bufferMs = 30 * 60 * 1000;
    let hasConflict = false;
    for (const conflict of conflicts) {
      const eventStart = moment(conflict.start);
      const eventEnd = moment(conflict.end);
      if (
        scheduledSlot.end.clone().add(bufferMs, 'milliseconds').isAfter(eventStart) &&
        scheduledSlot.start.isBefore(eventEnd.clone().add(bufferMs, 'milliseconds'))
      ) {
        hasConflict = true;
        break;
      }
    }

    if (
      hasConflict ||
      !scheduledSlot.start.isSame(now, 'day') ||
      !scheduledSlot.end.isSame(now, 'day') ||
      scheduledSlot.end.isAfter(endOfDay)
    ) {
      skippedSuggestions.push({
        title: s.task,
        reason: "No valid time slot with 30-minute buffer",
      });
      continue;
    }

    const newEvent = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: s.task,
        start: scheduledSlot.start.toDate(),
        end: scheduledSlot.end.toDate(),
        source: 'gpt',
        color: '#9b87a6',
      },
    });

    const newSuggestion = await prisma.suggestion.create({
      data: {
        userId: user.id,
        suggestionText: s.task,
        timestamp: new Date(),
        start: scheduledSlot.start.toDate(),
        end: scheduledSlot.end.toDate(),
        priority: s.priority,
        reason: s.reason,
        mood,
        weather,
        environment: location,
        source: 'gpt',
        timeZone: validatedTimeZone,
      },
    });

    scheduled.push(newSuggestion);
    conflicts.push({ start: scheduledSlot.start.toISOString(), end: scheduledSlot.end.toISOString() });
  }

  return res.status(200).json({
    message: scheduled.length ? 'Suggestions scheduled' : 'Nothing could be scheduled',
    suggestions: scheduled,
    skippedSuggestions,
  });
}