import { useState, useRef } from "react";
import { TANNING_WAIVER_TEXT } from "../../lib/tanningWaiverText.js";
import SignaturePad from "../../components/SignaturePad/SignaturePad.jsx";

export default function TanningWaiver({ tanningSession, onSubmit, onBack, submitError, submitting }) {
  const { fullName } = tanningSession;
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
        <div className="step-indicator">Step 3 of 3 — Consent Form</div>
      </div>

      <div className="screen-body waiver-body">
        <h2 className="waiver-heading">Tanning Release and Consent Form</h2>
        <p className="waiver-intro">Please read this form carefully before signing.</p>

        <div className="waiver-scroll-wrap">
          <div
            className="waiver-scroll"
            ref={scrollRef}
            onScroll={handleScroll}
            tabIndex={0}
            aria-label="Consent form — scroll to bottom to enable agreement"
          >
            <pre className="waiver-text">{TANNING_WAIVER_TEXT}</pre>
          </div>
          {!hasScrolled && (
            <div className="waiver-scroll-arrow" aria-hidden="true">↓</div>
          )}
        </div>

        {!hasScrolled && (
          <p className="waiver-scroll-hint">Scroll to the bottom to unlock the agreement</p>
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
          <p className="signature-label">Member signature — {fullName}</p>
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
            {submitting ? "Saving…" : "Submit Consent Form"}
          </button>
        </div>
      </div>
    </div>
  );
}
