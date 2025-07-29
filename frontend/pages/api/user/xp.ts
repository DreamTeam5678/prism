import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { xp: true, streak: true, lastCompletionDate: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        xp: user.xp,
        streak: user.streak,
        lastCompletionDate: user.lastCompletionDate
      });
    } catch (error) {
      console.error('Error fetching user XP:', error);
      return res.status(500).json({ error: 'Failed to fetch XP data' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { xp, streak, lastCompletionDate } = req.body;

      const user = await prisma.user.update({
        where: { email: session.user.email },
        data: {
          xp: xp !== undefined ? xp : undefined,
          streak: streak !== undefined ? streak : undefined,
          lastCompletionDate: lastCompletionDate !== undefined ? new Date(lastCompletionDate) : undefined
        },
        select: { xp: true, streak: true, lastCompletionDate: true }
      });

      return res.status(200).json({
        xp: user.xp,
        streak: user.streak,
        lastCompletionDate: user.lastCompletionDate
      });
    } catch (error) {
      console.error('Error updating user XP:', error);
      return res.status(500).json({ error: 'Failed to update XP data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 