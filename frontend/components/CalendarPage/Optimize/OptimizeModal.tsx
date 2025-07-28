// frontend/components/CalendarPage/Optimize/OptimizeModal.tsx
"use client";
import { useEffect, useState } from "react";
import MoodSelector from "../../MoodSelector/MoodSelector";
import styles from './OptimizeModal.module.css';
//import { format, set } from 'date-fns';
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
  const [retryingSuggestions, setRetryingSuggestions] = useState<Set<string>>(new Set()); // Add loading state for retries
  const [taskBankTasks, setTaskBankTasks] = useState<any[]>([]); // Store task bank tasks from generate API
  const [hasAttemptedOptimization, setHasAttemptedOptimization] = useState<boolean>(false); // Track if optimization was attempted

  const [showCelebration, setShowCelebration] = useState<boolean>(false); // Celebration modal
  const [celebrationMessage, setCelebrationMessage] = useState<string>(''); // Celebration message

  const formatTime = (date: string) => {
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        console.error('Invalid date string:', date);
        return 'Invalid time';
      }
      return parsedDate.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } catch (error) {
      console.error('Error formatting time:', error, 'for date:', date);
      return 'Invalid time';
    }
  };



  // Smart intervention system
  const checkForInterventions = () => {
    const now = new Date();
    const hour = now.getHours();
    
    // Check for long work sessions
    const lastBreak = localStorage.getItem('lastBreakTime');
    if (lastBreak) {
      const timeSinceBreak = now.getTime() - parseInt(lastBreak);
      const hoursSinceBreak = timeSinceBreak / (1000 * 60 * 60);
      
      if (hoursSinceBreak >= 2) {
        setCelebrationMessage(`🎉 Amazing! You've been working for ${Math.floor(hoursSinceBreak)} hours. Time for a well-deserved break!`);
        setShowCelebration(true);
        localStorage.setItem('lastBreakTime', now.getTime().toString());
      }
    }
  };

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

  // Check for interventions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkForInterventions();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);



  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Validate time zone on client side
  const validatedTimeZone = moment.tz.names().includes(timeZone) ? timeZone : 'UTC';

  const handleGenerateSuggestions = async () => {
    setIsGeneratingSuggestions(true); // Start loading spinner
    setLoading(true);
    setError(null); // Reset error state
    setHasAttemptedOptimization(true); // Mark that optimization has been attempted
    try {
      const res = await fetch("/api/suggestions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, location, weather, timeZone: validatedTimeZone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      console.log("📥 Generate API response:", data);
      setSuggestions(data.suggestions);
      setTaskBankTasks(data.taskBankTasks || []); // Store task bank tasks from API
      console.log("📋 Task bank tasks from API:", data.taskBankTasks);
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
    setRetryingSuggestions(prev => new Set(prev).add(s.id)); // Add to retrying set
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
    } finally {
      setRetryingSuggestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(s.id);
        return newSet;
      }); // Remove from retrying set
    }
  };

  useEffect(() => {
    if (
      suggestions.length > 0 &&
      Object.keys(responded).length === suggestions.length
    ) {
      (async () => {
        // Use task bank tasks from generate API response
        console.log("📤 Sending task bank tasks to calendar:", { tasks: taskBankTasks });
        
        const response = await fetch("/api/calendar/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suggestions: [], // GPT suggestions already scheduled in generate.ts
            tasks: taskBankTasks.map((t) => ({
              ...t,
              source: "task_bank",
              color: "#ebdbb4",
            })),
          }),
        });
        
        const responseData = await response.json();
        console.log("📥 Calendar add API response:", responseData);
        
        if (!response.ok) {
          console.error("❌ Calendar add API failed:", responseData);
          setError(responseData.message || "Failed to schedule tasks");
          return;
        }

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
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className={styles.optimizeTaskCard}>
                    <div className={styles.optimizeTaskTitle}>{task.title}</div>
                    <div className={styles.optimizeTaskTime}>Priority: {task.priority}</div>
                  </div>
                ))
              ) : (
                <p>All tasks are already scheduled or completed!</p>
              )}

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
                        <button 
                          onClick={() => handleRetry(s)}
                          disabled={retryingSuggestions.has(s.id)}
                          className={retryingSuggestions.has(s.id) ? styles.retryLoading : ''}
                        >
                          🔄
                        </button>
                        <button onClick={() => handleReject(s)}>❌</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isGeneratingSuggestions && hasAttemptedOptimization && suggestions.length === 0 && taskBankTasks.length === 0 && (
              <div className={styles.optimizeSection}>
                <h2>Your day is already fully optimized! All tasks are scheduled and there's no room for additional suggestions</h2>
              </div>
            )}



            {/* Celebration Modal */}
            {showCelebration && (
              <div className={styles.celebrationOverlay}>
                <div className={styles.celebrationModal}>
                  <div className={styles.celebrationContent}>
                    <h2>🎉 Celebration Time!</h2>
                    <p>{celebrationMessage}</p>
                    <button 
                      onClick={() => setShowCelebration(false)}
                      className={styles.celebrationButton}
                    >
                      Continue Working
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}