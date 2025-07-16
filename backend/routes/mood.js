// backend/routes/mood.js
import express from 'express';
import prisma from '../lib/prisma.js'; // this is your prisma client instance

const router = express.Router();

router.post('/', async (req, res) => {
  const { userId, mood } = req.body;

  if (!userId || !mood) {
    return res.status(400).json({ error: 'Missing userId or mood' });
  }

  try {
    const moodLog = await prisma.moodLog.create({
      data: {
        userId,
        mood
      },
    });

    res.status(201).json(moodLog);
  } catch (error) {
    console.error('Error creating mood log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;