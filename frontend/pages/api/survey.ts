import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import prisma from '../../../lib/prisma'; // ✅ adjust path if needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      currentMode,
      planningStyle,
      idealSelf,
      blockers,
      dislikes,
      environment,
      climate,
      behaviorTags
    } = req.body;

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        currentMode,
        planningStyle,
        idealSelf,
        blockers,
        dislikes,
        environment,
        climate,
        behaviorTags,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        currentMode,
        planningStyle,
        idealSelf,
        blockers,
        dislikes,
        environment,
        climate,
        behaviorTags,
        createdAt: new Date(),
      }
    });

    return res.status(200).json({ message: 'Survey saved successfully' });

  } catch (error) {
    console.error('[Survey API]', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// 👇 prevents TS "top-level await" error in some editors
export {};
