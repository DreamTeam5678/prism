"use client";
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './VoiceCommandToggle.module.css';

interface VoiceCommandToggleProps {
  onToggle: (isListening: boolean) => void;
  isListening: boolean;
}

export default function VoiceCommandToggle({ onToggle, isListening }: VoiceCommandToggleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpPosition, setHelpPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    console.log('🎤 Voice toggle clicked, current state:', isListening);
    onToggle(!isListening);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowHelp(true);
      // Calculate position for the popup
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setHelpPosition({
          top: rect.top - 300, // Position above the button
          left: rect.left - 150 // Center horizontally
        });
      }
    }, 500);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowHelp(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  console.log('🎤 VoiceCommandToggle rendered, isListening:', isListening);

  return (
    <>
      <div 
        className={styles.voiceToggleContainer}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          ref={buttonRef}
          className={`${styles.voiceToggleButton} ${isListening ? styles.listening : ''}`}
          onClick={handleToggle}
          title={isListening ? "Stop voice commands" : "Start voice commands"}
        >
          <span className={styles.toggleIcon}>
            {isListening ? '🎤' : '🔇'}
          </span>
        </button>
      </div>

      {/* Voice Command Help - Portal to body */}
      {showHelp && typeof window !== 'undefined' && createPortal(
        <div 
          className={styles.helpPanel}
          style={{
            position: 'fixed',
            top: `${helpPosition.top}px`,
            left: `${helpPosition.left}px`,
            zIndex: 9999
          }}
          onMouseEnter={() => setShowHelp(true)}
          onMouseLeave={() => setShowHelp(false)}
        >
          <h4>🎤 Voice Commands</h4>
          <div className={styles.commandCategories}>
            <div className={styles.category}>
              <h5>🎤 Control Commands</h5>
              <ul>
                <li><strong>"Start listening"</strong> - Begin voice recognition</li>
                <li><strong>"Stop listening"</strong> - End voice recognition</li>
              </ul>
            </div>
            <div className={styles.category}>
              <h5>📝 Task Commands</h5>
              <ul>
                <li><strong>"Complete task [name]"</strong> - Mark task as done</li>
                <li><strong>"Delete task [name]"</strong> - Remove task</li>
                <li><strong>"Create task [description]"</strong> - Add new task</li>
                <li><strong>"List tasks"</strong> - Show recent tasks</li>
              </ul>
            </div>
            <div className={styles.category}>
              <h5>❓ Help Commands</h5>
              <ul>
                <li><strong>"Help"</strong> - Show available commands</li>
                <li><strong>"Test"</strong> - Test voice recognition</li>
              </ul>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
} 