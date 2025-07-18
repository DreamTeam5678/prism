
interface Event {
    id: string;
    title: string;
    start: Date;
    end: Date;
    description?: string;
}

interface Props {
    events: Event[];
}

  



export default function Upcoming({ events }: Props) {
    const now = new Date();

    const upcoming = events
    .filter(event => new Date(event.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        });
    };

    if (upcoming.length === 0) {
        return (
        <div className="upcoming-container">
            <h2 className="upcoming-title">Upcoming Events</h2>
            <p className="upcoming-empty">No upcoming events.</p>
        </div>
        );
    }

    return (
    <div className="upcoming-container">
      <h2 className="upcoming-title">Upcoming Events</h2>
      <ul className="upcoming-list">
        {upcoming.map(event => (
          <li key={event.id} className="upcoming-item">
            <div className="upcoming-item-title">{event.title}</div>
            <div className="upcoming-item-time">
              {formatDateTime(event.start)} - {formatDateTime(event.end)}
            </div>
            
          </li>
        ))}
      </ul>
    </div>
  );
}


