import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import moment from 'moment-timezone';
import { mapTags } from '@/lib/tagEngine';
import { getGPTSuggestion, getTaskSchedule } from '../../../lib/server/openaiClient';

interface Suggestion {
  task: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
}

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
  if (timeZone !== validatedTimeZone) {
    console.warn(`⚠️ Invalid time zone: ${timeZone}. Using UTC instead.`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      userProfile: true,
      moodLogs: true,
    },
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
      start: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: validatedTimeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
  const localNow = new Date();
  localNow.setHours(hour, minute, 0, 0);

  const calendarConflicts: { start: string; end: string }[] = calendarEvents
    .filter(e => e.end > localNow)
    .map(e => ({
      start: e.start.toISOString(),
      end: e.end.toISOString(),
    }));

  const timeWindow = '8AM–8PM';

  try {
    const suggestions = await getGPTSuggestion({
      userTags: tags,
      mood,
      environment: location,
      weather,
      calendarConflicts,
      timeWindow,
      timeZone: validatedTimeZone,
    });

    const rawSuggestions = suggestions.filter(
      (s): s is Suggestion => !!s.task && !!s.priority && !!s.reason
    );

    if (rawSuggestions.length === 0) {
      return res.status(200).json({
        message: 'No suggestions available for the current context.',
        suggestions: [],
      });
    }

    const scheduledSuggestions: {
      title: string;
      priority: 'High' | 'Medium' | 'Low';
      reason: string;
      start: Date;
      end: Date;
    }[] = [];

    const skippedSuggestions: { title: string; reason: string }[] = [];
    const dynamicConflicts = [...calendarConflicts];

    for (const raw of rawSuggestions) {
      const schedule = await getTaskSchedule({
        taskTitle: raw.task,
        priority: raw.priority,
        durationMinutes: 60,
        mood,
        events: dynamicConflicts,
        timeZone: validatedTimeZone,
      });

      if (schedule?.recommendedStart && schedule?.recommendedEnd) {
        const start = new Date(schedule.recommendedStart);
        const end = new Date(schedule.recommendedEnd);

        scheduledSuggestions.push({
          title: raw.task,
          priority: raw.priority,
          reason: raw.reason || schedule.reason,
          start,
          end,
        });

        dynamicConflicts.push({
          start: start.toISOString(),
          end: end.toISOString(),
        });
      } else {
        console.warn(`⚠️ Could not schedule: ${raw.task}`);
        skippedSuggestions.push({
          title: raw.task,
          reason: schedule?.reason || 'No available time slot',
        });
      }
    }

    if (scheduledSuggestions.length === 0) {
      return res.status(200).json({
        message: "It's too late to optimize today — try again tomorrow morning.",
        suggestions: [],
      });
    }

    const created = await Promise.all(
      scheduledSuggestions.map(s =>
        prisma.suggestion.create({
          data: {
            userId: user.id,
            suggestionText: s.title,
            timestamp: new Date(),
            start: s.start,
            end: s.end,
            priority: s.priority,
            reason: s.reason,
            mood,
            weather,
            environment: location,
            source: 'gpt',
            timeZone: validatedTimeZone,
          },
        })
      )
    );

    await Promise.all(
      created.map((s) =>
        s.start && s.end 
          ? prisma.calendarEvent.create({
            data: {
              userId: user.id,
              title: s.suggestionText,
              start: s.start as Date,
              end: s.end as Date,
              source: 'gpt',
              color: '#9b87a6',
            },
          })
        : Promise.resolve(null) 
      )
    );
  

    return res.status(200).json({
      message:
        skippedSuggestions.length > 0
          ? 'Some suggestions were skipped'
          : 'Suggestions scheduled and saved',
      suggestions: created,
      skippedSuggestions,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('❌ Failed to generate suggestions:', message);
    return res.status(500).json({ message: 'Failed to generate suggestions', error: message });
  }
}
