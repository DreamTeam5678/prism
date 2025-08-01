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
  const [dayIsFull, setDayIsFull] = useState<boolean>(false); // Track if day is full

  const formatTime = (date: string) => {
    try {
      // Handle empty or null dates
      if (!date || date === 'null' || date === 'undefined') {
        console.error('Empty or null date string:', date);
        return 'Invalid time';
      }

      // Try parsing as ISO string first
      const parsedDate = new Date(date);
      
      // If that fails, try parsing as a different format
      if (isNaN(parsedDate.getTime())) {
        // Try parsing as a different format or handle edge cases
        console.warn('Failed to parse date as ISO string:', date);
        return 'Invalid time';
      }

      // Ensure the date is valid before formatting
      if (parsedDate.toString() === 'Invalid Date') {
        console.error('Invalid date object created from:', date);
        return 'Invalid time';
      }

      // Additional validation
      if (parsedDate.getFullYear() < 1900 || parsedDate.getFullYear() > 2100) {
        console.error('Date out of reasonable range:', parsedDate);
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
      
      // If task bank tasks were scheduled, refresh the calendar immediately
      if (data.taskBankTasks && data.taskBankTasks.length > 0) {
        console.log("🔄 Task bank tasks scheduled, refreshing calendar");
        document.dispatchEvent(new CustomEvent("optimizeComplete"));
      }
      
      if (data.suggestions.length === 0){
        // Check if there are task bank tasks that couldn't be scheduled
        if (data.taskBankTasks && data.taskBankTasks.length > 0) {
          setDayIsFull(true);
        } else {
        setError(data.message || "No available time slots today between 8:00AM and 8:00PM"); 
        }
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
    document.dispatchEvent(new Event("optimizeComplete"));
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
      console.log('🔄 Retry response:', newSuggestion); // Debug log
      if (res.ok) {
        // Check if the response is an error message
        if (newSuggestion.message && !newSuggestion.start) {
          console.log('🔄 Retry returned message:', newSuggestion.message);
          setError(newSuggestion.message);
          return;
        }
        
        // Validate the new suggestion has the required fields
        if (!newSuggestion.start || !newSuggestion.end) {
          console.error('❌ Invalid retry suggestion:', newSuggestion);
          setError("Invalid retry suggestion received");
          return;
        }
        
        console.log('✅ Valid retry suggestion:', {
          id: newSuggestion.id,
          title: newSuggestion.title,
          start: newSuggestion.start,
          end: newSuggestion.end,
          startParsed: new Date(newSuggestion.start),
          endParsed: new Date(newSuggestion.end)
        });
        
        // Update the suggestion in the list
        setSuggestions(prev =>
          prev.map(item => item.id === s.id ? newSuggestion : item)
        );
        
        // Check if the retry suggestion actually changed the time
        const originalTime = new Date(s.start).getTime();
        const newTime = new Date(newSuggestion.start).getTime();
        const timeChanged = originalTime !== newTime;
        
        console.log("🔄 Retry time comparison:", {
          original: s.start,
          new: newSuggestion.start,
          changed: timeChanged
        });
        
        // Don't immediately add to calendar - let the normal acceptance flow handle it
        // This prevents duplicate calendar entries when the user accepts the retry suggestion
        console.log("🔄 Retry suggestion updated in list, waiting for user acceptance");
        
        // Remove the original suggestion from responded state
        setResponded(prev => {
          const updated = { ...prev };
          delete updated[s.id];
          return updated;
        });
        setAccepted(prev => prev.filter(item => item.id !== s.id));
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
    // Check if all suggestions have been responded to (only trigger if user has actually responded)
    const allSuggestionsResponded = suggestions.length > 0 && Object.keys(responded).length === suggestions.length && Object.keys(responded).length > 0;
    
    // Check if there are accepted suggestions and no more suggestions to respond to
    const hasAcceptedSuggestions = accepted.length > 0 && suggestions.length === 0;
    
    // Check if there are task bank tasks to process (but only if no suggestions were generated)
    const hasTaskBankTasks = taskBankTasks.length > 0 && hasAttemptedOptimization && suggestions.length === 0;
    
    // Check if user has responded to all suggestions (including single suggestion case)
    const userHasResponded = suggestions.length > 0 && Object.keys(responded).length === suggestions.length;
    
    // Check if user has accepted all suggestions (this should trigger modal closure)
    const allSuggestionsAccepted = suggestions.length > 0 && accepted.length === suggestions.length;
    
    // Check if user has accepted suggestions and there are no task bank tasks to process
    const hasAcceptedSuggestionsAndNoTaskBank = accepted.length > 0 && taskBankTasks.length === 0;
    
    // Check if user has accepted suggestions and task bank tasks have been processed
    const hasAcceptedSuggestionsAndTaskBankProcessed = accepted.length > 0 && hasAttemptedOptimization;
    
    // Check if user has accepted at least one suggestion and there are no more suggestions to respond to
    const hasAcceptedSomeSuggestions = accepted.length > 0 && suggestions.length > 0;
    
    // Check if user has accepted ALL suggestions (not just any suggestion)
    const hasAcceptedAllSuggestions = accepted.length > 0 && accepted.length === suggestions.length && suggestions.length > 0;
    
    // Only trigger if user has actually interacted with suggestions or if day is full
    const shouldProcess = (allSuggestionsResponded || hasAcceptedSuggestions || hasTaskBankTasks || userHasResponded || allSuggestionsAccepted || hasAcceptedSuggestionsAndNoTaskBank || hasAcceptedSuggestionsAndTaskBankProcessed) && hasAttemptedOptimization;
    
          console.log("🔄 useEffect conditions:", {
        allSuggestionsResponded,
        hasAcceptedSuggestions,
        hasTaskBankTasks,
        userHasResponded,
        allSuggestionsAccepted,
        hasAcceptedSuggestionsAndNoTaskBank,
        hasAcceptedSuggestionsAndTaskBankProcessed,
        suggestionsLength: suggestions.length,
        respondedLength: Object.keys(responded).length,
        acceptedLength: accepted.length,
        taskBankTasksLength: taskBankTasks.length,
        hasAttemptedOptimization
      });
    
    if (shouldProcess) {
      (async () => {
        // Task bank tasks are already saved in generate.ts, so we don't need to send them to calendar/add
        console.log("✅ Task bank tasks already saved in generate.ts - no need to send to calendar/add");
        
        // Only send accepted GPT suggestions to calendar/add if there are any
        if (accepted.length > 0) {
          console.log("📤 Sending accepted GPT suggestions to calendar:", { accepted });
          
          const response = await fetch("/api/calendar/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              suggestions: accepted, // Send accepted suggestions (including retried ones)
              tasks: [], // Task bank tasks already saved
            }),
          });
          
          const responseData = await response.json();
          console.log("📥 Calendar add API response:", responseData);
          
          if (!response.ok) {
            console.error("❌ Calendar add API failed:", responseData);
            setError(responseData.message || "Failed to schedule suggestions");
            return;
          }
        } else {
          console.log("✅ No GPT suggestions to send to calendar/add");
        }

        // Modal closure will be handled by separate useEffect
      })();
    }
  }, [responded, suggestions.length, taskBankTasks.length, hasAttemptedOptimization, accepted.length]);

  // Check if user has accepted ALL suggestions (not just any suggestion)
  const hasAcceptedAllSuggestions = accepted.length > 0 && accepted.length === suggestions.length && suggestions.length > 0;
  
  // Separate useEffect for modal closure when all suggestions are accepted
  useEffect(() => {
    console.log("🔍 Modal closure check:", {
      hasAcceptedAllSuggestions,
      hasAttemptedOptimization,
      acceptedLength: accepted.length,
      suggestionsLength: suggestions.length
    });
    
    if (hasAcceptedAllSuggestions && hasAttemptedOptimization) {
      console.log("🎯 All suggestions accepted, closing modal");
      document.dispatchEvent(new CustomEvent("optimizeComplete"));
      onClose();
    }
  }, [accepted.length, suggestions.length, hasAttemptedOptimization, hasAcceptedAllSuggestions, onClose]);

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
            {/* Analytics button moved to top */}
            <div className={styles.optimizeSection}>
              <button 
                onClick={() => setShowAnalytics(true)}
                className={styles.analyticsButton}
              >
                📊 View Analytics
              </button>
            </div>

            {/* Progress indicator - only show before suggestions are generated */}
            {!hasAttemptedOptimization && (
              <div className={styles.progressSection}>
                <h2>Complete all 3 steps to optimize your day:</h2>
                <div className={styles.progressSteps}>
                  <div className={`${styles.step} ${mood ? styles.completed : styles.pending}`}>
                    <span className={styles.stepNumber}>1</span>
                    <span className={styles.stepText}>Select your mood</span>
                    {mood && <span className={styles.checkmark}>✓</span>}
                  </div>
                  <div className={`${styles.step} ${location ? styles.completed : styles.pending}`}>
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepText}>Choose your location</span>
                    {location && <span className={styles.checkmark}>✓</span>}
                  </div>
                  <div className={`${styles.step} ${weather ? styles.completed : styles.pending}`}>
                    <span className={styles.stepNumber}>3</span>
                    <span className={styles.stepText}>Set the weather</span>
                    {weather && <span className={styles.checkmark}>✓</span>}
                  </div>
                </div>
                {isReady && (
                  <div className={styles.readyMessage}>
                    🎉 All steps completed! Generating smart suggestions...
                  </div>
                )}
              </div>
            )}

            <div className={styles.optimizeSection}>
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
              <h2>Step 2: Where are you today?</h2>
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

              <h2>Step 3: What is the weather today?</h2>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Day is full message - moved to bottom with bigger, bolder styling */}
            {!isGeneratingSuggestions && hasAttemptedOptimization && dayIsFull && suggestions.length === 0 && (
              <div className={styles.optimizeSection}>
                <div className={styles.dayFullMessage}>
                  <h2>🎯 Your day is already fully optimized!</h2>
                  <p>All tasks are scheduled and there's no room for additional suggestions.</p>
                </div>
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