import { useState } from "react";
import { lookupByPhone, normalizePhone } from "../../lib/db.js";

function formatDate(str) {
  if (!str) return "No waiver on file";
  const d = new Date(str);
  return isNaN(d.getTime()) ? str : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function PhoneLookup({ navigate, onBack }) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "searching" | "found" | "not_found" | "error"
  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    const digits = normalizePhone(phone);
    if (digits.length !== 10) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setStatus("searching");
    try {
      const result = await lookupByPhone(phone);
      if (result) {
        setMatch(result);
        setStatus("found");
      } else {
        setStatus("not_found");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  function handleSamePerson() {
    navigate("guest_form", {
      prefillData: match,
      existingGuestId: match.id,
    });
  }

  function handleStartFresh() {
    navigate("guest_form", {
      prefillData: null,
      existingGuestId: null,
    });
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 1 of 3 — Guest lookup</div>
      </div>
      <div className="screen-body centered">
        <h2 className="question">Enter guest phone number</h2>
        <p className="hint">For a minor without their own phone, use the guardian's number.</p>

        <form onSubmit={handleSearch} className="lookup-form">
          <label htmlFor="phone-lookup">Phone Number</label>
          <input
            id="phone-lookup"
            type="tel"
            placeholder="(253) 555-0123"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setStatus("idle"); setMatch(null); }}
          />
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={status === "searching"}>
            {status === "searching" ? "Searching…" : "Search"}
          </button>
        </form>

        {status === "found" && match && (
          <div className="lookup-result">
            <div className="lookup-match-card">
              <p className="match-name">{match.first_name} {match.last_name}</p>
              <p className="match-waiver">Last waiver: {formatDate(match.last_waiver_date)}</p>
            </div>
            <div className="lookup-actions">
              <button className="btn-primary" onClick={handleSamePerson}>
                Same person — reuse this guest's info
              </button>
              <button className="btn-outline" onClick={handleStartFresh}>
                Different person / start fresh
              </button>
            </div>
          </div>
        )}

        {status === "not_found" && (
          <div className="lookup-no-match">
            <p>No record found for that number.</p>
            <button className="btn-primary" onClick={handleStartFresh}>
              Continue with new guest
            </button>
          </div>
        )}

        {status === "error" && (
          <p className="field-error">Database error — please try again.</p>
        )}
      </div>
    </div>
  );
}
