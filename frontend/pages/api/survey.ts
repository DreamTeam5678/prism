// frontend/pages/api/survey.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import prisma from '../../lib/prisma';
import { mapTags } from '@/lib/tagEngine';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 API route hit:', req.method, req.url);
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('🔍 Session:', session);
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    console.log('🔍 User:', user);

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || '',
          image: session.user.image || '',
        },
      });
    }

    const {
      currentMode,
      planningStyle,
      idealSelf,
      blockers,
      dislikes,
      environment,
      climate,
    } = req.body;

    // Validation: Ensure all fields are present
    if (
      !currentMode || !planningStyle || !idealSelf ||
      !blockers || !dislikes || !environment || !climate
    ) {
      return res.status(400).json({ message: 'Missing survey data' });
    }

    // Normalize in case any field comes as an empty string or non-array
    const normalizeField = (field: any) => Array.isArray(field) ? field : [];

    const normalized = {
      currentMode: normalizeField(currentMode),
      planningStyle: normalizeField(planningStyle),
      idealSelf: normalizeField(idealSelf),
      blockers: normalizeField(blockers),
      dislikes: normalizeField(dislikes),
      environment: normalizeField(environment),
      climate: normalizeField(climate),
    };

    const behaviorTags = mapTags(normalized);

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        ...normalized,
        behaviorTags,
      },
      create: {
        userId: user.id,
        ...normalized,
        behaviorTags,
      },
    });

    return res.status(200).json({ message: 'Survey saved successfully' });
  } catch (err) {
    console.error('[Survey API]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

