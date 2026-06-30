export default function ClassPassConfirmation({ cpSession, exportDir, onDone }) {
  const { guestName } = cpSession;

  return (
    <div className="screen">
      <div className="screen-body centered">
        <div className="confirmation-card">
          <div className="confirmation-icon">✅</div>
          <h2>Check-In Complete</h2>
          <p className="confirmation-name">{guestName}</p>
          <p className="confirmation-time">
            {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
          {exportDir && (
            <p className="confirmation-export-path" title={exportDir}>
              Files saved to: <span className="export-path-text">{exportDir}</span>
            </p>
          )}
          <button className="btn-primary btn-large" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
