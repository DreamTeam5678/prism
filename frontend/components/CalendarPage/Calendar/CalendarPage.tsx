// frontend/components/CalendarPage/Calendar/CalendarPage.tsx
/*
"use client";
import { signIn, signOut, useSession } from "next-auth/react";
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
  const [view, setView] = useState<View>("month");

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
            title: event.title || "No Title",
            start: new Date(event.start),
            end: new Date(event.end),
            description: event.source || "",
            color: event.color ?? "#d0e4ec"
          }));
          setEvents(formatted);
        })
        .catch((err) => {
          console.error("Error fetching calendar events:", err);
          setError("Unable to load calendar events.");
        })
        .finally(() => setLoading(false));
    };
    if (status === "authenticated"){
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
          <h1 className="calendar-title">Your Calendar</h1>
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

          <div className="calendar-wrapper">
            <Calendar
              //connecting to moment.js for date formatting
              localizer={localizer}
              //passes in events from Google Calendar fetched data
              events={events}
              //sets the start and end date accessors
              startAccessor="start"
              endAccessor="end"
              //toggles view between day, week, and month
              view={view}
              onView={(newView) => setView(newView)}
              views={["day", "week", "month"]}
              //styling for calendar display size
              style={{ height: "100%", width: "100%", padding: 0 }}
              //sets minimum start time to begin at 6am
              min={new Date(new Date().setHours(6, 0, 0))}
              eventPropGetter={(event) => {
                const backgroundColor = event.color || "#3174ad"; // default blue fallback
                return {
                  style: { 
                    backgroundColor,
                    borderRadius: "5px",
                    color: "black",
                    border: "none",
                    display : "block",
                    padding : "2px 4px",
                  },
                };
              }}
            />
          </div>
        </div>

        <Upcoming events={events} />

        <style jsx global>{`
          .calendar-wrapper {
            width: 100%;
            max-width: 900px;
            height: 75vh;
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
        `}</style>
      </div>
    </div>
  );
}
*/
// frontend/components/CalendarPage/CalendarPage.tsx
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
  const [view, setView] = useState<View>("month");

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

          <div className="calendar-wrapper"
            style={{ height: view === "day" ? "85vh" : "85vh" }} 
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
            />
          </div>
        </div>

        <Upcoming events={events} />

        <style jsx global>{`
          .calendar-wrapper {
            width: 100%;
            max-width: 900px;
            height: 85vh;
            margin: 0 auto;
          }
          .calemdar

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
        `}</style>
      </div>
    </div>
  );
}