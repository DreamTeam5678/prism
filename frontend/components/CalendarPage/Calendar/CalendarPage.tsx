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

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("day");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [messageIndex, setMessageIndex] = useState<number>(0);

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
    "Bloom where you're planted",
    "You're a force to be reckoned with",
    "Your dreams are coming true",
    "Embrace the challenges ahead",
    "You're unstoppable",
    "The future is yours to shape",
    "Be the change you want to see"
  
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
          setCurrentMessage(newMessage + "!");
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
          <div className="calendar-hooks">
            <div className="calendar-hook" />
            <div className="calendar-hook" />
          </div>
          <div className='calendar-hanging-line' />
          {/* Sliding Encouraging Message Banner - Only show on day view */}
          {view === "day" && currentMessage && (
            <div className="calendar-header-wrapper">
              <div className="sliding-message-banner">
                <div className="message-content" key={messageIndex}>
                  {currentMessage}
                </div>
              </div>
              <div className="calendar-top-line" />
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
            font-size: 0.8rem;
            margin: 1rem auto;
            max-width: 900px;
            justify-content: flex-start;
            align-items: center;
            font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            font-weight: 100;
            color:rgba(78, 70, 68, 0.61);
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
            top: -3px;
            right: 10px;
            z-index: 1000;
            opacity: 0.8;
            transition: all 0.3s ease;

          }

          .prism-logo:hover {
            opacity: 1;
            transform: scale(1.1);
          }

          .prism-logo img {
            width: 150px;
            height: auto;
            filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.64));
          
            
          }

          .calendar-hooks {
            display: flex;
            justify-content: space-around;
            gap: 500px;
            margin-top: -30px;
            margin-bottom: 10px;
            z-index: 10;
            position: relative;
          
          }

          .calendar-hook {
            width: 35px;
            height: 35px;
            
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #f5f5f5, #aaa 40%, #444 100%);
            box-shadow:
              inset 0 2px 4px rgba(255, 255, 255, 0.8),
              inset 0 -2px 4px rgba(0, 0, 0, 0.5),
              0 2px 6px rgba(0, 0, 0, 0.4),
              0 0 3px rgba(255, 255, 255, 0.3);
            position: relative;
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-blend-mode: overlay;
          }

          .calendar-hook::after {
            content: '';
            position: absolute;
            top: 10.5px;
            left: 10.5px;
            width: 14px;
            height: 14px;
            background: radial-gradient(circle at center, #f0f0f0 0%, #999 40%, #222 100%);
            border-radius: 50%;
            box-shadow:
              inset 0 2px 3px rgba(0, 0, 0, 0.5),
              0 1px 2px rgba(255, 255, 255, 0.2);

          }

          .calendar-hook:hover {
            
            transition: all 0.3s ease;
          }
          


          .calendar-top-line {
            height: 1px;
            background-color: #999;
            width: 940px;
            margin:0px;
            margin-top: -10px;
            opacity: 0.4;
            box-shadow: 0 1px 1px rgba(208, 73, 28, 0.61);
          }

          /* Mobile responsive */
          @media (max-width: 768px) {
            .prism-logo {
              bottom: 90px;
              right: 20px;
            }
            
            .prism-logo img {
              width: 100px;
            }
          }


        `}</style>


        
      </div>
      
    </div>
  );
}