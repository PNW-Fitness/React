import { useState } from "react";

export default function ClassPassBookingVerify({ onConfirm, onBack }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 1 of 4 — Booking verification</div>
      </div>
      <div className="screen-body centered">
        <div className="cp-verify-card">
          <div className="cp-verify-icon">📋</div>
          <h2 className="cp-verify-heading">Verify ClassPass Booking</h2>
          <p className="cp-verify-instruction">
            Check the ClassPass app or schedule and confirm this guest has an
            active booking under the name they provide, then check them in on
            ClassPass before continuing.
          </p>
          <label className="cp-verify-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Confirmed — booking verified on ClassPass
          </label>
          <button
            className="btn-primary btn-large"
            disabled={!confirmed}
            onClick={onConfirm}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
