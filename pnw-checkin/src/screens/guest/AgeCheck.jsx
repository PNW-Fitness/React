import { useState } from "react";

function computeAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function AgeCheck({ navigate, onBack }) {
  const [step, setStep] = useState("ask"); // "ask" | "dob"
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  function handleYes() {
    navigate("guest_return_visit", { isMinor: false, supervisionRequired: false, dob: null });
  }

  function handleNo() {
    setStep("dob");
  }

  function handleDobSubmit(e) {
    e.preventDefault();
    if (!dob) {
      setError("Please enter a date of birth.");
      return;
    }
    const age = computeAge(dob);
    if (age < 0) {
      setError("Invalid date of birth.");
      return;
    }
    if (age < 14) {
      navigate("guest_minor_blocked", { dob });
    } else if (age <= 15) {
      navigate("guest_return_visit", { isMinor: true, supervisionRequired: true, dob });
    } else if (age <= 17) {
      navigate("guest_return_visit", { isMinor: true, supervisionRequired: false, dob });
    } else {
      // Age ≥ 18 but staff clicked No — treat as adult
      navigate("guest_return_visit", { isMinor: false, supervisionRequired: false, dob });
    }
  }

  if (step === "ask") {
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <div className="step-indicator">Step 0 of 3 — Age verification</div>
        </div>
        <div className="screen-body centered">
          <h2 className="question">Is this guest 18 or older?</h2>
          <div className="choice-row">
            <button className="btn-choice btn-yes" onClick={handleYes}>Yes</button>
            <button className="btn-choice btn-no" onClick={handleNo}>No</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={() => { setStep("ask"); setError(""); }}>← Back</button>
        <div className="step-indicator">Step 0 of 3 — Age verification</div>
      </div>
      <div className="screen-body centered">
        <h2 className="question">Enter guest date of birth</h2>
        <form onSubmit={handleDobSubmit} className="dob-form">
          <label htmlFor="dob">Date of Birth</label>
          <input
            id="dob"
            type="date"
            value={dob}
            max={today}
            onChange={(e) => { setDob(e.target.value); setError(""); }}
          />
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="btn-primary">Continue</button>
        </form>
      </div>
    </div>
  );
}
