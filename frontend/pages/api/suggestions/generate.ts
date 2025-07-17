// pages/api/suggestions/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { getGPTSuggestion } from '@/lib/openai'; // your script

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 Hit /api/suggestions/generate');

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { userProfile: true, moodLogs: true },
  });

  if (!user || !user.userProfile) return res.status(404).json({ message: 'Profile not found' });

  const latestMood = user.moodLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.mood || 'neutral';

  // TODO: replace this with real data
  const calendarConflicts = [];
  const timeWindow = '1PM–4PM';

  const suggestionResponse = await getGPTSuggestion({
    userTags: user.userProfile.behaviorTags,
    mood: latestMood,
    goals: [], // Fill this from your data model
    habits: [], // Optional, or pull from future table
    environment: user.userProfile.environment[0] || 'home',
    calendarConflicts,
    timeWindow,
  });

  let parsed;
  try {
    parsed = JSON.parse(suggestionResponse);
  } catch (e) {
    console.error('❌ GPT response invalid:', suggestionResponse);
    return res.status(500).json({ message: 'Invalid GPT response' });
  }

  if (!Array.isArray(parsed.suggestions)) {
    return res.status(400).json({ message: 'Malformed suggestion payload' });
  }

  // Save suggestions to DB
  const created = await Promise.all(
    parsed.suggestions.map((s: any) =>
      prisma.suggestion.create({
        data: {
          userId: user.id,
          suggestionText: s.task,
          timestamp: new Date(),
        },
      })
    )
  );

  return res.status(200).json({ message: 'Suggestions saved', suggestions: created });
}
