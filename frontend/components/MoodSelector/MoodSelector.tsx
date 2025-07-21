"use client";

import React, { useState } from "react";



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
    <div className="mood-selector">
      <h2>How are you feeling today?</h2>

      <div className="mood-options">
        {moods.map((mood) => (
          <button
            key={mood.label}
            className={`mood-button ${selectedMood === mood.label ? 'mood-selected' : ''}`}
            onClick={() => {
              if (disabled) return;
              setSelectedMood(mood.label);
              onSelectMood(mood);
              if (onClose) onClose(); 
            }}
            disabled={disabled}
          >
            <span className="emoji">{mood.emoji}</span>
            <span className="label">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;
