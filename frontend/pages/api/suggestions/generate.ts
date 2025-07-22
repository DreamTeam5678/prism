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

  const calendarEvents = await prisma.calendarEvent.findMany({
    where: { userId: user.id, start: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  });

  const now = moment.tz(validatedTimeZone);
  const gptScheduledTitlesToday = calendarEvents
    .filter(e => e.source === 'gpt' && moment(e.start).isSame(now, 'day'))
    .map(e => e.title.toLowerCase());

  const safeEvents = calendarEvents.map(e => ({ start: e.start.toISOString(), end: e.end.toISOString() }));
  const suggestions = (await getGPTSuggestion({
    userTags: tags,
    mood,
    environment: location,
    weather,
    calendarConflicts: safeEvents,
    timeWindow: '8AM–9PM',
    timeZone: validatedTimeZone,
  })).filter(s => !gptScheduledTitlesToday.includes(s.task.toLowerCase()));

  const taskBankTasks = await prisma.task.findMany({
    where: { userId: user.id, scheduled: false, completed: false },
  });

  const mergedTasks = [
    ...taskBankTasks.map(task => ({
      task: task.title,
      priority: task.priority,
      source: 'taskbank',
      id: task.id,
    })),
    ...suggestions.map(s => ({ ...s, source: 'gpt' })),
  ];

  const sorted = mergedTasks.sort((a, b) => {
    const order = { High: 3, Medium: 2, Low: 1 };
    return order[b.priority] - order[a.priority];
  });

  const scheduled = [];
  const skipped = [];

  for (const task of sorted) {
    const duration = inferDuration(task.task, task.priority);
    const schedule = await getTaskSchedule({
      taskTitle: task.task,
      priority: task.priority,
      durationMinutes: duration,
      mood,
      events: calendarEvents,
      timeZone: validatedTimeZone,
    });

    if (!schedule.recommendedStart || !schedule.recommendedEnd) {
      skipped.push({ title: task.task, reason: schedule.reason });
      continue;
    }

    await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: task.task,
        start: schedule.recommendedStart,
        end: schedule.recommendedEnd,
        source: task.source,
        color: task.source === 'gpt' ? '#9b87a6' : '#f3d5b5',
      },
    });

    if (task.source === 'gpt') {
      await prisma.suggestion.create({
        data: {
          userId: user.id,
          suggestionText: task.task,
          timestamp: new Date(),
          start: schedule.recommendedStart,
          end: schedule.recommendedEnd,
          priority: task.priority,
          reason: task.reason,
          mood,
          weather,
          environment: location,
          source: 'gpt',
          timeZone: validatedTimeZone,
        },
      });
    } else if (task.source === 'taskbank') {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          scheduled: true,
          timestamp: schedule.recommendedStart,
        },
      });
    }

    scheduled.push({
      title: task.task,
      start: schedule.recommendedStart.toISOString(),
      end: schedule.recommendedEnd.toISOString(),
      priority: task.priority,
      reason: task.reason || '',
    });
  }

  return res.status(200).json({
    message: scheduled.length ? 'Suggestions scheduled' : 'Nothing could be scheduled',
    suggestions: scheduled,
    skippedSuggestions: skipped,
  });
}