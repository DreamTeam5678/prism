"use client";
import NavBar from "./../NavBar/NavBar";
import { useState, useEffect, KeyboardEvent } from "react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newText, setNewText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setTasks)
      .catch(console.error);
  }, []);

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
      const newTask = await res.json();
      setTasks([...tasks, newTask]);
    }
    setNewText("");
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
    if (res.ok) {
      const updated = await res.json();
      setTasks(tasks.map((t) => t.id === id ? updated : t));
    }
  };

  const del = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const saveEdit = async () => {
    if (!editId) return;
    const res = await fetch(`/api/tasks/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editText,
        completed: false,
        priority: tasks.find((t) => t.id === editId)!.priority,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks(tasks.map((t) => t.id === editId ? updated : t));
      setEditId(null);
      setEditText("");
    }
  };

  const changePriority = async (id: string, priority: string) => {
    const t = tasks.find((t) => t.id === id);
    if (!t) return;
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t.title, completed: t.completed, priority }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks(tasks.map((t) => t.id === id ? updated : t));
    }
  };

  return (
    <div>
        <NavBar />
    <div className="task-list-container">
      <h1 className="task-list-title">Your Tasks</h1>
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
                  onClick={() => { setEditId(task.id); setEditText(task.title); }}
                >
                  📝
                </button>
                <button className="icon-btn" onClick={() => del(task.id)}>❎</button>
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
        <button className="add-task-button" onClick={add}>+</button>
      </div>

      {editId && (
        <div className="task-edit-container">
          <input
            className="task-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && saveEdit()}
          />
          <button className="add-task-button" onClick={saveEdit}>Save</button>
        </div>
      )}
    </div>
    </div>
  );
}