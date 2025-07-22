"use client";
import { useEffect, useState } from "react";
import styles from "./XPBar.module.css";

interface XPBarProps {
  xp: number;
}

export default function XPBar({ xp }: XPBarProps) {
  const xpPerLevel = 100;
  const level = Math.floor(xp / xpPerLevel);
  const xpIntoLevel = xp % xpPerLevel;
  const progressPercent = (xpIntoLevel / xpPerLevel) * 100;

  const [streak, setStreak] = useState(0);
  const [levelUpEffect, setLevelUpEffect] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);

  // 🎉 Detect level up
  useEffect(() => {
    if (level > prevLevel) {
      setLevelUpEffect(true);
      setTimeout(() => setLevelUpEffect(false), 1000);
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

  return (
    <div className={styles.container}>
      <div className={`${styles.barWrapper} ${levelUpEffect ? styles.levelUp : ""}`}>
        <div className={styles.label}>
          🧬 Level {level} – {xpPerLevel - xpIntoLevel} XP to next level
        </div>
        <div className={styles.bar}>
          <div
            className={styles.fill}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className={styles.streak}>🔥 Streak: {streak} days</div>
      </div>
    </div>
  );
}