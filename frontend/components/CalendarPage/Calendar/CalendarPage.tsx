"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CalendarPage.css";
import Upcoming from "../Upcoming/Upcoming";


const localizer = momentLocalizer(moment);

const mockEvents = [
  {
    id: "1",
    title: "Task 1",
    start: new Date("2025-07-10T14:00:00-07:00"),
    end: new Date("2025-07-10T15:00:00-07:00"),
    description: "Do this now",
  },
  {
    id: "2",
    title: "Task 2",
    start: new Date("2025-07-11T14:00:00-07:00"),
    end: new Date("2025-07-11T15:00:00-07:00"),
    description: "Do this later",
  },
];




export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("month");

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      fetch("/api/calendar/list", { credentials: "include" })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch calendar events");
          }
          return res.json();
        })
        .then((data) => {
          setEvents(data);
        })
        .catch((err) => {
          console.error("Error fetching calendar events:", err);
          setError("Unable to load calendar events. Please try again later.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [status]);

  if (status === "loading" || loading) {
    return <p>Loading your calendar...</p>;
  }

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
    <div className="page-wrapper">
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

        <div className="calendar-wrapper">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={(newView) => setView(newView)}
            views={["day", "week", "month", "agenda"]}
            style={{ height: "100%" }}
            min={new Date(new Date().setHours(6, 0, 0))}
          />
        </div>

        <div className="signout-button-wrapper">
          <button onClick={() => signOut()} className="signout-button">
            Sign out
          </button>
        </div>
      </div>

      <Upcoming events={events} />
    </div>
  );
}
