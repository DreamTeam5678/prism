import React from "react";
import styles from "./AchievementBar.module.css";

export default function AchievementBar({ completed, total }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className={styles["achievement-bar-container"]}>
      <div className={styles["achievement-bar-fill"]} style={{ width: `${percentage}%` }}>
        {Math.round(percentage)}%
      </div>
    </div>
  );
}