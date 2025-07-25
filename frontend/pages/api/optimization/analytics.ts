// pages/api/optimization/analytics.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import moment from 'moment-timezone';
import { Suggestion } from '@prisma/client';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get analytics for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get optimization sessions
    const optimizationSessions: Suggestion[] = await prisma.suggestion.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: thirtyDaysAgo },
        source: 'gpt'
      },
      orderBy: { timestamp: 'desc' }
    });

    // Get mood data
    const moodLogs = await prisma.moodLog.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get completed tasks
    const completedTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        completed: true,
        updatedAt: { gte: thirtyDaysAgo }
      }
    });

    // Calculate analytics
    const analytics = {
      totalOptimizations: optimizationSessions.length,
      totalSuggestions: optimizationSessions.length * 3, // Assuming 3 suggestions per session
      acceptedSuggestions: optimizationSessions.filter(s => s.start && s.end).length,
      acceptanceRate: optimizationSessions.length > 0 
        ? Math.round((optimizationSessions.filter(s => s.start && s.end).length / optimizationSessions.length) * 100)
        : 0,
      
      // Mood analysis
      moodTrends: analyzeMoodTrends(moodLogs),
      
      // Productivity patterns
      productivityPatterns: analyzeProductivityPatterns(completedTasks, optimizationSessions),
      
      // Time-based insights
      timeInsights: analyzeTimePatterns(optimizationSessions, completedTasks),
      
      // Recommendations
      recommendations: generateRecommendations(optimizationSessions, moodLogs, completedTasks)
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching optimization analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
}

function analyzeMoodTrends(moodLogs: any[]) {
  const moodCounts: Record<string, number> = {};
  const moodByDay: Record<string, string[]> = {};

  moodLogs.forEach(log => {
    const day = moment(log.createdAt).format('YYYY-MM-DD');
    moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
    
    if (!moodByDay[day]) moodByDay[day] = [];
    moodByDay[day].push(log.mood);
  });

  const mostCommonMood = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

  const averageMoodPerDay = Object.values(moodByDay).length > 0
    ? Object.values(moodByDay).reduce((sum, moods) => sum + moods.length, 0) / Object.values(moodByDay).length
    : 0;

  return {
    mostCommonMood,
    totalMoodLogs: moodLogs.length,
    averageMoodPerDay: Math.round(averageMoodPerDay * 10) / 10,
    moodDistribution: moodCounts
  };
}

function analyzeProductivityPatterns(completedTasks: any[], optimizationSessions: any[]) {
  const taskCompletionByDay: Record<string, number> = {};
  const optimizationByDay: Record<string, number> = {};

  completedTasks.forEach(task => {
    const day = moment(task.updatedAt).format('YYYY-MM-DD');
    taskCompletionByDay[day] = (taskCompletionByDay[day] || 0) + 1;
  });

  optimizationSessions.forEach(session => {
    const day = moment(session.timestamp).format('YYYY-MM-DD');
    optimizationByDay[day] = (optimizationByDay[day] || 0) + 1;
  });

  const averageTasksPerDay = Object.values(taskCompletionByDay).length > 0
    ? Object.values(taskCompletionByDay).reduce((sum, count) => sum + count, 0) / Object.values(taskCompletionByDay).length
    : 0;

  const averageOptimizationsPerDay = Object.values(optimizationByDay).length > 0
    ? Object.values(optimizationByDay).reduce((sum, count) => sum + count, 0) / Object.values(optimizationByDay).length
    : 0;

  return {
    averageTasksPerDay: Math.round(averageTasksPerDay * 10) / 10,
    averageOptimizationsPerDay: Math.round(averageOptimizationsPerDay * 10) / 10,
    totalCompletedTasks: completedTasks.length,
    totalOptimizationSessions: optimizationSessions.length
  };
}

function analyzeTimePatterns(optimizationSessions: any[], completedTasks: any[]) {
  const hourDistribution: Record<number, number> = {};
  const dayOfWeekDistribution: Record<string, number> = {};

  [...optimizationSessions, ...completedTasks].forEach(item => {
    const timestamp = item.timestamp || item.updatedAt;
    const hour = moment(timestamp).hour();
    const dayOfWeek = moment(timestamp).format('dddd');

    hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
    dayOfWeekDistribution[dayOfWeek] = (dayOfWeekDistribution[dayOfWeek] || 0) + 1;
  });

  const mostProductiveHour = Object.entries(hourDistribution)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

  const mostProductiveDay = Object.entries(dayOfWeekDistribution)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

  return {
    mostProductiveHour: parseInt(mostProductiveHour),
    mostProductiveDay,
    hourDistribution,
    dayOfWeekDistribution
  };
}

function generateRecommendations(optimizationSessions: any[], moodLogs: any[], completedTasks: any[]) {
  const recommendations = [];

  // Check if user is optimizing regularly
  if (optimizationSessions.length < 5) {
    recommendations.push({
      type: 'frequency',
      title: 'Optimize More Often',
      description: 'Try using the optimize feature daily to get better at scheduling your day.',
      priority: 'high'
    });
  }

  // Check mood patterns
  const recentMoods = moodLogs.slice(0, 7).map(log => log.mood);
  const negativeMoods = recentMoods.filter(mood => 
    ['Overwhelmed', 'Tired', 'Unmotivated'].includes(mood)
  );

  if (negativeMoods.length > recentMoods.length * 0.5) {
    recommendations.push({
      type: 'mood',
      title: 'Focus on Self-Care',
      description: 'You\'ve been feeling overwhelmed lately. Consider adding more self-care tasks to your schedule.',
      priority: 'medium'
    });
  }

  // Check task completion rate
  const recentTasks = completedTasks.slice(0, 10);
  const completionRate = recentTasks.length > 0 
    ? recentTasks.filter(task => task.completed).length / recentTasks.length
    : 0;

  if (completionRate < 0.7) {
    recommendations.push({
      type: 'productivity',
      title: 'Simplify Your Tasks',
      description: 'Try breaking down larger tasks into smaller, more manageable pieces.',
      priority: 'medium'
    });
  }

  // Check for patterns in accepted suggestions
  const acceptedSuggestions = optimizationSessions.filter(s => s.start && s.end);
  if (acceptedSuggestions.length > 0) {
    const taskTypes = acceptedSuggestions.map(s => s.suggestionText.toLowerCase());
    
    if (taskTypes.some(t => t.includes('creative') || t.includes('art'))) {
      recommendations.push({
        type: 'preference',
        title: 'Embrace Your Creative Side',
        description: 'You seem to enjoy creative tasks. Consider scheduling more creative activities.',
        priority: 'low'
      });
    }
  }

  return recommendations;
} 