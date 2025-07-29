import React from "react";
import styles from "./CalendarPrompt.module.css";

interface CalendarPromptProps {
  onClose: () => void;
}

export default function CalendarPrompt({ onClose }: CalendarPromptProps) {
  return (
    <div className={styles["calendar-prompt-backdrop"]}>
      <div className={styles["calendar-prompt-card"]}>
        <h2>👋 Welcome back!</h2>
        <p>Start by creating tasks so we can schedule and optimize your day!</p>
        <button onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
}