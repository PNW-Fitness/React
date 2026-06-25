export default function ReturnVisitCheck({ guestSession, navigate, onBack }) {
  function handleYes() {
    navigate("guest_phone_lookup", { returnVisit: true });
  }

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
        <h2 className="question">Have you been here before?</h2>
        <div className="choice-row">
          <button className="btn-choice btn-yes" onClick={handleYes}>Yes</button>
          <button className="btn-choice btn-no" onClick={handleNo}>No</button>
        </div>
      </div>
    </div>
  );
}
