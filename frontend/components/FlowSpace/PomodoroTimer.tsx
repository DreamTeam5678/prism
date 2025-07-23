import { useState, useEffect, useRef } from "react";

interface TimerState {
  isRunning: boolean;
  isBreak: boolean;
  timeLeft: number;
  session: number;
  totalSessions: number;
}

export default function PomodoroTimer() {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isBreak: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    session: 1,
    totalSessions: 0
  });

  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerState.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeLeft <= 1) {
            // Timer finished
            const audio = new Audio('/notification.mp3'); // Add a notification sound
            audio.play().catch(() => {}); // Ignore if audio fails
            
            if (prev.isBreak) {
              // Break finished, start work session
              return {
                ...prev,
                isRunning: false,
                isBreak: false,
                timeLeft: settings.workDuration * 60,
                session: prev.session + 1,
                totalSessions: prev.totalSessions + 1
              };
            } else {
              // Work session finished, start break
              const isLongBreak = prev.session % settings.sessionsUntilLongBreak === 0;
              const breakDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;
              
              return {
                ...prev,
                isRunning: false,
                isBreak: true,
                timeLeft: breakDuration * 60
              };
            }
          }
          
          return {
            ...prev,
            timeLeft: prev.timeLeft - 1
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, settings]);

  const startTimer = () => {
    setTimerState(prev => ({ ...prev, isRunning: true }));
  };

  const pauseTimer = () => {
    setTimerState(prev => ({ ...prev, isRunning: false }));
  };

  const resetTimer = () => {
    setTimerState({
      isRunning: false,
      isBreak: false,
      timeLeft: settings.workDuration * 60,
      session: 1,
      totalSessions: 0
    });
  };

  const skipTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      timeLeft: 0
    }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    const totalTime = timerState.isBreak 
      ? (timerState.session % settings.sessionsUntilLongBreak === 0 
          ? settings.longBreakDuration 
          : settings.shortBreakDuration) * 60
      : settings.workDuration * 60;
    
    return ((totalTime - timerState.timeLeft) / totalTime) * 100;
  };

  const getSessionType = (): string => {
    if (timerState.isBreak) {
      return timerState.session % settings.sessionsUntilLongBreak === 0 ? 'Long Break' : 'Short Break';
    }
    return `Work Session ${timerState.session}`;
  };

  return (
    <div className="pomodoro-timer-container">
      <h3>🍅 Pomodoro Timer</h3>
      
      {/* Timer Display */}
      <div className="timer-display">
        <div className="timer-circle">
          <div 
            className="timer-progress" 
            style={{ 
              background: `conic-gradient(#4CAF50 ${getProgressPercentage()}%, #e0e0e0 0%)` 
            }}
          />
          <div className="timer-time">
            <div className="time-display">{formatTime(timerState.timeLeft)}</div>
            <div className="session-type">{getSessionType()}</div>
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="session-info">
        <div className="session-counter">
          Session {timerState.session} of {settings.sessionsUntilLongBreak}
        </div>
        <div className="total-sessions">
          Total sessions completed: {timerState.totalSessions}
        </div>
      </div>

      {/* Timer Controls */}
      <div className="timer-controls">
        {timerState.isRunning ? (
          <button onClick={pauseTimer} className="timer-button pause">
            ⏸️ Pause
          </button>
        ) : (
          <button onClick={startTimer} className="timer-button start">
            ▶️ Start
          </button>
        )}
        
        <button onClick={resetTimer} className="timer-button reset">
          🔄 Reset
        </button>
        
        <button onClick={skipTimer} className="timer-button skip">
          ⏭️ Skip
        </button>
      </div>

      {/* Settings */}
      <div className="timer-settings">
        <h4>Settings</h4>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Work Duration (min)</label>
            <input
              type="number"
              value={settings.workDuration}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                workDuration: parseInt(e.target.value) || 25
              }))}
              min="1"
              max="60"
            />
          </div>
          
          <div className="setting-item">
            <label>Short Break (min)</label>
            <input
              type="number"
              value={settings.shortBreakDuration}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                shortBreakDuration: parseInt(e.target.value) || 5
              }))}
              min="1"
              max="30"
            />
          </div>
          
          <div className="setting-item">
            <label>Long Break (min)</label>
            <input
              type="number"
              value={settings.longBreakDuration}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                longBreakDuration: parseInt(e.target.value) || 15
              }))}
              min="1"
              max="60"
            />
          </div>
          
          <div className="setting-item">
            <label>Sessions until Long Break</label>
            <input
              type="number"
              value={settings.sessionsUntilLongBreak}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                sessionsUntilLongBreak: parseInt(e.target.value) || 4
              }))}
              min="1"
              max="10"
            />
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="timer-tips">
        <h4>💡 Tips</h4>
        <ul>
          <li>Work for 25 minutes, then take a 5-minute break</li>
          <li>After 4 sessions, take a longer 15-minute break</li>
          <li>Use breaks to stretch, hydrate, or step away from your screen</li>
          <li>Don't skip breaks - they're essential for maintaining focus</li>
        </ul>
      </div>
    </div>
  );
} 