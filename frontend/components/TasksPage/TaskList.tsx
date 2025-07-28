"use client";
import NavBar from "./../NavBar/NavBar";
import AchievementBar from "../AchievementBar";
import XPBar from "../XPBar";
import SmartTaskInput from "../SmartTaskInput/SmartTaskInput";
import GamesModal from "../Games/GamesModal";
import VoiceCommandManager from "../VoiceCommands/VoiceCommandManager";
import VoiceCommandToggle from "../VoiceCommands/VoiceCommandToggle";
import { useState, KeyboardEvent, useEffect } from "react";
import { useXP } from "@/context/XPContext";
import { ParsedTask } from "@/lib/utils/naturalLanguageParser";

export default function TaskList() {
  const { xp, tasks, refreshTasks } = useXP();
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const level = Math.floor(xp / 100);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  // Confetti animation effect
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleTaskCreate = async (parsedTask: ParsedTask) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: parsedTask.title,
        completed: false,
        priority: parsedTask.priority,
        scheduled: parsedTask.scheduled,
        timestamp: parsedTask.timestamp?.toISOString(),
      }),
    });
    if (res.ok) {
      refreshTasks();
    }
  };

  const toggle = async (id: string) => {
    console.log('🔄 Toggle called for task:', id);
    const t = tasks.find((t) => t.id === id);
    if (!t) {
      console.error('❌ Task not found:', id);
      return;
    }

    console.log('📝 Current task state:', { id: t.id, title: t.title, completed: t.completed });
    
    // Set completing state for animation
    setCompletingTaskId(id);
    
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t.title,
          completed: !t.completed,
          priority: t.priority,
        }),
      });
      
      console.log('📡 API response status:', res.status);
      
      if (res.ok) {
        const updatedTask = await res.json();
        console.log('✅ Task updated successfully:', updatedTask);
        
        // Show confetti if task was completed
        if (!t.completed) {
          setShowConfetti(true);
        }
        
        // Clear completing state after animation
        setTimeout(() => {
          setCompletingTaskId(null);
          refreshTasks();
        }, 500);
      } else {
        const errorData = await res.json();
        console.error('❌ API error:', errorData);
        setCompletingTaskId(null);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setCompletingTaskId(null);
    }
  };

  const del = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    refreshTasks();
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
      refreshTasks();
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
    if (res.ok) refreshTasks();
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🟢";
      default: return "🟢";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "#ff6b6b";
      case "medium": return "#ffd93d";
      case "low": return "#6bcf7f";
      default: return "#6bcf7f";
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case "high": return "rgba(255, 107, 107, 0.1)";
      case "medium": return "rgba(255, 217, 61, 0.1)";
      case "low": return "rgba(107, 207, 127, 0.1)";
      default: return "rgba(107, 207, 127, 0.1)";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="task-page">
              <XPBar xp={xp} onShowGames={() => setShowGames(true)} />
      <NavBar />
      <div className="task-container">
        <div className="task-header">
          <h1 className="task-title">Your Tasks</h1>
          <div className="task-stats">
            <span className="stat-item">
              <span className="stat-number">{completedTasks}</span>
              <span className="stat-label">Completed</span>
            </span>
            <span className="stat-item">
              <span className="stat-number">{totalTasks - completedTasks}</span>
              <span className="stat-label">Remaining</span>
            </span>
            <span className="stat-item">
              <span className="stat-number">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
              <span className="stat-label">Progress</span>
            </span>
          </div>
        </div>

        <AchievementBar completed={completedTasks} total={totalTasks} />

        <div className="task-sections">
          {/* Active Tasks */}
          <div className="task-section">
            <h2 className="section-title">
              <span className="section-icon">📋</span>
              Active Tasks ({tasks.filter(t => !t.completed).length})
            </h2>
            <div className="task-grid">
              {tasks
                .filter(task => !task.completed)
                .map((task) => (
                  <div 
                    key={task.id} 
                    className={`task-card ${completingTaskId === task.id ? 'completing' : ''}`}
                    style={{
                      borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                      backgroundColor: getPriorityBgColor(task.priority)
                    }}
                  >
                    <div className="task-card-header">
                      <div className="task-checkbox" onClick={() => toggle(task.id)}>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggle(task.id)}
                          className="custom-checkbox"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="checkmark"></span>
                      </div>
                      <div className="task-priority">
                        <span className="priority-icon">{getPriorityIcon(task.priority)}</span>
                        <span className="priority-text">{task.priority}</span>
                      </div>
                    </div>
                    
                    <div className="task-content">
                      {editId === task.id ? (
                        <div className="edit-container">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && saveEdit()}
                            className="edit-input"
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button onClick={saveEdit} className="save-btn">✅</button>
                            <button onClick={() => setEditId(null)} className="cancel-btn">❌</button>
                          </div>
                        </div>
                      ) : (
                        <div className="task-title-text">{task.title}</div>
                      )}
                    </div>

                    <div className="task-card-footer">
                      <div className="task-meta">
                        {task.createdAt && (
                          <span className="task-date">{formatDate(task.createdAt)}</span>
                        )}
                      </div>
                      <div className="task-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => {
                            setEditId(task.id);
                            setEditText(task.title);
                          }}
                          title="Edit task"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => del(task.id)}
                          title="Delete task"
                        >
                          🗑️
                        </button>
                        <select
                          className="priority-select"
                          value={task.priority}
                          onChange={(e) => changePriority(task.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Completed Tasks */}
          {tasks.filter(t => t.completed).length > 0 && (
            <div className="task-section">
              <h2 className="section-title">
                <span className="section-icon">✅</span>
                Completed ({tasks.filter(t => t.completed).length})
              </h2>
              <div className="task-grid completed-grid">
                {tasks
                  .filter(task => task.completed)
                  .map((task) => (
                    <div 
                      key={task.id} 
                      className="task-card completed"
                      style={{
                        borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                        backgroundColor: getPriorityBgColor(task.priority)
                      }}
                    >
                      <div className="task-card-header">
                        <div className="task-checkbox" onClick={() => toggle(task.id)}>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggle(task.id)}
                            className="custom-checkbox"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="checkmark completed"></span>
                        </div>
                        <div className="task-priority">
                          <span className="priority-icon">{getPriorityIcon(task.priority)}</span>
                          <span className="priority-text">{task.priority}</span>
                        </div>
                      </div>
                      
                      <div className="task-content">
                        <div className="task-title-text completed">{task.title}</div>
                      </div>

                      <div className="task-card-footer">
                        <div className="task-meta">
                          {task.createdAt && (
                            <span className="task-date">{formatDate(task.createdAt)}</span>
                          )}
                        </div>
                        <div className="task-actions">
                          <button
                            className="action-btn delete-btn"
                            onClick={() => del(task.id)}
                            title="Delete task"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Smart Task Input */}
        <div className="smart-input-container">
          <SmartTaskInput onTaskCreate={handleTaskCreate} />
        </div>

        {/* Confetti Animation */}
        {showConfetti && (
          <div className="confetti-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>
        )}

        {/* Games Modal */}
        {showGames && (
          <GamesModal
            isVisible={showGames}
            onClose={() => setShowGames(false)}
            userLevel={level}
            userXP={xp}
          />
        )}
      </div>

      <style jsx>{`
                  .task-page {
            min-height: 100vh;
            padding: 20px;
            padding-top: 0px; /* minimal top padding */
          }

        .task-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .task-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .task-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 20px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .task-stats {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-top: 20px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 15px 25px;
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-number {
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
        }

        .stat-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 5px;
        }

        .task-sections {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .task-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          border-radius: 20px;
          padding: 25px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.3rem;
          font-weight: 600;
          color: white;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .section-icon {
          font-size: 1.5rem;
        }

        .task-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .completed-grid {
          opacity: 0.7;
        }

        .task-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .task-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .task-card.completing {
          animation: completeTask 0.5s ease;
        }

        .task-card.completed {
          opacity: 0.6;
        }

        .task-card.completed .task-title-text {
          text-decoration: line-through;
          color: #888;
        }

        .task-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .task-checkbox {
          position: relative;
          display: inline-block;
          cursor: pointer;
          padding: 5px;
          border-radius: 6px;
          transition: background-color 0.2s ease;
        }

        .task-checkbox:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .custom-checkbox {
          opacity: 0;
          position: absolute;
          cursor: pointer;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 1;
        }

        .checkmark {
          display: inline-block;
          width: 24px;
          height: 24px;
          background: #f0f0f0;
          border: 2px solid #ddd;
          border-radius: 6px;
          position: relative;
          transition: all 0.3s ease;
          z-index: 0;
        }

        .task-checkbox:active .checkmark {
          transform: scale(0.95);
          background: #e0e0e0;
        }

        .checkmark.completed {
          background: #4CAF50;
          border-color: #4CAF50;
        }

        .checkmark.completed::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-weight: bold;
          font-size: 14px;
        }

        .task-priority {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .priority-icon {
          font-size: 1.1rem;
        }

        .priority-text {
          text-transform: capitalize;
          color: #666;
        }

        .task-content {
          margin-bottom: 15px;
        }

        .task-title-text {
          font-size: 1.1rem;
          font-weight: 500;
          color: #333;
          line-height: 1.4;
          word-break: break-word;
        }

        .edit-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .edit-input {
          width: 100%;
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .edit-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .edit-actions {
          display: flex;
          gap: 10px;
        }

        .save-btn, .cancel-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .save-btn {
          background: #4CAF50;
          color: white;
        }

        .cancel-btn {
          background: #f44336;
          color: white;
        }

        .task-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .task-meta {
          font-size: 0.85rem;
          color: #888;
        }

        .task-date {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .task-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn {
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 5px;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          background: rgba(0, 0, 0, 0.1);
          transform: scale(1.1);
        }

        .priority-select {
          padding: 5px 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
          background: white;
          cursor: pointer;
        }

        .smart-input-container {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 600px;
          z-index: 1000;
        }

        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 3000;
        }

        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confettiFall 2s linear forwards;
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes completeTask {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .task-container {
            padding: 10px;
          }

          .task-title {
            font-size: 2rem;
          }

          .task-stats {
            flex-direction: column;
            gap: 15px;
          }

          .task-grid {
            grid-template-columns: 1fr;
          }

          .floating-add-btn {
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
          }

          .modal-content {
            padding: 20px;
          }
        }

        /* Voice Command Styles */
        .voice-command-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2000;
        }
      `}</style>

      {/* Voice Command System */}
      <VoiceCommandManager
        onTaskComplete={(taskId) => toggle(taskId)}
        onTaskDelete={(taskId) => del(taskId)}
        onTaskCreate={(task) => handleTaskCreate({
          title: task.title,
          priority: task.priority || 'medium',
          scheduled: task.scheduled || false,
          timestamp: undefined,
          originalText: task.title
        })}
        tasks={tasks}
        isListening={isVoiceListening}
        onListeningChange={setIsVoiceListening}
      />

      <VoiceCommandToggle
        onToggle={setIsVoiceListening}
        isListening={isVoiceListening}
      />
    </div>
  );
}