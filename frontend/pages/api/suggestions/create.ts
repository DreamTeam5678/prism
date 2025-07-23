// pages/api/suggestions/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: 'Unauthorized' });

  const { suggestionText, start, end, priority, reason, mood, environment, weather, source } = req.body;
  
  if (!suggestionText || !start || !end) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const suggestion = await prisma.suggestion.create({
      data: {
        userId: user.id,
        suggestionText,
        start: new Date(start),
        end: new Date(end),
        priority,
        reason,
        mood,
        environment,
        weather,
        source,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date(),
      },
    });

    return res.status(200).json(suggestion);
  } catch (error) {
    console.error('Failed to create suggestion:', error);
    return res.status(500).json({ error: 'Failed to create suggestion' });
  }
} 