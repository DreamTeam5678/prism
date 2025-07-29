import { useState, useEffect, useRef } from "react";
import styles from "./PomodoroTimer.module.css";
import { CirclePlay } from "lucide-react";
import { RefreshCcw } from "lucide-react";
import { SkipForward } from "lucide-react";

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
    timeLeft: 25 * 60,
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
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});

            if (prev.isBreak) {
              return {
                ...prev,
                isRunning: false,
                isBreak: false,
                timeLeft: settings.workDuration * 60,
                session: prev.session + 1,
                totalSessions: prev.totalSessions + 1
              };
            } else {
              // Work session completed - trigger XP event
              document.dispatchEvent(new CustomEvent("pomodoroComplete"));
              
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
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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
    // Simulate natural timer completion
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});

    setTimerState(prev => {
      if (prev.isBreak) {
        // Skip break - go to next work session
        return {
          ...prev,
          isRunning: false,
          isBreak: false,
          timeLeft: settings.workDuration * 60,
          session: prev.session + 1,
          totalSessions: prev.totalSessions + 1
        };
      } else {
        // Skip work session - only award XP if timer was running for at least 50% of the duration
        const totalWorkTime = settings.workDuration * 60;
        const timeSpent = totalWorkTime - prev.timeLeft;
        const minimumTimeForXP = totalWorkTime * 0.5; // 50% of work duration
        
        if (timeSpent >= minimumTimeForXP) {
          // Award XP only if they spent significant time on the task
          document.dispatchEvent(new CustomEvent("pomodoroComplete"));
        }
        
        const isLongBreak = prev.session % settings.sessionsUntilLongBreak === 0;
        const breakDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;
        return {
          ...prev,
          isRunning: false,
          isBreak: true,
          timeLeft: breakDuration * 60
        };
      }
    });
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
      return timerState.session % settings.sessionsUntilLongBreak === 0
        ? "Long Break"
        : "Short Break";
    }
    return `Work Session ${timerState.session}`;
  };

  return (
    <div className={styles['pomodoro-container']}>
      <div className={styles['timer-display']}>
        <div className={`${styles['timer-circle']} ${timerState.isRunning ? styles.active : ''}`}>
          <div
            className={styles['timer-progress']}
            style={{
              background: `conic-gradient(#4CAF50 ${getProgressPercentage()}%, #e0e0e0 0%)`
            }}
          />
          <div className={styles['timer-time']}>
            <div className={styles['time-display']}>{formatTime(timerState.timeLeft)}</div>
            <div className={styles['session-type']}>{getSessionType()}</div>
          </div>
        </div>
      </div>

        <div className={styles['timer-controls']}>
        {timerState.isRunning ? (
            <button onClick={pauseTimer} className={`${styles['timer-button']} ${styles.pause}`}>
              <CirclePlay />
            </button>
          ) : (
            <button onClick={startTimer} className={`${styles['timer-button']} ${styles.start}`}>
              <CirclePlay />
            </button>
          )}
          
          <button onClick={resetTimer} className={`${styles['timer-button']} ${styles.reset}`}>
            <RefreshCcw />
          </button>
          <button onClick={skipTimer} className={`${styles['timer-button']} ${styles.skip}`}>
            <SkipForward />
        </button>
      </div>



      <div className={styles['timer-settings']}>
        <h4>Settings</h4>
        <div className={styles['settings-grid']}>
          <div className={styles['setting-item']}>
            <label>Work Duration (min)</label>
            <input
              type="number"
              value={settings.workDuration}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  workDuration: parseInt(e.target.value) || 25
                }))
              }
              min="1"
              max="60"
            />
          </div>
          <div className={styles['setting-item']}>
            <label>Short Break (min)</label>
            <input
              type="number"
              value={settings.shortBreakDuration}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  shortBreakDuration: parseInt(e.target.value) || 5
                }))
              }
              min="1"
              max="30"
            />
          </div>
          <div className={styles['setting-item']}>
            <label>Long Break (min)</label>
            <input
              type="number"
              value={settings.longBreakDuration}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  longBreakDuration: parseInt(e.target.value) || 15
                }))
              }
              min="1"
              max="60"
            />
          </div>
          <div className={styles['setting-item']}>
            <label>Sessions until Long Break</label>
            <input
              type="number"
              value={settings.sessionsUntilLongBreak}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  sessionsUntilLongBreak: parseInt(e.target.value) || 4
                }))
              }
              min="1"
              max="10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
