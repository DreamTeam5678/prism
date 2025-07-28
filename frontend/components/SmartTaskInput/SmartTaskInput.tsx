"use client";
import { useState, useEffect, useRef } from 'react';
import { naturalLanguageParser, ParsedTask } from '@/lib/utils/naturalLanguageParser';
import styles from './SmartTaskInput.module.css';

interface SmartTaskInputProps {
  onTaskCreate: (task: ParsedTask) => void;
  placeholder?: string;
  className?: string;
}

export default function SmartTaskInput({ onTaskCreate, placeholder = "Try: 'remind me to call mom tomorrow at 3pm'", className }: SmartTaskInputProps) {
  const [input, setInput] = useState('');
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Example suggestions
  const exampleSuggestions = [
    "remind me to call mom tomorrow at 3pm",
    "urgent meeting with client today at 2pm",
    "grocery shopping this weekend",
    "workout session tomorrow morning",
    "review project proposal by Friday",
    "dentist appointment next Tuesday at 10am",
    "team meeting this afternoon",
    "creative writing session this evening",
    "2 hour meeting with John and Sarah tomorrow at 3pm",
    "daily workout every morning",
    "weekly team sync every Monday",
    "monthly budget review on the 15th",
    "call mom at home tonight",
    "meeting with client at Starbucks tomorrow",
    "doctor appointment for 1 hour next Tuesday",
    "vacation planning for next month",
    "birthday party with friends this weekend",
    "creative writing session for 30 minutes tonight"
  ];

  useEffect(() => {
    if (input.trim()) {
      const parsed = naturalLanguageParser.parse(input);
      setParsedTask(parsed);
      setShowPreview(true);
    } else {
      setParsedTask(null);
      setShowPreview(false);
    }
  }, [input]);

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

  useEffect(() => {
    // Show suggestions when input is empty and focused
    if (isFocused && !input.trim()) {
      setSuggestions(exampleSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [isFocused, input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTask && input.trim()) {
      onTaskCreate(parsedTask);
      setInput('');
      setParsedTask(null);
      setShowPreview(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      setInput('');
      setParsedTask(null);
      setShowPreview(false);
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
              // Delay hiding preview to allow for clicks
              setTimeout(() => setShowPreview(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={styles.input}
          />
          
          {/* Voice Input Button */}
          <button
            type="button"
            className={`${styles.voiceButton} ${isRecording ? styles.recording : ''}`}
            onClick={isRecording ? stopVoiceInput : startVoiceInput}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? (
              <span className={styles.recordingPulse}>🎤</span>
            ) : (
              <span>🎤</span>
            )}
          </button>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={!parsedTask}
          >
            ✨
          </button>
        </div>
      </form>

      {/* Smart Preview */}
      {showPreview && parsedTask && (
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <span className={styles.previewIcon}>🤖</span>
            <span className={styles.previewTitle}>Smart Parse Preview</span>
          </div>
          <div className={styles.previewContent}>
            <div className={styles.taskTitle}>{parsedTask.title}</div>
            <div className={styles.taskDetails}>
              {parsedTask.timestamp && (
                <div className={styles.detail}>
                  <span className={styles.detailIcon}>📅</span>
                  <span>{parsedTask.timestamp.toLocaleString()}</span>
                </div>
              )}
              {parsedTask.priority !== 'medium' && (
                <div className={styles.detail}>
                  <span className={styles.detailIcon}>🎯</span>
                  <span className={`${styles.priority} ${styles[parsedTask.priority]}`}>
                    {parsedTask.priority} priority
                  </span>
                </div>
              )}
              {parsedTask.category && (
                <div className={styles.detail}>
                  <span className={styles.detailIcon}>📂</span>
                  <span>{parsedTask.category}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <div className={styles.suggestionsHeader}>
            <span className={styles.suggestionsIcon}>💡</span>
            <span>Try these examples:</span>
          </div>
          <div className={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={styles.suggestion}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

              {/* Voice Transcript */}
        {transcript && (
          <div className={styles.transcript}>
            <span className={styles.transcriptIcon}>🎤</span>
            <span className={styles.transcriptText}>{transcript}</span>
          </div>
        )}

        {/* Help Text */}
        {!input.trim() && !isFocused && (
          <div className={styles.helpText}>
            <span className={styles.helpIcon}>💡</span>
            <span>Type or speak naturally: "call mom tomorrow at 3pm" or "urgent meeting today"</span>
          </div>
        )}
    </div>
  );
} 