"use client";
import { useEffect, useState } from "react";
import styles from "./XPBar.module.css";

interface XPBarProps {
  xp: number;
  onShowGames?: () => void;
}

export default function XPBar({ xp, onShowGames }: XPBarProps) {
  const xpPerLevel = 100;
  const level = Math.floor(xp / xpPerLevel);
  const xpIntoLevel = xp % xpPerLevel;
  const progressPercent = (xpIntoLevel / xpPerLevel) * 100;

  const [streak, setStreak] = useState(0);
  const [levelUpEffect, setLevelUpEffect] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);
  const [xpGainEffect, setXpGainEffect] = useState(false);

  // 🎉 Detect level up
  useEffect(() => {
    if (level > prevLevel) {
      setLevelUpEffect(true);
      setTimeout(() => setLevelUpEffect(false), 2000);
      setPrevLevel(level);
    }
  }, [level, prevLevel]);

  // 🔥 Local streak logic (to be replaced by backend syncing later)
  useEffect(() => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem("lastCompletedDate");
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastDate !== today) {
      const currentStreak = parseInt(localStorage.getItem("streak") || "0");

      if (lastDate === yesterday) {
        const newStreak = currentStreak + 1;
        setStreak(newStreak);
        localStorage.setItem("streak", newStreak.toString());
      } else {
        setStreak(1);
        localStorage.setItem("streak", "1");
      }

      localStorage.setItem("lastCompletedDate", today);
    } else {
      const savedStreak = parseInt(localStorage.getItem("streak") || "1");
      setStreak(savedStreak);
    }
  }, []);

  // XP gain animation
  const triggerXpGain = () => {
    setXpGainEffect(true);
    setTimeout(() => setXpGainEffect(false), 1000);
  };

  return (
    <div className={styles.gamificationBanner}>
      <div className={styles.bannerContent}>
        {/* Left side - Level and XP */}
        <div className={styles.levelSection}>
          <div className={`${styles.levelDisplay} ${levelUpEffect ? styles.levelUp : ""}`}>
            <div className={styles.levelIcon}>🧬</div>
            <div className={styles.levelInfo}>
              <div className={styles.levelText}>Level {level}</div>
              <div className={styles.xpText}>{xpPerLevel - xpIntoLevel} XP to next level</div>
            </div>
          </div>
          <div className={styles.xpBar}>
            <div
              className={`${styles.xpFill} ${xpGainEffect ? styles.xpGain : ""}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
            <div className={styles.xpParticles}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={styles.particle}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Motivational message */}
        <div className={styles.motivationSection}>
          <div className={styles.motivationText}>
            {level < 5 && "Newbie Explorer"}
            {level >= 5 && level < 10 && "Rising Star"}
            {level >= 10 && level < 20 && "Productivity Master"}
            {level >= 20 && level < 30 && "Elite Achiever"}
            {level >= 30 && "Legendary"}
          </div>
          <div className={styles.achievementBadge}>
            {level >= 5 && <span className={styles.badge}>⭐</span>}
            {level >= 10 && <span className={styles.badge}>⭐</span>}
            {level >= 20 && <span className={styles.badge}>⭐</span>}
            {level >= 30 && <span className={styles.badge}>⭐</span>}
          </div>
        </div>

        {/* Right side - Streak and stats */}
        <div className={styles.statsSection}>
          <div className={styles.streakDisplay}>
            <div className={styles.streakIcon}>🔥</div>
            <div className={styles.streakInfo}>
              <div className={styles.streakText}>{streak} day{streak !== 1 ? 's' : ''}</div>
              <div className={styles.streakLabel}>streak</div>
            </div>
          </div>
          <div className={styles.totalXp}>
            <div className={styles.xpTotal}>{xp} XP</div>
            <div className={styles.xpLabel}>total earned</div>
          </div>
          {xp >= 180 && onShowGames && (
            <button 
              className={styles.gamesButton}
              onClick={onShowGames}
              title="Play Mini Games"
            >
              🎮 Games
            </button>
          )}
        </div>
      </div>

      {/* Floating particles for visual appeal */}
      <div className={styles.floatingParticles}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={styles.floatingParticle}></div>
        ))}
      </div>
    </div>
  );
}