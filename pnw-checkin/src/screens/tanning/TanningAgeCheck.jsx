export default function TanningAgeCheck({ onConfirm, onBack }) {
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 1 of 3 — Age Verification</div>
      </div>
      <div className="screen-body centered">
        <h2 className="question">Is this guest 18 or older?</h2>
        <p style={{ textAlign: "center", color: "#555", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
          By law, individuals under 18 are prohibited from using tanning devices.
        </p>
        <div className="choice-row">
          <button className="btn-choice btn-yes" onClick={onConfirm}>
            Yes — 18 or older
          </button>
          <button className="btn-choice btn-no" onClick={onBack}>
            No — cannot tan
          </button>
        </div>
      </div>
    </div>
  );
}
