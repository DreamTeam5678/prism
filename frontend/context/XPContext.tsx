"use client";
import { createContext, useContext, useEffect, useState } from "react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

interface XPContextType {
  xp: number;
  tasks: Task[];
  refreshTasks: () => void;
}

const XPContext = createContext<XPContextType>({
  xp: 0,
  tasks: [],
  refreshTasks: () => {},
});

export function XPProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = () => {
    fetch("/api/tasks")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setTasks)
      .catch(console.error);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const xpPerTask = 10;
  const xpBonusHighPriority = 10;
  const completed = tasks.filter((t) => t.completed);
  const bonusXP = completed.filter((t) => t.priority === "high").length * xpBonusHighPriority;
  const xp = completed.length * xpPerTask + bonusXP;

  return (
    <XPContext.Provider value={{ xp, tasks, refreshTasks: fetchTasks }}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  return useContext(XPContext);
}