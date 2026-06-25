import { useState, useRef } from "react";

// TODO: confirm data-sharing practice with ownership before adding any privacy statement

const WAIVER_TEXT = `Liability of Personal Property
I acknowledge and agree that Pacific Northwest Fitness shall not be liable for any personal property that is damaged, lost, or stolen while on or around Pacific Northwest Fitness' premises, including, but not limited to, a vehicle or its contents or any property left in the locker.

Health Representations and Agreements
I represent and warrant to Pacific Northwest Fitness that I am in good physical condition and have no medical reason or impairment that could prevent me from intended use of Pacific Northwest Fitness facilities.

Waiver of Liability; Assumption of Risk
I acknowledge that the use of Pacific Northwest facilities, equipment, services, and programs involves inherent risk of personal injury, and I voluntarily agree to assume all risk of personal injury. I waive any and all claims or actions that I may have against Pacific Northwest Fitness and any of its subsidiaries or other affiliates and any of their respective officers, directors, employees, agents, successors, and assigns for any such personal injury (and no such person shall be liable to me for any such personal injury), including, without limitation:
(i) Injuries arising from use of any exercise equipment, machines, and tanning booths;
(ii) Injuries arising from participation in supervised or unsupervised activities and programs in exercise rooms, running tracks, swimming pools, hot tubs, courts, or other areas of Pacific Northwest Fitness;
(iii) Injuries or medical disorders resulting from exercising at any Pacific Northwest Fitness, including heart attack, stroke, heat stress, sprains, broken bones, and torn or damaged muscles, ligaments, or tendons; and
(iv) Accidental injuries within any Pacific Northwest facility, including locker rooms, steam rooms, whirlpools, hot tubs, spas, saunas, showers, and dressing rooms.

Equipment and Product Liability
I acknowledge that (x) Pacific Northwest Fitness does not manufacture any of the fitness or other equipment at its facilities and (y) Pacific Northwest Fitness does not manufacture any vitamins, food products, sports drinks, nutritional supplements, and other products sold at its facilities. Accordingly, neither Pacific Northwest Fitness, any of its subsidiaries or other affiliates, nor any of their respective officers, directors, employees, agents, successors, and assigns shall be held liable for any such defective equipment or products.

Indemnification
I will indemnify each of Pacific Northwest Fitness, its subsidiaries, and other affiliates and each of their respective officers, directors, employees, agents, successors, and assigns (an "Indemnified Party") and save and hold each of them harmless against and pay on behalf of or reimburse any such Indemnified Party as when incurred for any losses which such Indemnified Party may suffer, sustain, or become subject to, as a result or in connection with, relating or incidental to or by virtue of any claim that is subject to the waiver set forth above.`;

export default function WaiverView({ guestSession, onSubmit, onBack, submitError }) {
  const { isMinor, formData } = guestSession;
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const scrollRef = useRef(null);

  function handleScroll() {
    if (hasScrolled) return;
    const el = scrollRef.current;
    if (!el) return;
    // Allow a 20px buffer so the guest doesn't have to scroll to the last pixel
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setHasScrolled(true);
    }
  }

  const signerName = isMinor
    ? (formData.guardian_name || "Guardian")
    : `${formData.first_name || ""} ${formData.last_name || ""}`.trim();

  const heading = isMinor
    ? "Guardian Acknowledgment"
    : "Liability Waiver";

  const intro = isMinor
    ? `Please read this waiver carefully. As the guardian of the minor guest, you are agreeing to these terms on their behalf.`
    : `Please read this waiver carefully before signing.`;

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 3 of 3 — Waiver</div>
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
              onChange={(e) => setHasAgreed(e.target.checked)}
            />
            I have read and agree to the terms above
            {isMinor && " on behalf of the minor guest"}
          </label>
        </div>

        <div className="signature-section">
          <p className="signature-label">
            {isMinor ? "Guardian signature" : "Guest signature"} — {signerName}
          </p>
          <div className={`signature-stub ${hasAgreed ? "signature-stub-enabled" : "signature-stub-disabled"}`}>
            {hasAgreed
              ? "Signature capture — coming in next phase"
              : "Please read and agree to the waiver to enable signing"}
          </div>
        </div>

        {submitError && (
          <p className="field-error submit-error">{submitError}</p>
        )}

        <div className="form-actions">
          <button
            className="btn-primary btn-large"
            disabled={!hasAgreed}
            onClick={onSubmit}
          >
            Complete Check-In
          </button>
        </div>
      </div>
    </div>
  );
}
