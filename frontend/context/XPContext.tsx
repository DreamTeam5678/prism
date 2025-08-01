"use client";
import { createContext, useContext, useEffect, useState } from "react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  scheduled: boolean;
  timestamp?: string;
  userId: string;
}

interface XPContextType {
  xp: number;
  streak: number;
  tasks: Task[];
  refreshTasks: () => void;
  addXP: (amount: number) => void;
  updateStreak: (newStreak: number) => void;
}

const XPContext = createContext<XPContextType>({
  xp: 0,
  streak: 0,
  tasks: [],
  refreshTasks: () => {},
  addXP: () => {},
  updateStreak: () => {},
});

export function XPProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userXP, setUserXP] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState<Date | null>(null);

  const fetchTasks = () => {
    console.log('🔄 Fetching tasks...');
    fetch("/api/tasks")
      .then((r) => {
        console.log('📡 Tasks API response status:', r.status);
        return r.ok ? r.json() : Promise.reject();
      })
      .then((tasks) => {
        console.log('✅ Tasks fetched successfully:', tasks);
        setTasks(tasks);
      })
      .catch((error) => {
        console.error('❌ Error fetching tasks:', error);
      });
  };

  const fetchUserXP = async () => {
    try {
      const response = await fetch('/api/user/xp');
      if (response.ok) {
        const data = await response.json();
        setUserXP(data.xp);
        setUserStreak(data.streak);
        setLastCompletionDate(data.lastCompletionDate ? new Date(data.lastCompletionDate) : null);
        console.log('✅ User XP data loaded:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching user XP:', error);
    }
  };

  const saveUserXP = async (xp: number, streak: number, completionDate?: Date) => {
    try {
      const response = await fetch('/api/user/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xp,
          streak,
          lastCompletionDate: completionDate?.toISOString()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserXP(data.xp);
        setUserStreak(data.streak);
        setLastCompletionDate(data.lastCompletionDate ? new Date(data.lastCompletionDate) : null);
        console.log('✅ User XP data saved:', data);
      }
    } catch (error) {
      console.error('❌ Error saving user XP:', error);
    }
  };

  const addXP = async (amount: number) => {
    const newXP = userXP + amount;
    await saveUserXP(newXP, userStreak);
    console.log(`🎉 Added ${amount} XP! Total XP: ${newXP}`);
  };

  const updateStreak = async (newStreak: number) => {
    await saveUserXP(userXP, newStreak);
    console.log(`🔥 Updated streak to: ${newStreak}`);
  };

  useEffect(() => {
    fetchTasks();
    fetchUserXP();
  }, []);

  // Listen for optimization and Pomodoro events
  useEffect(() => {
    const handleOptimizationComplete = () => {
      addXP(100);
      console.log('🎯 Optimization completed! +100 XP');
    };

    const handlePomodoroComplete = () => {
      addXP(100);
      console.log('⏰ Pomodoro session completed! +100 XP');
    };

    document.addEventListener('optimizeComplete', handleOptimizationComplete);
    document.addEventListener('pomodoroComplete', handlePomodoroComplete);

    return () => {
      document.removeEventListener('optimizeComplete', handleOptimizationComplete);
      document.removeEventListener('pomodoroComplete', handlePomodoroComplete);
    };
  }, [addXP]);

  // Calculate total XP from tasks + user XP
  const xpPerTask = 10;
  const xpBonusHighPriority = 10;
  const completed = tasks.filter((t: Task) => t.completed);
  const taskBonusXP = completed.filter((t: Task) => t.priority === "high").length * xpBonusHighPriority;
  const totalXP = completed.length * xpPerTask + taskBonusXP + userXP;

  return (
    <XPContext.Provider value={{ 
      xp: totalXP, 
      streak: userStreak, 
      tasks, 
      refreshTasks: fetchTasks, 
      addXP, 
      updateStreak 
    }}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  return useContext(XPContext);
}