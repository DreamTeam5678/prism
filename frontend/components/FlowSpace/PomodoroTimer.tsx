import { useState, useEffect, useRef } from "react";
import styles from "./PomodoroTimer.module.css";

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
      return timerState.session % settings.sessionsUntilLongBreak === 0
        ? "Long Break"
        : "Short Break";
    }
    return `Work Session ${timerState.session}`;
  };

  return (
    <div className={styles.pomodoroTimerContainer}>
      <div className={styles.timerDisplay}>
        <div className={styles.timerCircle}>
          <div
            className={styles.timerProgress}
            style={{
              background: `conic-gradient(#4CAF50 ${getProgressPercentage()}%, #e0e0e0 0%)`
            }}
          />
          <div className={styles.timerTime}>
            <div className={styles.timeDisplay}>{formatTime(timerState.timeLeft)}</div>
            <div className={styles.sessionType}>{getSessionType()}</div>
          </div>
        </div>
      </div>

      <div className={styles.timerControls}>
        {timerState.isRunning ? (
          <button onClick={pauseTimer} className={`${styles.timerButton} ${styles.pause}`}>
            ⏸️ Pause
          </button>
        ) : (
          <button onClick={startTimer} className={`${styles.timerButton} ${styles.start}`}>
            ▶️ Start
          </button>
        )}
        <button onClick={resetTimer} className={`${styles.timerButton} ${styles.reset}`}>
          🔄 Reset
        </button>
        <button onClick={skipTimer} className={`${styles.timerButton} ${styles.skip}`}>
          ⏭️ Skip
        </button>
      </div>

      <div className={styles.timerSettings}>
        <h4>Settings</h4>
        <div className={styles.settingsGrid}>
          <div className={styles.settingItem}>
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
          <div className={styles.settingItem}>
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
          <div className={styles.settingItem}>
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
          <div className={styles.settingItem}>
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

      <div className={styles.timerTips}>
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
