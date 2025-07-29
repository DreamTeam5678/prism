"use client";
import { useState, useEffect, useRef } from 'react';
import styles from './SmartTaskInput.module.css';
import VoiceCommandToggle from '../VoiceCommands/VoiceCommandToggle';

interface SmartTaskInputProps {
  onTaskCreate: (task: { title: string; priority: string; scheduled: boolean; completed: boolean }) => void;
  placeholder?: string;
  className?: string;
  isVoiceListening?: boolean;
  onVoiceListeningChange?: (isListening: boolean) => void;
}

export default function SmartTaskInput({ 
  onTaskCreate, 
  placeholder = "Type a task or use voice commands", 
  className,
  isVoiceListening = false,
  onVoiceListeningChange
}: SmartTaskInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);





  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setInput(finalTranscript);
          setTranscript('');
          setIsRecording(false);
          setIsListening(false);
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsListening(false);
        setTranscript('');
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setIsListening(false);
      };
    }
  }, []);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onTaskCreate({
        title: input.trim(),
        priority: 'medium',
        scheduled: false,
        completed: false
      });
      setInput('');
      inputRef.current?.blur();
    }
  };



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      setInput('');
      inputRef.current?.blur();
    }
  };

  const startVoiceInput = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setIsRecording(true);
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    }
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={styles.input}
          />
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={!input.trim()}
          >
            ✨
          </button>
          
          {onVoiceListeningChange && (
            <div className={styles.voiceButtonWrapper}>
              <VoiceCommandToggle
                onToggle={onVoiceListeningChange}
                isListening={isVoiceListening}
              />
            </div>
          )}
        </div>
      </form>





              {/* Voice Transcript */}
        {transcript && (
          <div className={styles.transcript}>
            <span className={styles.transcriptIcon}>🎤</span>
            <span className={styles.transcriptText}>{transcript}</span>
          </div>
        )}
        
    </div>
  );
} 