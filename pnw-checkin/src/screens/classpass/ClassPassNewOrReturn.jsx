export default function ClassPassNewOrReturn({ onNew, onReturning, onBack }) {
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 2 of 4 — Guest type</div>
      </div>
      <div className="screen-body centered">
        <div className="cp-verify-card">
          <div className="cp-verify-icon">👤</div>
          <h2 className="cp-verify-heading">Is this guest new or returning?</h2>
          <p className="cp-verify-instruction">
            Returning guests already have a waiver on file — they can skip
            straight to check-in.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            <button className="btn-primary btn-large" onClick={onNew}>
              First visit — new guest
            </button>
            <button
              className="btn-secondary btn-large"
              onClick={onReturning}
              style={{ background: "#f0fdf4", color: "#15803d", border: "2px solid #86efac" }}
            >
              Returning guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
