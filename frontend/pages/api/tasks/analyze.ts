import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { taskTitle } = req.body;
  if (!taskTitle) {
    return res.status(400).json({ message: "Task title is required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get task history for analysis
    const taskHistory = await prisma.task.findMany({
      where: {
        userId: user.id,
        title: {
          contains: taskTitle,
          mode: 'insensitive'
        },
        completed: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20 // Last 20 completions
    });

    if (taskHistory.length === 0) {
      return res.status(200).json({
        message: "No history found for this task",
        suggestions: "Try completing this task a few times to get personalized insights!"
      });
    }

    // Calculate insights
    const insights = calculateTaskInsights(taskHistory, taskTitle);

    return res.status(200).json(insights);
  } catch (error) {
    console.error("Task analysis failed:", error);
    return res.status(500).json({ message: "Failed to analyze task" });
  }
}

function calculateTaskInsights(taskHistory: any[], taskTitle: string) {
  // Calculate average duration (using createdAt and updatedAt as approximation)
  const durations = taskHistory
    .filter(task => task.updatedAt && task.createdAt)
    .map(task => {
      const start = new Date(task.createdAt);
      const end = new Date(task.updatedAt);
      return (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes
    });

  const avgDuration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  // Find best time of day
  const timeSlots = taskHistory
    .filter(task => task.updatedAt)
    .map(task => {
      const completedAt = new Date(task.updatedAt);
      return completedAt.getHours();
    });

  const timeCounts: { [key: number]: number } = {};
  timeSlots.forEach(hour => {
    timeCounts[hour] = (timeCounts[hour] || 0) + 1;
  });

  const bestHour = Object.entries(timeCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];

  const bestTime = bestHour ? `${bestHour}:00` : null;

  // Calculate completion rate
  const totalAttempts = taskHistory.length;
  const completedTasks = taskHistory.filter(task => task.completed).length;
  const completionRate = Math.round((completedTasks / totalAttempts) * 100);

  // Generate smart suggestions
  let suggestions = "";
  if (avgDuration && avgDuration > 60) {
    suggestions += "This task takes longer than expected. Consider breaking it into smaller chunks. ";
  }
  if (bestTime) {
    suggestions += `You're most productive with this task around ${bestTime}. Try scheduling it then. `;
  }
  if (completionRate < 70) {
    suggestions += "This task has a lower completion rate. Consider making it more engaging or breaking it down. ";
  }
  if (!suggestions) {
    suggestions = "Great job! You're consistently completing this task. Keep up the momentum!";
  }

  return {
    avgDuration,
    bestTime,
    completionRate,
    suggestions,
    totalAttempts,
    completedTasks
  };
} 