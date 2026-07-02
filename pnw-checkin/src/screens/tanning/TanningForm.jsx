import { useState } from "react";

function isValidPhone(v) { return /^\d{10}$/.test(v.replace(/\D/g, "")); }
function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidZip(v)   { return /^\d{5}$/.test(v); }

const EMPTY = { fullName: "", contact: "", zipCode: "" };

function validate(form) {
  const e = {};
  if (!form.fullName.trim()) e.fullName = "Required";
  if (!form.contact.trim()) {
    e.contact = "Required";
  } else if (form.contact.includes("@")) {
    if (!isValidEmail(form.contact)) e.contact = "Enter a valid email address";
  } else if (!isValidPhone(form.contact)) {
    e.contact = "Enter a 10-digit phone number or email";
  }
  if (!isValidZip(form.zipCode)) e.zipCode = "Enter a 5-digit zip code";
  return e;
}

export default function TanningForm({ onSubmit, onBack }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({
      fullName: form.fullName.trim(),
      contact:  form.contact.trim(),
      zipCode:  form.zipCode.trim(),
    });
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 2 of 3 — Your Information</div>
      </div>
      <div className="screen-body">
        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="guest-form">
          <fieldset className="form-section">
            <legend>Tanning Member Information</legend>

            <div className="field">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="First and last name"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
              {errors.fullName && <p className="field-error">{errors.fullName}</p>}
            </div>

            <div className="field">
              <label>Phone Number or Email *</label>
              <input
                type="text"
                placeholder="(253) 555-0123 or name@example.com"
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
              />
              {errors.contact && <p className="field-error">{errors.contact}</p>}
            </div>

            <div className="field">
              <label>Zip Code *</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="98402"
                value={form.zipCode}
                onChange={(e) => set("zipCode", e.target.value.replace(/\D/g, ""))}
              />
              {errors.zipCode && <p className="field-error">{errors.zipCode}</p>}
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn-primary btn-large">
              Continue to Consent Form →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
