import { useState } from "react";

const MGR_PIN_KEY = "pnw_mgr_override_pin";
const DEFAULT_PIN = "0000";

export function getMgrOverridePin() {
  return localStorage.getItem(MGR_PIN_KEY) || DEFAULT_PIN;
}

export function setMgrOverridePin(pin) {
  localStorage.setItem(MGR_PIN_KEY, pin);
}

export default function ManagerOverrideGate({ onApproved, onBack }) {
  const [digits, setDigits] = useState("");
  const [shake, setShake] = useState(false);

  function press(d) {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === 4) {
      if (next === getMgrOverridePin()) {
        onApproved();
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setDigits(""); }, 600);
      }
    }
  }

  function del() {
    setDigits(d => d.slice(0, -1));
  }

  const dots = Array.from({ length: 4 }, (_, i) => i < digits.length);

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <span className="settings-title">Manager Override</span>
      </div>
      <div className="screen-body centered">
        <div className="override-gate-icon">🔒</div>
        <h2 className="question">Manager Authorization Required</h2>
        <p className="override-gate-desc">
          Bypassing the ID requirement requires a manager PIN.
          Please hand the device to a manager.
        </p>

        <div className={`pin-dots ${shake ? "pin-dots-shake" : ""}`}>
          {dots.map((filled, i) => (
            <span key={i} className={`pin-dot ${filled ? "pin-dot-filled" : ""}`} />
          ))}
        </div>

        <div className="pin-pad">
          {["1","2","3","4","5","6","7","8","9"].map(d => (
            <button key={d} className="pin-key" onClick={() => press(d)}>{d}</button>
          ))}
          <div className="pin-key pin-key-empty" />
          <button className="pin-key" onClick={() => press("0")}>0</button>
          <button className="pin-key pin-key-del" onClick={del}>⌫</button>
        </div>
      </div>
    </div>
  );
}
