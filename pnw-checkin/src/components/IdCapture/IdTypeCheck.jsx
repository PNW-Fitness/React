import { useState } from "react";

const ACCEPTABLE = [
  "Driver's License",
  "State ID",
  "Student Photo ID (must be from a verifiable institution)",
  "International Passport Book",
  "US or other Passport Card",
];

const LAST_RESORT = [
  "United States Passport Book (picture page only)",
];

const DO_NOT = [
  "Government Worker IDs (Federal, State, or Local Agency-issued)",
  "Service Member IDs (e.g., Military CAC Cards)",
  "Workplace IDs",
];

export default function IdTypeCheck({ onConfirm, onBack }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 3 of 4 — ID verification</div>
      </div>

      <div className="screen-body id-type-body">
        <h2 className="id-type-heading">Verify acceptable ID type before photographing</h2>
        <p className="id-type-subtext">
          Check the guest's ID against the lists below before opening the camera.
          Staff judgment only — the app does not detect ID type automatically.
        </p>

        <div className="id-lists">
          <div className="id-list id-list-ok">
            <div className="id-list-header">
              <span className="id-list-badge id-list-badge-ok">✓ Acceptable</span>
            </div>
            <ul className="id-list-items">
              {ACCEPTABLE.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>

            <div className="id-list-last-resort">
              <span className="id-list-badge id-list-badge-warn">⚠ Last resort only</span>
              <p className="id-last-resort-note">
                Use only if nothing from the Acceptable list above is available.
              </p>
              <ul className="id-list-items">
                {LAST_RESORT.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="id-list id-list-no">
            <div className="id-list-header">
              <span className="id-list-badge id-list-badge-no">✗ Do NOT photograph</span>
            </div>
            <p className="id-no-note">
              It is illegal to copy or photograph these ID types. If a guest only
              has one of these, ask for an alternative from the acceptable list instead.
            </p>
            <ul className="id-list-items">
              {DO_NOT.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="id-confirm-row">
          <label className="id-confirm-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Confirmed — this is an acceptable ID type
          </label>
        </div>

        <div className="form-actions">
          <button
            className="btn-primary btn-large"
            disabled={!confirmed}
            onClick={onConfirm}
          >
            Open Camera →
          </button>
        </div>
      </div>
    </div>
  );
}
