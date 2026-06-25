export default function GuestConfirmation({ guestSession, onDone }) {
  const { formData, isMinor, supervisionRequired } = guestSession;
  const guestName = `${formData?.first_name || ""} ${formData?.last_name || ""}`.trim();

  return (
    <div className="screen">
      <div className="screen-body centered">
        {supervisionRequired && (
          <div className="supervision-banner">
            <strong>Staff reminder:</strong> This guest must be supervised by a guardian or personal trainer at all times while using equipment.
          </div>
        )}

        <div className="confirmation-card">
          <div className="confirmation-icon">✅</div>
          <h2>Check-In Complete</h2>
          <p className="confirmation-name">{guestName}</p>
          {isMinor && (
            <p className="confirmation-minor-note">
              Minor guest — waiver signed by guardian {formData?.guardian_name}
            </p>
          )}
          <p className="confirmation-time">
            {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <button className="btn-primary btn-large" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
