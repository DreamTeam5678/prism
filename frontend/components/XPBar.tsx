"use client";
import { useEffect, useState } from "react";
import styles from "./XPBar.module.css";
import { ChartColumnIncreasing } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Flame } from "lucide-react";
import { Gamepad2 } from "lucide-react";


interface XPBarProps {
  xp: number;
  streak: number;
  onShowGames?: () => void;
}

export default function XPBar({ xp, streak, onShowGames }: XPBarProps) {
  const xpPerLevel = 100;
  const level = Math.floor(xp / xpPerLevel);
  const xpIntoLevel = xp % xpPerLevel;
  const progressPercent = (xpIntoLevel / xpPerLevel) * 100;
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

  // 🔥 Streak is now managed by the XP context and saved to database

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
            <div className={styles.levelIcon}><ChartColumnIncreasing /></div>
            <div className={styles.levelInfo}>
              <div className={styles.levelText}>Level {level}</div>
              <div className={styles.xpText}>{xpPerLevel - xpIntoLevel} XP to next level</div>
            </div>
          </div>
          <div className={styles.xpBar}>
            <div
              className={`${styles.xpFill} ${xpGainEffect ? styles.xpGain : ""}`}
              style={{ width: ` ${progressPercent} %` }}
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
            {level >= 5 && <span className={styles.badge}><Sparkles /></span>}
            {level >= 10 && <span className={styles.badge}><Sparkles /></span>}
            {level >= 20 && <span className={styles.badge}><Sparkles /></span>}
            {level >= 30 && <span className={styles.badge}><Sparkles /></span>}
          </div>
        </div>

        {/* Right side - Streak and stats */}
        <div className={styles.statsSection}>
          <div className={styles.streakDisplay}>
            <div className={styles.streakIcon}><Flame /></div>
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
              <div className={styles.gamesButtonIcon}><Gamepad2/> </div>
              Games
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