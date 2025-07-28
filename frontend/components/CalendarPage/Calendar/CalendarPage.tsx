// frontend/components/CalendarPage/Calendar/CalendarPage.tsx
/*
#00000040
"use client";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import NavBar from "../../NavBar/NavBar";
import Upcoming from "../Upcoming/Upcoming";
import Optimize from "../Optimize/Optimize";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  color?: string;
  source?: string;
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("day");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
    description: '',
    color: '#3174ad'
  });

  useEffect(() => {
    const fetchEvents = () => {
      fetch("/api/calendar/list", { credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch calendar events");
          return res.json();
        })
        .then((data) => {
          const formatted = data.map((event: any) => ({
            id: event.id,
            title: event.title || event.suggestionText || "No Title",
            start: new Date(event.start),
            end: new Date(event.end),
            description: event.source || "",
            color: event.color ?? "#d0e4ec",
            source: event.source
          }));
          setEvents(formatted);
        })
        .catch((err) => {
          console.error("Error fetching calendar events:", err);
          setError("Unable to load calendar events.");
        })
        .finally(() => setLoading(false));
    };
    if (status === "authenticated") {
      fetchEvents();
      const listener = () => fetchEvents();
      document.addEventListener("optimizeComplete", listener);
      return () => document.removeEventListener("optimizeComplete", listener);
    }
  }, [status]);

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEventDrop = async (event: CalendarEvent, start: Date, end: Date) => {
    try {
      const response = await fetch(`/api/calendar/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId: event.id, 
          start: start.toISOString(), 
          end: end.toISOString() 
        })
      });
      
      if (response.ok) {
        setEvents(prev => prev.map(e => 
          e.id === event.id ? { ...e, start, end } : e
        ));
      }
    } catch (error) {
      console.error('Failed to move event:', error);
    }
  };

  const handleEventResize = async (event: CalendarEvent, start: Date, end: Date) => {
    try {
      const response = await fetch(`/api/calendar/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId: event.id, 
          start: start.toISOString(), 
          end: end.toISOString() 
        })
      });
      
      if (response.ok) {
        setEvents(prev => prev.map(e => 
          e.id === event.id ? { ...e, start, end } : e
        ));
      }
    } catch (error) {
      console.error('Failed to resize event:', error);
    }
  };

  // Simple event move functionality
  const [selectedEventForMove, setSelectedEventForMove] = useState<CalendarEvent | null>(null);
  const [targetTime, setTargetTime] = useState<string>('');



  const handleEventMove = async (event: CalendarEvent, targetDate: Date, targetTime?: string) => {
    console.log('handleEventMove called with:', { event, targetDate, targetTime });
    try {
      // Get the target date components
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const targetDay = targetDate.getDate();
      
      let newStart: Date;
      let newEnd: Date;

      if (targetTime) {
        // Parse the target time (format: "HH:MM")
        const [hours, minutes] = targetTime.split(':').map(Number);
        
        // Calculate duration of the original event
        const duration = event.end.getTime() - event.start.getTime();
        
        // Create new start time with the specified time
        newStart = new Date(targetYear, targetMonth, targetDay, hours, minutes, 0);
        
        // Create new end time by adding the original duration
        newEnd = new Date(newStart.getTime() + duration);
      } else {
        // Keep the same time as the original event
        newStart = new Date(
          targetYear,
          targetMonth,
          targetDay,
          event.start.getHours(),
          event.start.getMinutes(),
          event.start.getSeconds()
        );
        newEnd = new Date(
          targetYear,
          targetMonth,
          targetDay,
          event.end.getHours(),
          event.end.getMinutes(),
          event.end.getSeconds()
        );
      }

      console.log('Moving event:', {
        original: { start: event.start, end: event.end },
        new: { start: newStart, end: newEnd }
      });

      const response = await fetch(`/api/calendar/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId: event.id, 
          start: newStart.toISOString(), 
          end: newEnd.toISOString() 
        })
      });
      
      if (response.ok) {
        console.log('Event moved successfully');
        setEvents(prev => prev.map(e => 
          e.id === event.id ? { ...e, start: newStart, end: newEnd } : e
        ));
        setSelectedEventForMove(null); // Clear selected event after move
      } else {
        console.error('Failed to update event:', response.status);
      }
    } catch (error) {
      console.error('Failed to move event:', error);
    }
  };

  const handleAddEvent = async () => {
    try {
      const response = await fetch('/api/calendar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          start: newEvent.start.toISOString(),
          end: newEvent.end.toISOString(),
          description: newEvent.description,
          color: newEvent.color
        })
      });

      if (response.ok) {
        const savedEvent = await response.json();
        setEvents(prev => [...prev, {
          id: savedEvent.id,
          title: savedEvent.title,
          start: new Date(savedEvent.start),
          end: new Date(savedEvent.end),
          description: savedEvent.description,
          color: savedEvent.color,
          source: 'Manual'
        }]);
        setShowAddModal(false);
        setNewEvent({
          title: '',
          start: new Date(),
          end: new Date(new Date().getTime() + 60 * 60 * 1000),
          description: '',
          color: '#3174ad'
        });
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (status === "loading" || loading) return <p>Loading your calendar…</p>;

  if (status === "unauthenticated") {
    return (
      <div className="page-wrapper">
        <div className="calendar-container">
          <h1 className="calendar-title">Prism Calendar</h1>
          <button onClick={() => signIn("google")} className="view-toggle-button">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="page-wrapper">
        <Optimize />

        <div className="calendar-container">
          <div className="view-toggle-group">
            {["day", "week", "month"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as View)}
                className={`view-toggle-button ${view === v ? "active" : ""}`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

                  {selectedEventForMove && (
          <div className="move-indicator">
            <div className="move-info">
              📅 Moving: <strong>{selectedEventForMove.title}</strong>
            </div>
            <div className="move-controls">
              <div className="time-picker">
                <label>Time:</label>
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  placeholder="Keep original time"
                />
              </div>
              <div className="move-instructions">
                Click any date to move it there
                {targetTime && <span className="time-note"> (at {targetTime})</span>}
              </div>
            </div>
            <button
              className="cancel-move"
              onClick={() => {
                setSelectedEventForMove(null);
                setTargetTime('');
              }}
            >
              ❌ Cancel
            </button>
          </div>
        )}
          <div className="event-legend">
            <span style={{ background: "#9b87a6" }} /> GPT Suggestion
            <span style={{ background: "#ebdbb4" }} /> Task Bank
            <span style={{ background: "#d0e4ec" }} /> Google Event
          </div>

          <div
            className="calendar-wrapper"
            style={{
              height: isCollapsed ? "85vh" : "70vh",
            }}
            onClick={(e) => {
              if (selectedEventForMove) {
                console.log('Calendar area clicked');
                // This is just for debugging - we'll remove it
              }
            }}
          >
            <Calendar
              scrollToTime={new Date()}
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={(newView) => setView(newView)}
              views={["day", "week", "month"]}
              style={{ height: "100%", width: "100%", padding: 0 }}
              min={new Date(new Date().setHours(6, 0, 0))}
              step={15}
              timeslots={4}
              selectable
              onSelectEvent={handleEventSelect}

              eventPropGetter={(event) => {
                const backgroundColor = event.color || "#3174ad";
                return {
                  style: {
                    backgroundColor,
                    borderRadius: "5px",
                    color: "black",
                    border: "none",
                    display: "block",
                    padding: "2px 4px",
                    cursor: "grab",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    userSelect: "none",
                    position: "relative"
                  },
                };
              }}
              onDoubleClickEvent={(event) => {
                // Double-click to edit (future feature)
                console.log("Double-clicked event:", event);
              }}
              components={{
                month: {
                  dateHeader: ({ date, ...props }) => {
                    const dayEvents = events.filter(event => {
                      const eventDate = new Date(event.start);
                      return eventDate.getDate() === date.getDate() &&
                             eventDate.getMonth() === date.getMonth() &&
                             eventDate.getFullYear() === date.getFullYear();
                    });
                    
                    return (
                      <div 
                        className="date-header-with-count"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Date clicked:', date);
                          console.log('Selected event for move:', selectedEventForMove);
                          if (selectedEventForMove) {
                            console.log('Attempting to move event to date:', date, 'at time:', targetTime);
                            handleEventMove(selectedEventForMove, date, targetTime || undefined);
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (selectedEventForMove) {
                            e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedEventForMove) {
                            e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                          }
                        }}
                        style={{
                          cursor: selectedEventForMove ? 'pointer' : 'default',
                          backgroundColor: selectedEventForMove ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                          padding: '4px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                          minHeight: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        <span className="date-number">{date.getDate()}</span>
                        {dayEvents.length > 0 && (
                          <span className="event-count-badge">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
                    );
                  }
                },
                event: ({ event, ...props }) => (
                  <div
                    className="custom-event"
                    style={{
                      backgroundColor: event.color || "#3174ad",
                      borderRadius: "5px",
                      color: "black",
                      border: "none",
                      padding: "2px 4px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      userSelect: "none",
                      position: "relative"
                    }}
                  >
                    {event.title}
                    <span className="move-handle">📅</span>
                  </div>
                )
              }}
            />
          </div>
        </div>
        

        
        <Upcoming events={events} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <button
          className="floating-add-button"
          onClick={() => setShowAddModal(true)}
          title="Add New Event"
        >
          <span className="add-icon">+</span>
        </button>

        {showAddModal && (
          <div className="event-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="event-modal-header">
                <h3>➕ Add New Event</h3>
                <button 
                  className="event-modal-close"
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="event-modal-content">
                <div className="form-group">
                  <label>📝 Event Title:</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter event title..."
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>📅 Start Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={newEvent.start.toISOString().slice(0, 16)}
                    onChange={(e) => setNewEvent(prev => ({ 
                      ...prev, 
                      start: new Date(e.target.value),
                      end: new Date(new Date(e.target.value).getTime() + 60 * 60 * 1000)
                    }))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>⏰ End Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={newEvent.end.toISOString().slice(0, 16)}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, end: new Date(e.target.value) }))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>📝 Description (Optional):</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter event description..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>🎨 Color:</label>
                  <div className="color-picker">
                    {['#3174ad', '#9b87a6', '#ebdbb4', '#4CAF50', '#FF9800', '#E91E63'].map(color => (
                      <button
                        key={color}
                        className={`color-option ${newEvent.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="event-modal-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setShowAddModal(false)}
                >
                  ❌ Cancel
                </button>
                <button 
                  className="save-button"
                  onClick={handleAddEvent}
                  disabled={!newEvent.title.trim()}
                >
                  ✅ Save Event
                </button>
              </div>
            </div>
          </div>
        )}


        {showEventModal && selectedEvent && (
          <div className="event-modal-overlay" onClick={() => setShowEventModal(false)}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="event-modal-header">
                <h3>{selectedEvent.title}</h3>
                <button 
                  className="event-modal-close"
                  onClick={() => setShowEventModal(false)}
                >
                  ×
                </button>
              </div>
                                 <div className="event-modal-content">
                     <div className="event-time">
                       <span className="time-label">📅 Date:</span>
                       <span>{formatDate(selectedEvent.start)}</span>
                     </div>
                     <div className="event-time">
                       <span className="time-label">⏰ Time:</span>
                       <span>{formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}</span>
                     </div>
                     {selectedEvent.description && (
                       <div className="event-description">
                         <span className="description-label">📝 Description:</span>
                         <p>{selectedEvent.description}</p>
                       </div>
                     )}
                     <div className="event-source">
                       <span className="source-label">🏷️ Source:</span>
                       <span>{selectedEvent.source || "Manual"}</span>
                     </div>
                   </div>
                   <div className="event-modal-actions">
                     <button
                       className="move-button"
                       onClick={() => {
                         setSelectedEventForMove(selectedEvent);
                         setShowEventModal(false);
                         console.log('Event selected for moving:', selectedEvent.title);
                       }}
                     >
                       📅 Move Event
                     </button>
                   </div>
              
            </div>
          </div>
        )}

        <style jsx global>{`
          .calendar-wrapper {
            width: 100%;
            max-width: 900px;
            height: 105vh;
            margin: 0 auto;
          }

          .calendar-wrapper .rbc-calendar {
            width: 100% !important;
            height: 100% !important;
          }

          .calendar-wrapper .rbc-month-view .rbc-row {
            width: 100% !important;
          }

          .calendar-wrapper .rbc-time-view {
            width: 100% !important;
          }

          .calendar-wrapper .rbc-time-view .rbc-time-content .rbc-day-slot {
            flex: 1 !important;
          }

          .rbc-toolbar > .rbc-btn-group {
            display: none !important;
          }

          .event-legend {
            display: flex;
            gap: 1.5rem;
            font-size: 0.9rem;
            margin: 1rem auto;
            max-width: 900px;
            justify-content: flex-start;
            align-items: center;
          }

          .event-legend span {
            display: inline-block;
            width: 14px;
            height: 14px;
            margin-right: 6px;
            border-radius: 3px;
          }
          
          .rbc-time-slot {
            min-height: 20px;
          }

          .rbc-allday-cell,
          .rbc-time-view .rbc-header-cell {
            height: auto; 
          }

  
          .event-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
          }

          .event-modal {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            animation: modalSlideIn 0.3s ease;
          }

          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .event-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #f0f0f0;
          }

          .event-modal-header h3 {
            margin: 0;
            color: #333;
            font-size: 1.5rem;
            font-weight: 600;
          }

          .event-modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
            padding: 0.5rem;
            border-radius: 50%;
            transition: all 0.2s ease;
          }

          .event-modal-close:hover {
            background: #f0f0f0;
            color: #333;
          }

          .event-modal-content {
            margin-bottom: 1.5rem;
          }

          .event-time,
          .event-description,
          .event-source {
            margin-bottom: 1rem;
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .time-label,
          .description-label,
          .source-label {
            font-weight: 600;
            color: #666;
            min-width: 80px;
            flex-shrink: 0;
          }

          .event-description p {
            margin: 0;
            color: #555;
            line-height: 1.5;
          }

          .event-modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
          }

          .edit-button,
          .delete-button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            font-size: 0.9rem;
          }

          .edit-button {
            background: #2196F3;
            color: white;
          }

          .delete-button {
            background: #f44336;
            color: white;
          }

          .edit-button:hover,
          .delete-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }

          .edit-button:hover {
            background: #1976D2;
          }

          .delete-button:hover {
            background: #d32f2f;
          }

          .floating-add-button {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
            transition: all 0.3s ease;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .floating-add-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(76, 175, 80, 0.6);
          }

          .add-icon {
            font-weight: bold;
            line-height: 1;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #333;
          }

          .form-input,
          .form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
            box-sizing: border-box;
          }

          .form-input:focus,
          .form-textarea:focus {
            outline: none;
            border-color: #4CAF50;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
          }

          .form-textarea {
            resize: vertical;
            min-height: 80px;
          }

          .color-picker {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .color-option {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid transparent;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .color-option:hover {
            transform: scale(1.1);
          }

          .color-option.selected {
            border-color: #333;
            transform: scale(1.2);
          }

          .cancel-button,
          .save-button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            font-size: 0.9rem;
          }

          .cancel-button {
            background: #f5f5f5;
            color: #666;
          }

          .save-button {
            background: #4CAF50;
            color: white;
          }

          .save-button:disabled {
            background: #ccc;
            cursor: not-allowed;
          }

          .cancel-button:hover {
            background: #e0e0e0;
          }

          .save-button:hover:not(:disabled) {
            background: #45a049;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          }

          .date-header-with-count {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .date-number {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }

          .event-count-badge {
            position: absolute;
            top: 0;
            right: 0;
            background-color: #4CAF50;
            color: white;
            border-radius: 10px;
            padding: 4px 8px;
            font-size: 0.75rem;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            z-index: 1;
          }

          .drag-drop-hint {
            margin-left: auto;
            font-size: 0.8rem;
            color: #666;
            font-style: italic;
            padding: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            backdrop-filter: blur(5px);
          }

          .rbc-event:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
            cursor: grabbing !important;
          }

          .rbc-event:active {
            transform: scale(0.98);
            cursor: grabbing !important;
          }

          .rbc-event::before {
            content: "⋮⋮";
            position: absolute;
            top: 2px;
            right: 4px;
            font-size: 0.7rem;
            color: rgba(0,0,0,0.5);
            pointer-events: none;
          }


          .rbc-event[draggable="true"]:active {
            opacity: 0.7;
            transform: scale(0.95);
          }

          .rbc-event[draggable="true"]:hover {
            cursor: grab;
          }

          .rbc-event[draggable="true"]:active {
            cursor: grabbing;
          }

          .rbc-time-slot:hover {
            background-color: rgba(76, 175, 80, 0.1);
            transition: background-color 0.2s ease;
          }

          .custom-event {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.8rem;
            font-weight: 500;
          }

          .custom-event:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
            cursor: grabbing !important;
          }

          .custom-event:active {
            transform: scale(0.98);
            cursor: grabbing !important;
          }

          .drag-handle {
            position: absolute;
            top: 2px;
            right: 4px;
            font-size: 0.7rem;
            color: rgba(0,0,0,0.5);
            pointer-events: none;
          }

          .move-button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
            margin-top: 1rem;
            width: 100%;
          }
          .move-button:hover {
            background: #45a049;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }

          .move-indicator {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            animation: slideIn 0.3s ease;
          }

          .cancel-move {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
          }

          .cancel-move:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
*/
"use client";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import NavBar from "../../NavBar/NavBar";
import Upcoming from "../Upcoming/Upcoming";
import Optimize from "../Optimize/Optimize";
import VoiceCommandManager from "../../VoiceCommands/VoiceCommandManager";
import VoiceCommandToggle from "../../VoiceCommands/VoiceCommandToggle";


const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("day");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // Random encouraging messages for the sliding banner
  const encouragingMessages = [
    "Today is your day to shine!",
    "You've got this! Every step counts",
    "Small progress is still progress",
    "Focus on what matters most",
    "A new day, new opportunities",
    "You're building something amazing",
    "Your ideas have power",
    "Stay curious, stay inspired",
    "Life is an adventure - enjoy the ride",
    "Your potential is limitless",
    "Growth happens one day at a time",
    "You make a difference",
    "Creativity flows through you",
    "You're stronger than you know",
    "Ride the waves of productivity",
    "Every challenge is a chance to grow",
    "Your future self is cheering you on",
    "You're exactly where you need to be",
    "Make today count",
    "Bloom where you're planted"
  ];

  // Cycle through messages every 6 seconds
  useEffect(() => {
    if (view === "day") {
      console.log("🎯 Setting up message cycling for day view");
      
      // Set initial message
      setCurrentMessage(encouragingMessages[0]);
      setMessageIndex(0);
      
      const interval = setInterval(() => {
        setMessageIndex(prev => {
          const newIndex = (prev + 1) % encouragingMessages.length;
          const newMessage = encouragingMessages[newIndex];
          console.log("🔄 Changing message to:", newMessage, "at index:", newIndex);
          setCurrentMessage(newMessage);
          return newIndex;
        });
      }, 10000); // Changed to 10 seconds
      
      return () => {
        console.log("🧹 Cleaning up interval");
        clearInterval(interval);
      };
    }
  }, [view]); // Removed encouragingMessages from dependencies

  useEffect(() => {
    const fetchEvents = () => {
      fetch("/api/calendar/list", { credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch calendar events");
          return res.json();
        })
        .then((data) => {
          const formatted = data.map((event: any) => ({
            id: event.id,
            title: event.title || event.suggestionText || "No Title",
            start: new Date(event.start),
            end: new Date(event.end),
            description: event.source || "",
            color: event.color ?? "#d0e4ec",
          }));
          setEvents(formatted);
        })
        .catch((err) => {
          console.error("Error fetching calendar events:", err);
          setError("Unable to load calendar events.");
        })
        .finally(() => setLoading(false));
    };
    if (status === "authenticated") {
      fetchEvents();
      const listener = () => fetchEvents();
      document.addEventListener("optimizeComplete", listener);
      return () => document.removeEventListener("optimizeComplete", listener);
    }
  }, [status]);

  if (status === "loading" || loading) return <p>Loading your calendar…</p>;

  if (status === "unauthenticated") {
    return (
      <div className="page-wrapper">
        <div className="calendar-container">
          <h1 className="calendar-title">Prism Calendar</h1>
          <button onClick={() => signIn("google")} className="view-toggle-button">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="page-wrapper">
       <Optimize />

        <div className="calendar-container">
          {/* Sliding Encouraging Message Banner - Only show on day view */}
          {view === "day" && currentMessage && (
            <div className="sliding-message-banner">
              <div className="message-content" key={messageIndex}>
                {currentMessage}
              </div>
            </div>
          )}

          <div className="view-toggle-group">
            {["day", "week", "month"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as View)}
                className={`view-toggle-button ${view === v ? "active" : ""}`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <div className="event-legend">
            <span style={{ background: "#9b87a6" }} /> GPT Suggestion
            <span style={{ background: "#ebdbb4" }} /> Task Bank
            <span style={{ background: "#d0e4ec" }} /> Google Event
          </div>

          <div
            className="calendar-wrapper"
            style={{
              height: isCollapsed ? "85vh" : "70vh", // or adjust to your preference
            }}
          >
            <Calendar
              scrollToTime={new Date()}
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={(newView) => setView(newView)}
              views={["day", "week", "month"]}
              style={{ height: "100%", width: "100%", padding: 0 }}
              min={new Date(new Date().setHours(6, 0, 0))}
              step = {15}
              timeslots={4}
              eventPropGetter={(event) => {
                const backgroundColor = event.color || "#3174ad";
                return {
                  style: {
                    backgroundColor,
                    borderRadius: "5px",
                    color: "black",
                    border: "none",
                    display: "block",
                    padding: "2px 4px",
                  },
                };
              }}
              dayPropGetter={(date) => {
                // Check if this day has any events
                const dayEvents = events.filter(event => {
                  const eventDate = new Date(event.start);
                  return eventDate.toDateString() === date.toDateString();
                });
                
                return {
                  className: dayEvents.length === 0 ? 'empty-day' : 'has-events'
                };
              }}
            />
          </div>
        </div>
        
        <Upcoming events={events} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        
        {/* Prism Logo - Bottom Right */}
        <div className="prism-logo">
          <img src="/logo.png" alt="Prism" />
        </div>
         

        <style jsx global>{`
          .calendar-wrapper {
            width: 100%;
            max-width: 900px;
            height:105vh;
            margin: 0 auto;
          }
          .calendar

          .calendar-wrapper .rbc-calendar {
            width: 100% !important;
            height: 100% !important;
          }

          .calendar-wrapper .rbc-month-view .rbc-row {
            width: 100% !important;
          }

          .calendar-wrapper .rbc-time-view {
            width: 100% !important;
          }

          .calendar-wrapper .rbc-time-view .rbc-time-content .rbc-day-slot {
            flex: 1 !important;
          }

          .rbc-toolbar > .rbc-btn-group {
            display: none !important;
          }

          .event-legend {
            display: flex;
            gap: 1.5rem;
            font-size: 0.9rem;
            margin: 1rem auto;
            max-width: 900px;
            justify-content: flex-start;
            align-items: center;
          }

          .event-legend span {
            display: inline-block;
            width: 14px;
            height: 14px;
            margin-right: 6px;
            border-radius: 3px;
          }
          
          .rbc-time-slot{
            min-height: 20px;
          }

          .rbc-allday-cell,
          .rbc-time-view .rbc-header-cell {
            height: auto; 
          }
          
          .rbc-event {
            transition: all 0.2s ease;
            cursor: pointer;
          }

          .rbc-event:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
            z-index: 10;
          }

          .rbc-month-view .rbc-date-cell {
            transition: background-color 0.2s ease;
          }

          .rbc-month-view .rbc-date-cell:hover {
            background-color: rgba(76, 175, 80, 0.05);
            cursor: pointer;
          }

          .prism-logo {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 1000;
            opacity: 0.8;
            transition: all 0.3s ease;
          }

          .prism-logo:hover {
            opacity: 1;
            transform: scale(1.1);
          }

          .prism-logo img {
            width: 120px;
            height: auto;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
          }

          /* Mobile responsive */
          @media (max-width: 768px) {
            .prism-logo {
              bottom: 20px;
              right: 20px;
            }
            
            .prism-logo img {
              width: 100px;
            }
          }


        `}</style>

        {/* Voice Command System */}
        <VoiceCommandManager
          onCalendarEventCreate={async (event) => {
            try {
              const response = await fetch('/api/calendar/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: event.title,
                  start: event.start.toISOString(),
                  end: event.end.toISOString(),
                  description: event.description || '',
                  color: event.color || '#3174ad'
                })
              });

              if (response.ok) {
                const savedEvent = await response.json();
                setEvents(prev => [...prev, {
                  id: savedEvent.id,
                  title: savedEvent.title,
                  start: new Date(savedEvent.start),
                  end: new Date(savedEvent.end),
                  description: savedEvent.description,
                  color: savedEvent.color,
                  source: 'Voice Command'
                }]);
              }
            } catch (error) {
              console.error('Failed to create calendar event:', error);
            }
          }}
          onCalendarEventDelete={async (eventId) => {
            try {
              const response = await fetch(`/api/calendar/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId })
              });

              if (response.ok) {
                setEvents(prev => prev.filter(e => e.id !== eventId));
              }
            } catch (error) {
              console.error('Failed to delete calendar event:', error);
            }
          }}
          events={events}
          isListening={isVoiceListening}
          onListeningChange={setIsVoiceListening}
        />

        <VoiceCommandToggle
          onToggle={setIsVoiceListening}
          isListening={isVoiceListening}
        />
        
      </div>
      
    </div>
  );
}