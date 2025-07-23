"use client";

import React, { useState } from "react";
import styles from "./MoodSelector.module.css";


type Mood = {
  emoji: string;
  label: string;
};

const moods: Mood[] = [
  { emoji: "🤑", label: "Ambitious" },
  { emoji: "😊", label: "Content" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😓", label: "Overwhelmed" },
  { emoji: "😴", label: "Tired" },
  { emoji: "😩", label: "Unmotivated" },
];

type MoodSelectorProps = {
  onSelectMood: (mood: Mood) => void;
  onClose?: () => void;
  disabled?: boolean;
};

const MoodSelector: React.FC<MoodSelectorProps> = ({ onSelectMood, onClose, disabled }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  return (
    <div className={styles.moodSelector}>
      <h2>How are you feeling today?</h2>

      <div className={styles.moodOptions}>
        {moods.map((mood) => (
          <button
            key={mood.label}
            className={`${styles.moodButton} ${selectedMood === mood.label ? styles.moodSelected : ''}`}
            onClick={() => {
              if (disabled) return;
              setSelectedMood(mood.label);
              onSelectMood(mood);
              if (onClose) onClose(); 
            }}
            disabled={disabled}
          >
            <span className={styles.emoji}>{mood.emoji}</span>
            <span className={styles.label}>{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;
