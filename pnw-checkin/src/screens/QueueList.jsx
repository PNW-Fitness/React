function formatSubmittedTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function QueueList({ queue, onCheckIn, onBack }) {
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
                  <div className="queue-card-time">Submitted {formatSubmittedTime(row.submitted_at)}</div>
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
