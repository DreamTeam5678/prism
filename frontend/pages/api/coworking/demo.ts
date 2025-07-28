import { NextApiRequest, NextApiResponse } from "next";

// Demo script to simulate real users
const demoUsers = [
  {
    name: "Alex Chen",
    email: "alex@demo.com",
    avatar: "👨‍💻",
    status: "focus",
    task: "Building AI-powered productivity features",
    mood: "Focused and energized",
    location: "San Francisco, CA"
  },
  {
    name: "Sarah Kim", 
    email: "sarah@demo.com",
    avatar: "👩‍💼",
    status: "meeting",
    task: "Client presentation preparation",
    mood: "Professional and confident",
    location: "New York, NY"
  },
  {
    name: "Mike Rodriguez",
    email: "mike@demo.com", 
    avatar: "👨‍🎨",
    status: "creative",
    task: "Designing user experience flows",
    mood: "Creative and inspired",
    location: "Austin, TX"
  },
  {
    name: "Emma Watson",
    email: "emma@demo.com",
    avatar: "👩‍🔬", 
    status: "break",
    task: "Taking a well-deserved break",
    mood: "Relaxed and refreshed",
    location: "Boston, MA"
  },
  {
    name: "David Park",
    email: "david@demo.com",
    avatar: "👨‍💼",
    status: "available", 
    task: "Code review and optimization",
    mood: "Analytical and precise",
    location: "Seattle, WA"
  }
];

const demoMessages = [
  "Hey everyone! How's the productivity going today?",
  "Just finished a 2-hour deep work session. Feeling accomplished! 🎯",
  "Anyone up for a quick brainstorming session?",
  "Love the energy in this virtual space! 💪",
  "Taking a coffee break. Back in 15 minutes ☕",
  "Just hit my daily goal! 🎉",
  "The focus music playlist is amazing today",
  "Anyone else working on AI features? Would love to collaborate!",
  "Great work everyone! Let's keep the momentum going 🚀",
  "Just joined the space. Excited to work alongside you all!"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'populate') {
      // This would be called to populate the coworking space with demo users
      // In a real app, this would be done through actual user registrations
      
      return res.status(200).json({ 
        message: "Demo users ready to join",
        users: demoUsers,
        messages: demoMessages
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
} 