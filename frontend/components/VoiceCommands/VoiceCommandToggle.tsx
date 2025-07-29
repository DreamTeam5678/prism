"use client";
import { useState } from 'react';
import styles from './VoiceCommandToggle.module.css';

interface VoiceCommandToggleProps {
  onToggle: (isListening: boolean) => void;
  isListening: boolean;
}

export default function VoiceCommandToggle({ onToggle, isListening }: VoiceCommandToggleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    onToggle(!isListening);
  };

  return (
    <div className={styles.voiceToggleContainer}>
      <button
        className={`${styles.voiceToggleButton} ${isListening ? styles.listening : ''}`}
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={isListening ? "Stop voice commands" : "Start voice commands"}
      >
        <span className={styles.toggleIcon}>
          {isListening ? '🎤' : '🔇'}
        </span>
        {isHovered && (
          <span className={styles.tooltip}>
            {isListening ? 'Stop listening' : 'Start listening'}
          </span>
        )}
      </button>
      
      {/* Voice Command Help */}
      {isHovered && (
        <div className={styles.helpPanel}>
          <h4>🎤 Voice Commands</h4>
          <ul>
            <li><strong>Complete task [name]</strong> - Mark task as done</li>
            <li><strong>Delete task [name]</strong> - Remove task</li>
            <li><strong>Create task [description]</strong> - Add new task</li>
            <li><strong>List tasks</strong> - Show recent tasks</li>
            <li><strong>Help</strong> - Show this help</li>
          </ul>
        </div>
      )}
    </div>
  );
} 