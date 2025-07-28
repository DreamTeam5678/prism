import { useState } from 'react';

interface Event {
    id: string;
    title: string;
    start: Date;
    end: Date;
    description?: string;
}

interface Props {
    events: Event[];
    isCollapsed: boolean;
    setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

  



export default function Upcoming({ events, isCollapsed, setIsCollapsed }: Props) {
  const now = new Date();

  const upcoming = events
    .filter((event) => new Date(event.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`upcoming-container ${isCollapsed ? 'collapsed' : ''}`}>
      <h2 className="upcoming-title" onClick={toggleCollapsed} style={{ cursor: 'pointer' }}>
        Upcoming Events {isCollapsed ? '▶' : '▼'}
      </h2>

      {!isCollapsed && upcoming.length > 0 && (
        <ul className="upcoming-list">
          {upcoming.map((event) => (
            <li key={event.id} className="upcoming-item">
              <div className="upcoming-item-title">{event.title}</div>
              <div className="upcoming-item-time">
                {formatDateTime(event.start)} - {formatDateTime(event.end)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isCollapsed && upcoming.length === 0 && (
        <p className="upcoming-empty">No upcoming events.</p>
      )}
    </div>
  );
}