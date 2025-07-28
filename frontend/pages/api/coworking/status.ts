import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'status' | 'achievement';
}

interface CoworkingUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'focus' | 'break' | 'available' | 'meeting' | 'creative';
  currentTask: string;
  focusTime: number;
  productivity: number;
  location: string;
  mood: string;
  achievements: string[];
  isOnline: boolean;
  lastActive: Date;
  joinTime: Date;
}

// In-memory storage for demo (in production, use Redis or database)
let coworkingUsers: CoworkingUser[] = [];
let chatMessages: ChatMessage[] = [];
let roomStats = {
  totalUsers: 0,
  focusUsers: 0,
  avgProductivity: 0,
  totalFocusTime: 0,
  messagesToday: 0
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { action } = req.query;

    if (action === 'users') {
      return res.status(200).json({
        users: coworkingUsers,
        stats: roomStats
      });
    }

    if (action === 'messages') {
      return res.status(200).json({
        messages: chatMessages.slice(-50) // Last 50 messages
      });
    }

    // Default: return everything
    return res.status(200).json({
      users: coworkingUsers,
      messages: chatMessages.slice(-20),
      stats: roomStats
    });
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { action, ...data } = req.body;

    if (action === 'join') {
      // User joining the coworking space
      const existingUser = coworkingUsers.find(u => u.email === session.user.email);
      
      if (!existingUser) {
        const newUser: CoworkingUser = {
          id: `user_${Date.now()}`,
          name: session.user.name || 'Anonymous',
          email: session.user.email,
          avatar: '👤',
          status: 'available',
          currentTask: 'Just joined the workspace',
          focusTime: 0,
          productivity: 85,
          location: 'Unknown',
          mood: 'Excited to collaborate',
          achievements: ['New Member'],
          isOnline: true,
          lastActive: new Date(),
          joinTime: new Date()
        };
        
        coworkingUsers.push(newUser);
        
        // Add welcome message
        chatMessages.push({
          id: `msg_${Date.now()}`,
          userId: newUser.id,
          userName: newUser.name,
          message: `👋 Just joined the coworking space!`,
          timestamp: new Date(),
          type: 'status'
        });
      } else {
        // User rejoining
        existingUser.isOnline = true;
        existingUser.lastActive = new Date();
      }

      updateRoomStats();
      return res.status(200).json({ message: "Joined successfully" });
    }

    if (action === 'update_status') {
      const { status, task, mood } = data;
      const user = coworkingUsers.find(u => u.email === session.user.email);
      
      if (user) {
        const oldStatus = user.status;
        user.status = status;
        user.currentTask = task;
        user.mood = mood;
        user.lastActive = new Date();

        // Add status change message
        if (oldStatus !== status) {
          chatMessages.push({
            id: `msg_${Date.now()}`,
            userId: user.id,
            userName: user.name,
            message: `🔄 Changed status to ${status} - ${task}`,
            timestamp: new Date(),
            type: 'status'
          });
        }
      }

      updateRoomStats();
      return res.status(200).json({ message: "Status updated" });
    }

    if (action === 'send_message') {
      const { message } = data;
      const user = coworkingUsers.find(u => u.email === session.user.email);
      
      if (user && message.trim()) {
        chatMessages.push({
          id: `msg_${Date.now()}`,
          userId: user.id,
          userName: user.name,
          message: message.trim(),
          timestamp: new Date(),
          type: 'chat'
        });
        
        roomStats.messagesToday++;
      }

      return res.status(200).json({ message: "Message sent" });
    }

    if (action === 'leave') {
      const user = coworkingUsers.find(u => u.email === session.user.email);
      if (user) {
        user.isOnline = false;
        user.lastActive = new Date();
        
        chatMessages.push({
          id: `msg_${Date.now()}`,
          userId: user.id,
          userName: user.name,
          message: `👋 Left the coworking space`,
          timestamp: new Date(),
          type: 'status'
        });
      }

      updateRoomStats();
      return res.status(200).json({ message: "Left successfully" });
    }

    if (action === 'achievement') {
      const { achievement } = data;
      const user = coworkingUsers.find(u => u.email === session.user.email);
      
      if (user && !user.achievements.includes(achievement)) {
        user.achievements.push(achievement);
        
        chatMessages.push({
          id: `msg_${Date.now()}`,
          userId: user.id,
          userName: user.name,
          message: `🏆 Unlocked achievement: ${achievement}!`,
          timestamp: new Date(),
          type: 'achievement'
        });
      }

      return res.status(200).json({ message: "Achievement recorded" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

function updateRoomStats() {
  const onlineUsers = coworkingUsers.filter(u => u.isOnline);
  roomStats.totalUsers = onlineUsers.length;
  roomStats.focusUsers = onlineUsers.filter(u => u.status === 'focus').length;
  roomStats.avgProductivity = onlineUsers.length > 0 
    ? Math.round(onlineUsers.reduce((sum, u) => sum + u.productivity, 0) / onlineUsers.length)
    : 0;
  roomStats.totalFocusTime = onlineUsers.reduce((sum, u) => sum + u.focusTime, 0);
} 