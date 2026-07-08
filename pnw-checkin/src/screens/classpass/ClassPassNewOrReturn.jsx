export default function ClassPassNewOrReturn({ onNew, onBack }) {
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 2 of 4 — Guest type</div>
      </div>
      <div className="screen-body centered">
        <div className="cp-verify-card">
          <div className="cp-verify-icon">👤</div>
          <h2 className="cp-verify-heading">First visit?</h2>
          <p className="cp-verify-instruction">
            New guests complete a quick waiver below.
            Returning guests — please see front desk to be checked in.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            <button className="btn-primary btn-large" onClick={onNew}>
              First visit — new guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
