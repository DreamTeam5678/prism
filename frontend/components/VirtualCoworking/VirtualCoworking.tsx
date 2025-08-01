import { useState, useEffect, useRef } from 'react';
import styles from './VirtualCoworking.module.css';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'status' | 'achievement';
}

interface Coworker {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'focus' | 'break' | 'available' | 'meeting' | 'creative';
  currentTask: string;
  focusTime: number;
  productivity: number;
  location: string;
  mood: string;
  achievements: string[];
  isOnline: boolean;
  lastActive: Date;
  joinTime: Date;
}

interface VirtualCoworkingProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function VirtualCoworking({ isVisible, onClose }: VirtualCoworkingProps) {
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [myStatus, setMyStatus] = useState<'focus' | 'break' | 'available' | 'meeting' | 'creative'>('focus');
  const [myTask, setMyTask] = useState('Working on revolutionary productivity app');
  const [myFocusTime, setMyFocusTime] = useState(0);
  const [myProductivity, setMyProductivity] = useState(87);
  const [myMood, setMyMood] = useState('Focused and determined');
  const [activeTab, setActiveTab] = useState<'coworkers' | 'chat' | 'stats' | 'achievements'>('coworkers');
  const [newMessage, setNewMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Join coworking space when component mounts
  useEffect(() => {
    if (isVisible && !isJoined) {
      joinCoworkingSpace();
    }
  }, [isVisible]);

  // Leave coworking space when component unmounts
  useEffect(() => {
    return () => {
      if (isJoined) {
        leaveCoworkingSpace();
      }
    };
  }, [isJoined]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const joinCoworkingSpace = async () => {
    try {
      await fetch('/api/coworking/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' })
      });
      setIsJoined(true);
      fetchCoworkingData();
    } catch (error) {
      console.error('Failed to join coworking space:', error);
    }
  };

  const leaveCoworkingSpace = async () => {
    try {
      await fetch('/api/coworking/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave' })
      });
      setIsJoined(false);
    } catch (error) {
      console.error('Failed to leave coworking space:', error);
    }
  };

  const fetchCoworkingData = async () => {
    try {
      const response = await fetch('/api/coworking/status');
      const data = await response.json();
      setCoworkers(data.users || []);
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch coworking data:', error);
    }
  };

  // Real-time updates
  useEffect(() => {
    if (isVisible && isJoined) {
      const interval = setInterval(() => {
        fetchCoworkingData();
        setMyFocusTime(prev => prev + 1);
        setMyProductivity(prev => Math.max(70, Math.min(100, prev + (Math.random() - 0.5) * 2)));
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isVisible, isJoined]);

  const updateMyStatus = async () => {
    try {
      await fetch('/api/coworking/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          status: myStatus,
          task: myTask,
          mood: myMood
        })
      });
      fetchCoworkingData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await fetch('/api/coworking/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          message: newMessage
        })
      });
      setNewMessage('');
      fetchCoworkingData();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'focus': return '#4CAF50';
      case 'break': return '#FF9800';
      case 'available': return '#2196F3';
      case 'meeting': return '#9C27B0';
      case 'creative': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'focus': return '🎯';
      case 'break': return '☕';
      case 'available': return '💬';
      case 'meeting': return '📊';
      case 'creative': return '🎨';
      default: return '❓';
    }
  };

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 90) return '#4CAF50';
    if (productivity >= 80) return '#8BC34A';
    if (productivity >= 70) return '#FFC107';
    return '#F44336';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatMessageTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isVisible) return null;

  return (
    <div className={styles.coworkingOverlay}>
      <div className={styles.coworkingModal}>
        <div className={styles.header}>
          <h2>Virtual Coworking Space</h2>
          <div className={styles.headerStats}>
            <span>👥 {coworkers.length} people online</span>
            <span>🎯 {coworkers.filter(c => c.status === 'focus').length} in deep focus</span>
            <span>💬 {chatMessages.length} messages today</span>
          </div>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.tabNavigation}>
          <button 
            onClick={() => setActiveTab('coworkers')}
            className={`${styles.tabButton} ${activeTab === 'coworkers' ? styles.activeTab : ''}`}
          >
            👥 Coworkers
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`${styles.tabButton} ${activeTab === 'chat' ? styles.activeTab : ''}`}
          >
            💬 Live Chat
          </button>
        </div>

        {activeTab === 'coworkers' && (
          <div className={styles.coworkersGrid}>
            {coworkers.map(coworker => (
              <div key={coworker.id} className={styles.coworkerCard} style={{ borderColor: getStatusColor(coworker.status) }}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>{coworker.avatar}</div>
                  <div className={styles.statusIndicator} style={{ backgroundColor: getStatusColor(coworker.status) }}></div>
                </div>
                <div className={styles.coworkerInfo}>
                  <h3>{coworker.name}</h3>
                  <p className={styles.status}>
                    {getStatusEmoji(coworker.status)} {coworker.status.charAt(0).toUpperCase() + coworker.status.slice(1)}
                  </p>
                  <p className={styles.task}>{coworker.currentTask}</p>
                  <p className={styles.location}>📍 {coworker.location}</p>
                  <p className={styles.mood}>💭 {coworker.mood}</p>
                  {coworker.focusTime > 0 && (
                    <p className={styles.focusTime}>⏱️ {formatTime(coworker.focusTime)} focused</p>
                  )}
                  <div className={styles.productivityBar}>
                    <span>Productivity: {coworker.productivity}%</span>
                    <div className={styles.bar}>
                      <div 
                        className={styles.barFill} 
                        style={{ 
                          width: `${coworker.productivity}%`, 
                          backgroundColor: getProductivityColor(coworker.productivity) 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className={styles.chatSection}>
            <div className={styles.chatMessages} ref={chatRef}>
              {chatMessages.map((message) => (
                <div key={message.id} className={`${styles.message} ${styles[message.type]}`}>
                  <div className={styles.messageHeader}>
                    <span className={styles.messageUser}>{message.userName}</span>
                    <span className={styles.messageTime}>{formatMessageTime(message.timestamp)}</span>
                  </div>
                  <div className={styles.messageContent}>{message.message}</div>
                </div>
              ))}
            </div>
            <div className={styles.chatInput}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className={styles.messageInput}
              />
              <button onClick={sendMessage} className={styles.sendButton}>
                Send
              </button>
            </div>
          </div>
        )}

        <div className={styles.controls}>
          <h3>Update Your Status</h3>
          <div className={styles.statusButtons}>
            <button 
              onClick={() => { setMyStatus('focus'); updateMyStatus(); }}
              className={`${styles.statusButton} ${myStatus === 'focus' ? styles.active : ''}`}
            >
              🎯 Focus Mode
            </button>
            <button 
              onClick={() => { setMyStatus('creative'); updateMyStatus(); }}
              className={`${styles.statusButton} ${myStatus === 'creative' ? styles.active : ''}`}
            >
              🎨 Creative Mode
            </button>
            <button 
              onClick={() => { setMyStatus('meeting'); updateMyStatus(); }}
              className={`${styles.statusButton} ${myStatus === 'meeting' ? styles.active : ''}`}
            >
              📊 Meeting
            </button>
            <button 
              onClick={() => { setMyStatus('break'); updateMyStatus(); }}
              className={`${styles.statusButton} ${myStatus === 'break' ? styles.active : ''}`}
            >
              ☕ Take Break
            </button>
            <button 
              onClick={() => { setMyStatus('available'); updateMyStatus(); }}
              className={`${styles.statusButton} ${myStatus === 'available' ? styles.active : ''}`}
            >
              💬 Available
            </button>
          </div>
          <input
            type="text"
            value={myTask}
            onChange={(e) => setMyTask(e.target.value)}
            onBlur={updateMyStatus}
            placeholder="What are you working on?"
            className={styles.taskInput}
          />
          <input
            type="text"
            value={myMood}
            onChange={(e) => setMyMood(e.target.value)}
            onBlur={updateMyStatus}
            placeholder="How are you feeling?"
            className={styles.moodInput}
          />
        </div>

        <div className={styles.motivationalMessage}>
          <p>💪 You're not alone! {coworkers.filter(c => c.status === 'focus').length} other people are in deep focus right now.</p>
          <p>🚀 Together, you've achieved {formatTime(coworkers.reduce((sum, c) => sum + c.focusTime, 0))} of focused work today!</p>
        </div>
      </div>
    </div>
  );
} 
