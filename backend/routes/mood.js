// backend/routes/mood.js
import express from 'express';
import prisma from '../lib/prisma.js'; // Prisma client instance

const router = express.Router();

// POST /api/mood — Log a new mood entry
router.post('/', async (req, res) => {
  const { userId, mood } = req.body;

  if (!userId || !mood) {
    return res.status(400).json({ error: 'Missing userId or mood' });
  }

  try {
    const moodLog = await prisma.moodLog.create({
      data: { userId, mood },
    });

    res.status(201).json(moodLog);
  } catch (error) {
    console.error('❌ Error creating mood log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/mood/:userId — Fetch all mood logs for a specific user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const moodLogs = await prisma.moodLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(moodLogs);
  } catch (error) {
    console.error('❌ Error fetching mood logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;