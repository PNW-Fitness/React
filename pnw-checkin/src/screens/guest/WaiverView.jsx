import { useState, useRef } from "react";
import { WAIVER_TEXT } from "../../lib/waiverText.js";
import SignaturePad from "../../components/SignaturePad/SignaturePad.jsx";

export default function WaiverView({ guestSession, onSubmit, onBack, submitError, submitting }) {
  const { isMinor, formData } = guestSession;
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const scrollRef = useRef(null);

  function handleScroll() {
    if (hasScrolled) return;
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setHasScrolled(true);
    }
  }

  const signerName = isMinor
    ? (formData.guardian_name || "Guardian")
    : `${formData.first_name || ""} ${formData.last_name || ""}`.trim();

  const heading = isMinor ? "Guardian Acknowledgment" : "Liability Waiver";

  const intro = isMinor
    ? "Please read this waiver carefully. As the guardian of the minor guest, you are agreeing to these terms on their behalf."
    : "Please read this waiver carefully before signing.";

  const canSubmit = hasAgreed && signatureDataUrl && !submitting;

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack} disabled={submitting}>← Back</button>
        <div className="step-indicator">Step 4 of 4 — Waiver</div>
      </div>

      <div className="screen-body waiver-body">
        <h2 className="waiver-heading">{heading}</h2>
        <p className="waiver-intro">{intro}</p>

        <div
          className="waiver-scroll"
          ref={scrollRef}
          onScroll={handleScroll}
          tabIndex={0}
          aria-label="Waiver text — scroll to bottom to enable agreement"
        >
          <pre className="waiver-text">{WAIVER_TEXT}</pre>
        </div>

        {!hasScrolled && (
          <p className="waiver-scroll-hint">↓ Scroll to the bottom to enable the agreement checkbox</p>
        )}

        <div className="waiver-agree-row">
          <label className={`agree-label ${!hasScrolled ? "agree-disabled" : ""}`}>
            <input
              type="checkbox"
              checked={hasAgreed}
              disabled={!hasScrolled}
              onChange={(e) => {
                setHasAgreed(e.target.checked);
                if (!e.target.checked) setSignatureDataUrl(null);
              }}
            />
            I have read and agree to the terms above
            {isMinor && " on behalf of the minor guest"}
          </label>
        </div>

        <div className="signature-section">
          <p className="signature-label">
            {isMinor ? "Guardian signature" : "Guest signature"} — {signerName}
          </p>
          <SignaturePad
            enabled={hasAgreed}
            onChange={(dataUrl) => setSignatureDataUrl(dataUrl)}
            onClear={() => setSignatureDataUrl(null)}
          />
        </div>

        {submitError && (
          <p className="field-error submit-error">{submitError}</p>
        )}

        <div className="form-actions">
          <button
            className="btn-primary btn-large"
            disabled={!canSubmit}
            onClick={() => onSubmit(signatureDataUrl)}
          >
            {submitting ? "Saving…" : "Complete Check-In"}
          </button>
        </div>
      </div>
    </div>
  );
}
