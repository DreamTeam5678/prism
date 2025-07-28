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
  tasks: Task[];
  refreshTasks: () => void;
  addXP: (amount: number) => void;
}

const XPContext = createContext<XPContextType>({
  xp: 0,
  tasks: [],
  refreshTasks: () => {},
  addXP: () => {},
});

export function XPProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bonusXP, setBonusXP] = useState(1000); // Set to level 10 (1000 XP needed)

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

  const addXP = (amount: number) => {
    setBonusXP(prev => prev + amount);
    console.log(`🎉 Added ${amount} XP! Total bonus XP: ${bonusXP + amount}`);
  };

  useEffect(() => {
    fetchTasks();
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
  }, []);

  const xpPerTask = 10;
  const xpBonusHighPriority = 10;
  const completed = tasks.filter((t) => t.completed);
  const taskBonusXP = completed.filter((t) => t.priority === "high").length * xpBonusHighPriority;
  const xp = completed.length * xpPerTask + taskBonusXP + bonusXP;

  return (
    <XPContext.Provider value={{ xp, tasks, refreshTasks: fetchTasks, addXP }}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  return useContext(XPContext);
}