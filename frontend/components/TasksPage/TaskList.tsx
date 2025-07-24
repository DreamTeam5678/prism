"use client";
import NavBar from "./../NavBar/NavBar";
import AchievementBar from "../AchievementBar";
import XPBar from "../XPBar";

import { useState, KeyboardEvent } from "react";
import { useXP } from "@/context/XPContext"; // ✅ use shared XP/tasks

export default function TaskList() {
  const { xp, tasks, refreshTasks } = useXP(); // ✅ shared data
  const [newText, setNewText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  const add = async () => {
    if (!newText.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newText,
        completed: false,
        priority: "low",
      }),
    });
    if (res.ok) {
      setNewText("");
      refreshTasks(); // ✅ reload tasks from server
    }
  };

  const toggle = async (id: string) => {
    const t = tasks.find((t) => t.id === id);
    if (!t) return;
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: t.title,
        completed: !t.completed,
        priority: t.priority,
      }),
    });
    if (res.ok) refreshTasks(); // ✅ reload tasks
  };

  const del = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    refreshTasks(); // ✅ reload tasks
  };

  const saveEdit = async () => {
    if (!editId) return;
    const task = tasks.find((t) => t.id === editId);
    if (!task) return;
    const res = await fetch(`/api/tasks/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editText,
        completed: false,
        priority: task.priority,
      }),
    });
    if (res.ok) {
      setEditId(null);
      setEditText("");
      refreshTasks(); // ✅ reload tasks
    }
  };

  const changePriority = async (id: string, priority: string) => {
    const t = tasks.find((t) => t.id === id);
    if (!t) return;
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: t.title,
        completed: t.completed,
        priority,
      }),
    });
    if (res.ok) refreshTasks(); // ✅ reload tasks
  };

  return (
    <div>
      <NavBar />
      

      <XPBar xp={xp} />

      <div className="task-list-container">
        <h1 className="task-list-title">Your Tasks</h1>

        <AchievementBar completed={completedTasks} total={totalTasks} />

        <div className="task-list">
          {tasks.map((task) => (
            <div key={task.id} className="task-item">
              <div className="task-item-top">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggle(task.id)}
                />
                <div className={`task-item-title ${task.completed ? "completed" : ""}`}>
                  {task.title}
                </div>
                <div className="task-item-controls">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditId(task.id);
                      setEditText(task.title);
                    }}
                  >
                    📝
                  </button>
                  <button className="icon-btn" onClick={() => del(task.id)}>
                    ❎
                  </button>
                </div>
              </div>
              <select
                className="priority-select"
                value={task.priority}
                onChange={(e) => changePriority(task.id, e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          ))}
        </div>

        <div className="task-input-container">
          <input
            className="task-input"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && add()}
            placeholder="Add a new task…"
          />
          <button className="add-task-button" onClick={add}>
            +
          </button>
        </div>

        {editId && (
          <div className="task-edit-container">
            <input
              className="task-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && saveEdit()}
            />
            <button className="add-task-button" onClick={saveEdit}>
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}