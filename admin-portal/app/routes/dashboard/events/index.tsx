import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus, X } from "lucide-react";

const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const calendarDays = [
  [24, 25, 26, 27, 28, 29, 30],
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, 31, 1, 2, 3, 4],
];

export default function EventsAndTrainingPage() {
  return (
    <section className="admin-events-page">
      <div className="admin-members-header">
        <h1 className="admin-dashboard-title">Event &amp; Training</h1>
        <button type="button" className="admin-members-add-btn">
          <Plus size={14} aria-hidden="true" />
          <span>Add Event</span>
        </button>
      </div>

      <section className="admin-events-card">
        <div className="admin-events-topbar">
          <div className="admin-events-month-nav">
            <h2>October 2023</h2>
            <div className="admin-events-month-nav-buttons">
              <button type="button" aria-label="Previous month">
                <ChevronLeft size={14} aria-hidden="true" />
              </button>
              <button type="button" aria-label="Next month">
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="admin-events-view-switcher" aria-label="Calendar view">
            <button type="button" className="is-active">Month</button>
            <button type="button">Week</button>
            <button type="button">Day</button>
          </div>
        </div>

        <div className="admin-events-calendar">
          <div className="admin-events-weekdays">
            {weekDays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="admin-events-grid">
            {calendarDays.flat().map((day, index) => {
              const isMuted = index < 7 || index >= 35;
              const isHighlighted = day === 19 && index >= 21 && index < 28;

              return (
                <div className={`admin-events-cell${isMuted ? " is-muted" : ""}`} key={`${index}-${day}`}>
                  <span className={`admin-events-day-number${isHighlighted ? " is-highlighted" : ""}`}>{day}</span>

                  {day === 2 && index >= 7 && index < 14 ? (
                    <div className="admin-events-chip is-red">
                      <strong>Civil Eng Workshop</strong>
                      <span>09:00 AM</span>
                    </div>
                  ) : null}

                  {day === 10 && index >= 14 && index < 21 ? (
                    <div className="admin-events-chip is-blue">
                      <strong>BIM Training</strong>
                    </div>
                  ) : null}

                  {day === 19 && index >= 21 && index < 28 ? (
                    <div className="admin-events-chip is-green">
                      <strong>Annual General Mtg</strong>
                    </div>
                  ) : null}

                  {day === 23 && index >= 28 && index < 35 ? (
                    <div className="admin-events-chip is-orange">
                      <strong>Safety Standards</strong>
                    </div>
                  ) : null}
                </div>
              );
            })}

            <article className="admin-events-detail-card">
              <div className="admin-events-detail-head">
                <span className="admin-events-detail-badge">Conference</span>
                <button type="button" aria-label="Close event details">
                  <X size={14} aria-hidden="true" />
                </button>
              </div>

              <h3>Annual General Meeting 2023</h3>

              <div className="admin-events-detail-meta">
                <p>
                  <CalendarDays size={14} aria-hidden="true" />
                  <span>Oct 19, 2023 | 08:30 AM</span>
                </p>
                <p>
                  <MapPin size={14} aria-hidden="true" />
                  <span>JNICC, Dar es Salaam</span>
                </p>
              </div>

              <button type="button" className="admin-events-detail-btn">View Full Details</button>
            </article>
          </div>
        </div>
      </section>
    </section>
  );
}
