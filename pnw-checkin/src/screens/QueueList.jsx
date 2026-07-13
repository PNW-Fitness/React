import { useState, useEffect } from "react";

function formatSubmittedAt(iso) {
  const d = new Date(iso);
  const now = new Date();

  const diffMs  = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMin / 60);

  let elapsed;
  if (diffMin < 1)       elapsed = "just now";
  else if (diffMin < 60) elapsed = `${diffMin} min ago`;
  else if (diffHr < 24)  elapsed = `${diffHr} hr ${diffMin % 60} min ago`;
  else                   elapsed = `${diffHr} hr ago`;

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate();

  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dateStr = isToday
    ? timeStr
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " at " + timeStr;

  return { dateStr, elapsed, isLate: diffMin >= 10 };
}

export default function QueueList({ queue, onCheckIn, onBack }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Check-In Queue</div>
      </div>

      <div className="screen-body">
        {queue.length === 0 && <p className="empty-log">No one waiting.</p>}

        <div className="queue-list">
          {queue.map((row) => {
            const fd = row.form_data || {};
            const name =
              row.flow_type === "classpass"
                ? fd.guest_name
                : `${fd.first_name || ""} ${fd.last_name || ""}`.trim();

            return (
              <div key={row.id} className="queue-card">
                <div className="queue-card-info">
                  <div className="queue-card-badges">
                    <span className={`queue-flow-badge queue-flow-${row.flow_type}`}>
                      {row.flow_type === "classpass" ? "ClassPass" : "Guest"}
                    </span>
                    {fd.is_minor && <span className="queue-minor-badge">Minor</span>}
                  </div>
                  <div className="queue-card-name">{name || "—"}</div>
                  {row.submitted_at && (() => {
                    const { dateStr, elapsed, isLate } = formatSubmittedAt(row.submitted_at);
                    return (
                      <div className="queue-card-time">
                        Submitted {dateStr}
                        <span style={{ marginLeft: 6, color: isLate ? "#dc2626" : "#6b7280", fontWeight: isLate ? 600 : 400 }}>
                          ({elapsed})
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <button className="btn-primary" onClick={() => onCheckIn(row)}>
                  Check In →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
