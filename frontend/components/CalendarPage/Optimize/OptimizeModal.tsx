// frontend/components/CalendarPage/Optimize/OptimizeModal.tsx
"use client";
import { useEffect, useState } from "react";
import MoodSelector from "../../MoodSelector/MoodSelector";
import styles from './OptimizeModal.module.css';
import { format, set } from 'date-fns';
import moment from 'moment-timezone'; // Import moment-timezone
import OptimizeAnalytics from "./OptimizeAnalytics";

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

interface Task {
  id: string;
  title: string;
  completed: boolean;
  scheduled: boolean;
  priority: "low" | "medium" | "high";
}

interface GPTSuggestion {
  id: string;
  title: string; // Changed from suggestionText to title to match API response
  timestamp?: string;
  start: string;
  end: string;
  priority?: string;
  reason?: string;
}

type Mood = {
  emoji: string;
  label: string;
};

interface OptimizeModalProps {
  onClose: () => void;
  setLoading: (value: boolean) => void;
}

export default function OptimizeModal({ onClose, setLoading }: OptimizeModalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [suggestions, setSuggestions] = useState<GPTSuggestion[]>([]);
  const [responded, setResponded] = useState<Record<string, boolean>>({});
  const [accepted, setAccepted] = useState<GPTSuggestion[]>([]);
  const [mood, setMood] = useState<string>("");
  const [weather, setWeather] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [error, setError] = useState<string | null>(null); // Add error state
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState<boolean>(false); // Add loading state for suggestions
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false); // Add analytics state

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

  const isReady = mood && weather && location;

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: Task[]) => setTasks(data.filter(t => !t.completed)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      setLocation("");

      try {
        const weatherRes = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
        const weatherData = await weatherRes.json();
        if (weatherRes.ok) {
          setWeather(weatherData.condition);
        } else {
          console.warn("⚠️ Weather API returned:", weatherData.message);
          setWeather("unknown");
        }
      } catch (err) {
        console.error("Weather fetch failed:", err);
        setWeather("unknown");
      }
    });
  }, []);

  const handleMoodSelect = async (m: Mood) => {
    setMood(m.label);
    try {
      await fetch("/api/mood/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: m.label }),
      });
    } catch (error) {
      console.error("Failed to log mood:", error);
    }
  };

  useEffect(() => {
    if (isReady && suggestions.length === 0) {
      handleGenerateSuggestions();
    }
  }, [isReady]);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Validate time zone on client side
  const validatedTimeZone = moment.tz.names().includes(timeZone) ? timeZone : 'UTC';

  const handleGenerateSuggestions = async () => {
    setIsGeneratingSuggestions(true); // Start loading spinner
    setLoading(true);
    setError(null); // Reset error state
    try {
      const res = await fetch("/api/suggestions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, location, weather, timeZone: validatedTimeZone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuggestions(data.suggestions);
      if (data.suggestions.length === 0){
        setError(data.message || "No available time slots today between 8:00AM and 8:00PM"); 
      }
    } catch (err) {
      console.error("❌ Failed to generate suggestions:", err);
      setError("Failed to generate suggestions. Please try again.");
    } finally {
      setIsGeneratingSuggestions(false); // Stop loading spinner
      setLoading(false);
    }
  };

  const handleAccept = (s: GPTSuggestion) => {
    setAccepted(prev => [...prev, s]);
    setResponded(prev => ({ ...prev, [s.id]: true }));
  };

  const handleReject = (s: GPTSuggestion) => {
    setResponded(prev => ({ ...prev, [s.id]: true }));
  };

  const handleRetry = async (s: GPTSuggestion) => {
    try {
      const res = await fetch("/api/suggestions/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalSuggestion: s }),
      });
      const newSuggestion = await res.json();
      if (res.ok) {
        setSuggestions(prev =>
          prev.map(item => item.id === s.id ? newSuggestion : item)
        );
        setResponded(prev => {
          const updated = { ...prev };
          delete updated[s.id];
          return updated;
        });
      } else {
        setError("Failed to retry suggestion. Please try again.");
      }
    } catch (err) {
      console.error("Failed to retry suggestion:", err);
      setError("Failed to retry suggestion. Please try again.");
    }
  };

  useEffect(() => {
    if (
      suggestions.length > 0 &&
      Object.keys(responded).length === suggestions.length
    ) {
      (async () => {
        // Only send unscheduled tasks to calendar add API
        const unscheduledTasks = tasks.filter(task => !task.scheduled);
        console.log("📤 Sending unscheduled task bank tasks to calendar:", { tasks: unscheduledTasks });
        
        await fetch("/api/calendar/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suggestions: [], // GPT suggestions already scheduled in generate.ts
            tasks: unscheduledTasks.map((t) => ({
              ...t,
              source: "task_bank",
              color: "#ebdbb4",
            })),
          }),
        });

        document.dispatchEvent(new CustomEvent("optimizeComplete"));
        onClose();
      })();
    }
  }, [responded]);

  return (
    <div className={styles.optimizeOverlay}>
      <div className={styles.optimizeModal}>
        <button onClick={onClose} className={styles.closeButton}>×</button>
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        {showAnalytics ? (
          <div className={styles.analyticsSection}>
            <button 
              onClick={() => setShowAnalytics(false)} 
              className={styles.backButton}
            >
              ← Back to Optimization
            </button>
            <OptimizeAnalytics />
          </div>
        ) : (
          <>
            <div className={styles.optimizeSection}>
              <button 
                onClick={() => setShowAnalytics(true)}
                className={styles.analyticsButton}
              >
                📊 View Analytics
              </button>
              <h2>Uncompleted Tasks</h2>
              {tasks.map((task) => (
                <div key={task.id} className={styles.optimizeTaskCard}>
                  <div className={styles.optimizeTaskTitle}>{task.title}</div>
                  <div className={styles.optimizeTaskTime}>Priority: {task.priority}</div>
                </div>
              ))}
            </div>

            <div className={styles.optimizeSection}>
              <MoodSelector onSelectMood={handleMoodSelect} onClose={() => {}} disabled={suggestions.length > 0} />
            </div>

            <div className={styles.optimizeSection}>
              <h2>Where are you today?</h2>
              <select
                className={styles.inputField}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select a location</option>
                <option value="home">🏠 Home</option>
                <option value="work">💼 Work</option>
                <option value="campus">📚 Campus</option>
                <option value="commuting">🚗 Commuting</option>
                <option value="cafe">☕ Cafe</option>
                <option value="traveling">✈️ Traveling</option>
              </select>

              <h2>What is the weather today?</h2>
              <input
                className={styles.inputField}
                type="text"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                placeholder="e.g., sunny, rainy, cold"
              />
            </div>

            {/* Loading spinner when generating suggestions */}
            {isGeneratingSuggestions && (
              <div className={styles.optimizeSection}>
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Generating smart suggestions...</p>
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className={styles.optimizeSection}>
                <h2>Smart Suggestions</h2>
                {suggestions.map((s) => {
                  const isAccepted = accepted.some(acceptedSuggestion => acceptedSuggestion.id === s.id);
                  return (
                    <div key={s.id} className={`${styles.optimizeTaskCard} ${isAccepted ? styles.acceptedTask : ''}`}>
                      <div className={styles.optimizeTaskTitle}>{s.title}</div>
                      <div className={styles.optimizeTaskTime}>
                        {formatTime(s.start)} – {formatTime(s.end)}
                      </div>
                      <div className={styles.iconRow}>
                        <button 
                          onClick={() => handleAccept(s)}
                          className={isAccepted ? styles.acceptedButton : ''}
                          disabled={isAccepted}
                        >
                          {isAccepted ? '✅' : '✅'}
                        </button>
                        <button onClick={() => handleRetry(s)}>🔁</button>
                        <button onClick={() => handleReject(s)}>❌</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}