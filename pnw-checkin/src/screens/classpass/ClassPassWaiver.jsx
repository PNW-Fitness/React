import { useState, useRef } from "react";
import { CLASSPASS_WAIVER_TEXT } from "../../lib/classpassWaiverText.js";
import SignaturePad from "../../components/SignaturePad/SignaturePad.jsx";

export default function ClassPassWaiver({ cpSession, onSubmit, onBack, submitError, submitting }) {
  const { guestName } = cpSession;
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

  const canSubmit = hasAgreed && signatureDataUrl && !submitting;

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack} disabled={submitting}>← Back</button>
        <div className="step-indicator">Step 4 of 4 — Waiver</div>
      </div>

      <div className="screen-body waiver-body">
        <h2 className="waiver-heading">Liability Waiver</h2>
        <p className="waiver-intro">Please read this waiver carefully before signing.</p>

        <div
          className="waiver-scroll"
          ref={scrollRef}
          onScroll={handleScroll}
          tabIndex={0}
          aria-label="Waiver text — scroll to bottom to enable agreement"
        >
          <pre className="waiver-text">{CLASSPASS_WAIVER_TEXT}</pre>
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
          </label>
        </div>

        <div className="signature-section">
          <p className="signature-label">Guest signature — {guestName}</p>
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
