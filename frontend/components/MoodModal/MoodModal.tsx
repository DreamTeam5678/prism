import React from "react";
//import "./MoodModal.css";

type Mood = {
  emoji: string;
  label: string;
};

const moods: Mood[] = [
  { emoji: "🚀", label: "Ambitious" },
  { emoji: "😊", label: "Content" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😓", label: "Overwhelmed" },
  { emoji: "😴", label: "Tired" },
  { emoji: "😩", label: "Unmotivated" },
];

type MoodModalProps = {
  onClose: () => void;
  onSelectMood: (mood: Mood) => void;
};

const MoodModal: React.FC<MoodModalProps> = ({ onClose, onSelectMood }) => {
  return (
    <div className="mood-modal-overlay">
      <div className="mood-modal">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <h2>How are you feeling today?</h2>
        <div className="mood-options">
          {moods.map((mood) => (
            <button
              key={mood.label}
              className="mood-button"
              onClick={() => onSelectMood(mood)}
            >
              <span className="emoji">{mood.emoji}</span>
              <span className="label">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodModal;