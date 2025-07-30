import React from "react";
import styles from "./AchievementBar.module.css";

export default function AchievementBar({ completed, total }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className={styles["achievement-bar-container"]}>
      <div className={styles["achievement-bar-fill"]} style={{ width: `${percentage}%` }}>
        <div className={styles["achievement-bar-fill-inner"]}>
        {Math.round(percentage)}%
        </div>
      </div>
    </div>
  );
}