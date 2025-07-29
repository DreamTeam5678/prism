import React from "react";
import styles from "./CalendarPrompt.module.css";
import { useRouter } from "next/router";

interface CalendarPromptProps {
  onClose: () => void;
}

export default function CalendarPrompt({ onClose }: CalendarPromptProps) {
  const router = useRouter();

  const handleClick = () => {
    onClose(); // Close the popup first
    router.push("/tasks"); // Redirect to the tasks page
  };

  return (
    <div className={styles["calendar-prompt-backdrop"]}>
      <div className={styles["calendar-prompt-card"]}>
        <h2>👋 Welcome back!</h2>
        <p>Start by creating tasks so we can schedule and optimize your day!</p>
        <button onClick={handleClick}>Got it!</button>
      </div>
    </div>
  );
}