import { useState } from "react";

const PIN_STORAGE_KEY = "pnw_settings_pin";
const DEFAULT_PIN = "0000";

export function getSettingsPin() {
  return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
}

export function setSettingsPin(pin) {
  localStorage.setItem(PIN_STORAGE_KEY, pin);
}

export default function SettingsPinGate({ onSuccess, onBack }) {
  const [digits, setDigits] = useState("");
  const [shake, setShake] = useState(false);

  function press(d) {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === 4) {
      if (next === getSettingsPin()) {
        onSuccess();
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
        <span className="settings-title">Settings</span>
      </div>
      <div className="screen-body centered">
        <h2 className="question">Enter Settings PIN</h2>

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
