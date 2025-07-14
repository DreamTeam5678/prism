import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 🔐 Securely get user from session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      role,
      planningStyle,
      idealSelf,
      blockers,
      dislikes,
      environment,
      supportStyle,
    } = req.body;

    const locationType = environment?.locationType || null;
    const climate = environment?.climate || null;
    const energyAccess = environment?.energyAccess || null;

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        role,
        planningStyle,
        idealSelf,
        blockers,
        dislikes,
        locationType,
        climate,
        energyAccess,
        supportStyle,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        role,
        planningStyle,
        idealSelf,
        blockers,
        dislikes,
        locationType,
        climate,
        energyAccess,
        supportStyle,
        createdAt: new Date(),
      }
    });

    return res.status(200).json({ message: 'Survey saved successfully' });
  } catch (err) {
    console.error('[Survey API]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
