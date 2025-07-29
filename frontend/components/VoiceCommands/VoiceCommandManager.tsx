"use client";
import { useState, useEffect, useRef } from 'react';
import styles from './VoiceCommandManager.module.css';

interface VoiceCommandManagerProps {
  onTaskComplete?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (task: any) => void;
  tasks?: any[];
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

export default function VoiceCommandManager({
  onTaskComplete,
  onTaskDelete,
  onTaskCreate,
  tasks = [],
  isListening,
  onListeningChange
}: VoiceCommandManagerProps) {
  console.log('🎤 VoiceCommandManager rendered with:', {
    tasksLength: tasks?.length || 0,
    isListening,
    hasOnTaskComplete: !!onTaskComplete,
    hasOnTaskDelete: !!onTaskDelete,
    hasOnTaskCreate: !!onTaskCreate
  });
  const [transcript, setTranscript] = useState('');
  const [commandFeedback, setCommandFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<any>(null);
  const lastCommandRef = useRef<string>('');

  // Initialize speech recognition with enhanced settings
  useEffect(() => {
    console.log('🎤 Initializing voice recognition...');
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      console.log('🎤 WebkitSpeechRecognition available');
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 3;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            maxConfidence = Math.max(maxConfidence, confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          setConfidence(maxConfidence);
          processVoiceCommand(finalTranscript.toLowerCase(), maxConfidence);
          setTimeout(() => setTranscript(''), 3000);
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        handleRecognitionError(event.error);
        onListeningChange(false);
      };

      recognitionRef.current.onend = () => {
        onListeningChange(false);
      };
    }
  }, []);

  // Start/stop listening based on isListening prop
  useEffect(() => {
    console.log('🎤 Voice listening state changed:', isListening);
    if (isListening && recognitionRef.current) {
      console.log('🎤 Starting voice recognition...');
      recognitionRef.current.start();
    } else if (!isListening && recognitionRef.current) {
      console.log('🎤 Stopping voice recognition...');
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const handleRecognitionError = (error: string) => {
    let message = 'Voice recognition error';
    switch (error) {
      case 'no-speech':
        message = 'No speech detected. Please try again.';
        break;
      case 'audio-capture':
        message = 'Microphone not found. Please check your microphone.';
        break;
      case 'not-allowed':
        message = 'Microphone access denied. Please allow microphone access.';
        break;
      case 'network':
        message = 'Network error. Please check your connection.';
        break;
      default:
        message = `Voice recognition error: ${error}`;
    }
    showCommandFeedback(message, 'error');
  };

  const showCommandFeedback = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setCommandFeedback(message);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 4000);
  };

  // Improved task finding with better matching
  const findTaskByTitle = (searchTerm: string) => {
    console.log('🔍 Searching for task:', searchTerm);
    console.log('📋 Available tasks:', tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
    console.log('📋 Tasks array length:', tasks.length);
    console.log('📋 Tasks array type:', Array.isArray(tasks) ? 'Array' : typeof tasks);
    console.log('📋 Raw tasks array:', JSON.stringify(tasks, null, 2));
    
    // Safety check
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      console.log('❌ No tasks available for search');
      return null;
    }
    
    // Clean search term
    const cleanSearch = searchTerm.trim().toLowerCase();
    console.log('🔍 Clean search term:', cleanSearch);
    
    // First, try exact match
    let exactMatch = tasks.find(task => 
      task && task.title && task.title.toLowerCase() === cleanSearch
    );
    if (exactMatch) {
      console.log('✅ Exact match found:', exactMatch.title);
      return exactMatch;
    }
    
    // Log all potential matches for debugging
    console.log('🔍 Checking all tasks for potential matches:');
    const potentialMatches = tasks.filter(task => 
      task && task.title && (
        task.title.toLowerCase().includes(cleanSearch) || 
        cleanSearch.includes(task.title.toLowerCase())
      )
    );
    console.log('🔍 Potential matches:', potentialMatches.map(t => t.title));

    // Then try contains match
    let containsMatch = tasks.find(task => 
      task && task.title && (
        task.title.toLowerCase().includes(cleanSearch) || 
        cleanSearch.includes(task.title.toLowerCase())
      )
    );
    if (containsMatch) {
      console.log('✅ Contains match found:', containsMatch.title);
      return containsMatch;
    }

    // Finally, try word-by-word matching
    const searchWords = cleanSearch.split(/\s+/);
    console.log('🔍 Search words:', searchWords);
    let bestMatch = null;
    let bestScore = 0;

    for (const task of tasks) {
      if (!task || !task.title) {
        console.log('⚠️ Skipping invalid task:', task);
        continue;
      }
      
      const taskWords = task.title.toLowerCase().split(/\s+/);
      console.log('🔍 Checking task:', task.title, 'words:', taskWords);
      let score = 0;

      for (const searchWord of searchWords) {
        for (const taskWord of taskWords) {
          // Exact word match
          if (searchWord === taskWord) {
            score += 3;
          }
          // Word contains
          else if (taskWord.includes(searchWord) || searchWord.includes(taskWord)) {
            score += 2;
          }
          // Partial match (for typos)
          else if (searchWord.length > 2 && taskWord.length > 2) {
            const similarity = calculateSimilarity(searchWord, taskWord);
            if (similarity > 0.7) {
              score += similarity;
            }
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = task;
      }
    }

    if (bestScore > 1) {
      console.log('✅ Best match found:', bestMatch?.title, 'with score:', bestScore);
      return bestMatch;
    }

    console.log('❌ No match found for:', searchTerm);
    return null;
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Simple task creation
  const createTask = (description: string) => {
    const newTask = {
      title: description,
      priority: 'medium',
      scheduled: false,
      completed: false
    };

    onTaskCreate?.(newTask);
    showCommandFeedback(`✅ Created task: ${description}`);
  };

  // Enhanced command processing with better logic
  const processVoiceCommand = (command: string, confidence: number = 0.8) => {
    console.log('🎤 Processing voice command:', command, 'Confidence:', confidence);
    console.log('🎤 Tasks array:', tasks);
    console.log('🎤 Tasks length:', tasks.length);
    console.log('🎤 Available tasks:', tasks.map(t => t.title));
    console.log('🎤 Task IDs:', tasks.map(t => t.id));
    console.log('🎤 Task completion status:', tasks.map(t => ({ title: t.title, completed: t.completed })));
    console.log('🎤 Tasks array type:', Array.isArray(tasks) ? 'Array' : typeof tasks);
    console.log('🎤 Tasks array keys:', tasks ? Object.keys(tasks) : 'null/undefined');
    
    // Prevent duplicate processing
    if (command === lastCommandRef.current) return;
    lastCommandRef.current = command;

    // Normalize common mispronunciations and handle singular/plural
    const normalizedCommand = command
      .replace(/\b(text|tax|tex|tacks|tacs|tass|tassk|tassks)\b/gi, 'tasks')
      .replace(/\b(texts|taxes|texes|tackses|tacses|tasses|tassks)\b/gi, 'tasks')
      .replace(/\b(text|tax|tex|tack|tac|tass|tassk)\b/gi, 'task')
      // Handle singular/plural forms - normalize both to singular for matching
      .replace(/\btasks\b/gi, 'task');
    
    console.log('🎤 Normalized command:', normalizedCommand);

    // Low confidence warning
    if (confidence < 0.6) {
      showCommandFeedback(`⚠️ Low confidence (${Math.round(confidence * 100)}%). Did you mean: "${normalizedCommand}"?`, 'warning');
    }

    // Task completion commands
    if (normalizedCommand.match(/complete task (.+)/)) {
      const taskTitle = normalizedCommand.match(/complete task (.+)/)?.[1];
      if (taskTitle) {
        const task = findTaskByTitle(taskTitle);
        if (task) {
          onTaskComplete?.(task.id);
          showCommandFeedback(`✅ Completed: ${task.title}`);
        } else {
          showCommandFeedback(`❌ Task not found: "${taskTitle}". Available tasks: ${tasks.slice(0, 3).map(t => t.title).join(', ')}`, 'error');
        }
        return;
      }
    }

    // Task deletion commands
    if (normalizedCommand.match(/delete task (.+)/)) {
      console.log('🗑️ Delete task command detected!');
      const taskTitle = normalizedCommand.match(/delete task (.+)/)?.[1];
      console.log('🗑️ Original command:', command);
      console.log('🗑️ Normalized command:', normalizedCommand);
      console.log('🗑️ Looking for task:', taskTitle);
      console.log('🗑️ Available tasks:', tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
      
      if (taskTitle) {
        const task = findTaskByTitle(taskTitle);
        console.log('🗑️ Found task:', task);
        
        if (task) {
          console.log('🗑️ Deleting task with ID:', task.id);
          console.log('🗑️ Task details before deletion:', { id: task.id, title: task.title, completed: task.completed });
          
          // Check if task is already completed (might be why it's not showing as deleted)
          if (task.completed) {
            console.log('⚠️ Task is already completed, this might affect deletion visibility');
          }
          
          // Double-check that the task still exists in the current list
          const taskStillExists = tasks.some(t => t.id === task.id);
          if (!taskStillExists) {
            console.log('⚠️ Task no longer exists in current list, might have been deleted already');
            showCommandFeedback(`⚠️ Task "${task.title}" was already deleted or doesn't exist`, 'warning');
            return;
          }
          
          // Show confirmation with the exact task being deleted
          const confirmationMessage = `🗑️ Deleting: "${task.title}" (ID: ${task.id})`;
          console.log(confirmationMessage);
          showCommandFeedback(confirmationMessage);
          
          onTaskDelete?.(task.id);
          
          // Add a small delay to ensure the task list is refreshed
          setTimeout(() => {
            console.log('🔄 Task list should be refreshed now');
            console.log('🔄 Current tasks after deletion:', tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
          }, 100);
        } else {
          const availableTaskNames = tasks.slice(0, 5).map(t => t.title || 'Untitled').join(', ');
          console.log('🗑️ Task not found. Available tasks:', availableTaskNames);
          showCommandFeedback(`❌ Task not found: "${taskTitle}". Available tasks: ${availableTaskNames}`, 'error');
        }
        return;
      }
    }

    // Task creation commands
    if (normalizedCommand.match(/create task (.+)/)) {
      const taskDescription = normalizedCommand.match(/create task (.+)/)?.[1];
      if (taskDescription) {
        createTask(taskDescription);
        return;
      }
    }

    // List tasks command - improved to show more info
    if (normalizedCommand.match(/list task/)) {
      console.log('📝 List tasks command detected!');
      console.log('📝 Total tasks:', tasks?.length || 0);
      console.log('📝 Tasks:', tasks);
      
      // Safety check for tasks array
      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        console.log('📝 No tasks found or tasks not available');
        showCommandFeedback('📝 No tasks found');
      } else {
        const incompleteTasks = tasks.filter(t => t && !t.completed);
        const completedTasks = tasks.filter(t => t && t.completed);
        
        console.log('📝 Incomplete tasks:', incompleteTasks.length);
        console.log('📝 Completed tasks:', completedTasks.length);
        
        let message = `📝 You have ${incompleteTasks.length} incomplete tasks`;
        if (incompleteTasks.length > 0) {
          message += `: ${incompleteTasks.slice(0, 5).map(t => t.title || 'Untitled').join(', ')}`;
          if (incompleteTasks.length > 5) {
            message += ` and ${incompleteTasks.length - 5} more`;
          }
        }
        
        if (completedTasks.length > 0) {
          message += `. ${completedTasks.length} completed.`;
        }
        
        console.log('📝 Message to show:', message);
        showCommandFeedback(message);
      }
      return;
    }

    // Test command
    if (normalizedCommand.match(/test/)) {
      showCommandFeedback('🎤 Voice commands are working! Try saying "list tasks" or "help"');
      return;
    }

    // Help command
    if (normalizedCommand.match(/help|commands/)) {
      showCommandFeedback('🎤 Available commands: "complete task/tasks [name]", "delete task/tasks [name]", "create task/tasks [description]", "list tasks", "help", "test"');
      return;
    }

    // No command matched
    console.log('❌ Command not recognized:', normalizedCommand);
    showCommandFeedback('❌ Command not recognized. Say "help" for available commands.', 'error');
  };

  return (
    <div className={styles.voiceCommandManager}>
      {/* Voice Command Feedback */}
      {showFeedback && (
        <div className={`${styles.commandFeedback} ${styles[commandFeedback.includes('❌') ? 'error' : commandFeedback.includes('⚠️') ? 'warning' : 'success']}`}>
          <span className={styles.feedbackIcon}>
            {commandFeedback.includes('❌') ? '🎤' : commandFeedback.includes('⚠️') ? '⚠️' : '✨'}
          </span>
          <span className={styles.feedbackText}>{commandFeedback}</span>
          {confidence > 0 && confidence < 0.8 && (
            <span className={styles.confidenceIndicator}>
              Confidence: {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
      )}

      {/* Live Transcript */}
      {transcript && (
        <div className={styles.liveTranscript}>
          <span className={styles.transcriptIcon}>🎤</span>
          <span className={styles.transcriptText}>{transcript}</span>
          {confidence > 0 && (
            <span className={styles.confidenceBar}>
              <div 
                className={styles.confidenceFill} 
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
} 