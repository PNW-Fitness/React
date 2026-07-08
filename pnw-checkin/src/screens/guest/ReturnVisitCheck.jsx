import { useState } from "react";

export default function ReturnVisitCheck({ guestSession, navigate, onBack }) {
  const [showFrontDesk, setShowFrontDesk] = useState(false);

  function handleNo() {
    navigate("guest_form", { returnVisit: false, prefillData: null, existingGuestId: null });
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 1 of 3 — Visit history</div>
      </div>
      <div className="screen-body centered">
        {guestSession.isMinor && (
          <div className="notice-minor">
            Minor guest {guestSession.supervisionRequired ? "(14–15, supervision required)" : "(16–17)"}
          </div>
        )}

        {showFrontDesk ? (
          <div className="cp-verify-card">
            <div className="cp-verify-icon">🙋</div>
            <h2 className="cp-verify-heading">Please see front desk</h2>
            <p className="cp-verify-instruction">
              A staff member will look up your record, verify your ID, and log your visit.
            </p>
            <button className="btn-secondary btn-large" onClick={onBack} style={{ marginTop: "8px" }}>
              Back to Start
            </button>
          </div>
        ) : (
          <>
            <h2 className="question">Have you been here before?</h2>
            <div className="choice-row">
              <button className="btn-choice btn-yes" onClick={() => setShowFrontDesk(true)}>Yes</button>
              <button className="btn-choice btn-no" onClick={handleNo}>No</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
