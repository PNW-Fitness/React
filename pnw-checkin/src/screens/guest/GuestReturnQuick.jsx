import { useState } from "react";

const VISIT_REASONS = [
  "Day/week pass workout",
  "Interested in membership",
  "Staff Guest",
  "Event/Promotion",
];

export default function GuestReturnQuick({ guestSession, onCheckIn, onBack, submitting, submitError }) {
  const [visitReason, setVisitReason] = useState(guestSession.formData?.visit_reason || "");

  const name = [guestSession.formData?.first_name, guestSession.formData?.last_name]
    .filter(Boolean).join(" ");

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Quick Check-In</div>
      </div>
      <div className="screen-body centered">
        <div className="return-welcome-icon">👋</div>
        <h2 className="question">Welcome back, {name}!</h2>
        <p className="hint">Waiver and ID already on file — no need to sign again.</p>

        <div className="field return-visit-reason-field">
          <label htmlFor="return-visit-reason">Reason for Visit</label>
          <select
            id="return-visit-reason"
            value={visitReason}
            onChange={(e) => setVisitReason(e.target.value)}
          >
            <option value="">— Select —</option>
            {VISIT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {submitError && <p className="field-error">{submitError}</p>}

        <button
          className="btn-primary btn-large"
          onClick={() => onCheckIn(visitReason)}
          disabled={submitting}
        >
          {submitting ? "Checking in…" : "Check In →"}
        </button>
      </div>
    </div>
  );
}
