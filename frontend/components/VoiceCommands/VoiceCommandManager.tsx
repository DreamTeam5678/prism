"use client";
import { useState, useEffect, useRef } from 'react';
import styles from './VoiceCommandManager.module.css';

interface VoiceCommandManagerProps {
  onTaskComplete?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (task: any) => void;
  onCalendarEventCreate?: (event: any) => void;
  onCalendarEventDelete?: (eventId: string) => void;
  tasks?: any[];
  events?: any[];
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

interface VoiceCommand {
  pattern: RegExp;
  action: (matches: RegExpMatchArray) => void;
  description: string;
}

export default function VoiceCommandManager({
  onTaskComplete,
  onTaskDelete,
  onTaskCreate,
  onCalendarEventCreate,
  onCalendarEventDelete,
  tasks = [],
  events = [],
  isListening,
  onListeningChange
}: VoiceCommandManagerProps) {
  const [transcript, setTranscript] = useState('');
  const [commandFeedback, setCommandFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
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
          setTranscript(finalTranscript);
          processVoiceCommand(finalTranscript.toLowerCase());
          setTimeout(() => setTranscript(''), 2000);
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Voice command error:', event.error);
        onListeningChange(false);
      };

      recognitionRef.current.onend = () => {
        onListeningChange(false);
      };
    }
  }, [onListeningChange]);

  // Start/stop listening based on isListening prop
  useEffect(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.start();
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const showCommandFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setCommandFeedback(message);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  const findTaskByTitle = (title: string) => {
    return tasks.find(task => 
      task.title.toLowerCase().includes(title.toLowerCase())
    );
  };

  const findEventByTitle = (title: string) => {
    return events.find(event => 
      event.title.toLowerCase().includes(title.toLowerCase())
    );
  };

  const processVoiceCommand = (command: string) => {
    console.log('Processing voice command:', command);

    // Task completion commands
    if (command.match(/complete task (.+)/)) {
      const taskTitle = command.match(/complete task (.+)/)?.[1];
      if (taskTitle) {
        const task = findTaskByTitle(taskTitle);
        if (task) {
          onTaskComplete?.(task.id);
          showCommandFeedback(`✅ Completed task: ${task.title}`);
        } else {
          showCommandFeedback(`❌ Task not found: ${taskTitle}`, 'error');
        }
        return;
      }
    }

    // Task deletion commands
    if (command.match(/delete task (.+)/)) {
      const taskTitle = command.match(/delete task (.+)/)?.[1];
      if (taskTitle) {
        const task = findTaskByTitle(taskTitle);
        if (task) {
          onTaskDelete?.(task.id);
          showCommandFeedback(`🗑️ Deleted task: ${task.title}`);
        } else {
          showCommandFeedback(`❌ Task not found: ${taskTitle}`, 'error');
        }
        return;
      }
    }

    // Calendar event deletion commands
    if (command.match(/delete event (.+)/)) {
      const eventTitle = command.match(/delete event (.+)/)?.[1];
      if (eventTitle) {
        const event = findEventByTitle(eventTitle);
        if (event) {
          onCalendarEventDelete?.(event.id);
          showCommandFeedback(`🗑️ Deleted event: ${event.title}`);
        } else {
          showCommandFeedback(`❌ Event not found: ${eventTitle}`, 'error');
        }
        return;
      }
    }

    // Task creation commands
    if (command.match(/create task (.+)/)) {
      const taskDescription = command.match(/create task (.+)/)?.[1];
      if (taskDescription) {
        const newTask = {
          title: taskDescription,
          priority: 'medium',
          scheduled: false,
          completed: false
        };
        onTaskCreate?.(newTask);
        showCommandFeedback(`✅ Created task: ${taskDescription}`);
        return;
      }
    }

    // Calendar event creation commands
    if (command.match(/create event (.+)/)) {
      const eventDescription = command.match(/create event (.+)/)?.[1];
      if (eventDescription) {
        const newEvent = {
          title: eventDescription,
          start: new Date(),
          end: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
          description: '',
          color: '#3174ad'
        };
        onCalendarEventCreate?.(newEvent);
        showCommandFeedback(`✅ Created event: ${eventDescription}`);
        return;
      }
    }

    // List tasks command
    if (command.match(/list tasks/)) {
      if (tasks.length === 0) {
        showCommandFeedback('📝 No tasks found');
      } else {
        const taskList = tasks.slice(0, 5).map(task => task.title).join(', ');
        showCommandFeedback(`📝 Recent tasks: ${taskList}`);
      }
      return;
    }

    // List events command
    if (command.match(/list events/)) {
      if (events.length === 0) {
        showCommandFeedback('📅 No events found');
      } else {
        const eventList = events.slice(0, 5).map(event => event.title).join(', ');
        showCommandFeedback(`📅 Recent events: ${eventList}`);
      }
      return;
    }

    // Help command
    if (command.match(/help|commands/)) {
      showCommandFeedback('🎤 Available commands: complete task, delete task, create task, list tasks, list events, help');
      return;
    }

    // No command matched
    showCommandFeedback('❌ Command not recognized. Say "help" for available commands.', 'error');
  };

  return (
    <div className={styles.voiceCommandManager}>
      {/* Voice Command Feedback */}
      {showFeedback && (
        <div className={`${styles.commandFeedback} ${styles[commandFeedback.includes('❌') ? 'error' : 'success']}`}>
          <span className={styles.feedbackIcon}>
            {commandFeedback.includes('❌') ? '🎤' : '✨'}
          </span>
          <span className={styles.feedbackText}>{commandFeedback}</span>
        </div>
      )}

      {/* Live Transcript */}
      {transcript && (
        <div className={styles.liveTranscript}>
          <span className={styles.transcriptIcon}>🎤</span>
          <span className={styles.transcriptText}>{transcript}</span>
        </div>
      )}

      {/* Voice Status Indicator */}
      <div className={`${styles.voiceStatus} ${isListening ? styles.listening : ''}`}>
        <span className={styles.statusIcon}>
          {isListening ? '🎤' : '🔇'}
        </span>
        <span className={styles.statusText}>
          {isListening ? 'Listening for commands...' : 'Voice commands rea'}
        </span>
      </div>
    </div>
  );
} 