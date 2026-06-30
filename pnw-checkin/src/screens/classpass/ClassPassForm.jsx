import { useState } from "react";

const EMPTY_FORM = { guestName: "", contact: "", zipCode: "" };

function validate(form) {
  const errors = {};
  if (!form.guestName.trim()) {
    errors.guestName = "Required";
  }
  if (!form.contact.trim()) {
    errors.contact = "Required";
  } else if (form.contact.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact.trim())) {
      errors.contact = "Enter a valid email address";
    }
  } else {
    const digits = form.contact.replace(/\D/g, "");
    if (digits.length !== 10) {
      errors.contact = "Enter a 10-digit phone number or an email address";
    }
  }
  if (!/^\d{5}$/.test(form.zipCode.trim())) {
    errors.zipCode = "Enter a 5-digit zip code";
  }
  return errors;
}

export default function ClassPassForm({ onSubmit, onBack }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      guestName: form.guestName.trim(),
      contact: form.contact.trim(),
      zipCode: form.zipCode.trim(),
    });
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 2 of 4 — Guest information</div>
      </div>
      <div className="screen-body form-body">
        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          <fieldset className="form-section">
            <legend>ClassPass Guest Information</legend>

            <div className="field">
              <label htmlFor="cp-guest-name">Guest Name *</label>
              <input
                id="cp-guest-name"
                type="text"
                autoComplete="off"
                placeholder="Full name"
                value={form.guestName}
                onChange={(e) => set("guestName", e.target.value)}
              />
              {errors.guestName && <p className="field-error">{errors.guestName}</p>}
            </div>

            <div className="field">
              <label htmlFor="cp-contact">Phone Number or Email *</label>
              <input
                id="cp-contact"
                type="text"
                autoComplete="off"
                placeholder="(253) 555-0123  or  name@example.com"
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
              />
              {errors.contact && <p className="field-error">{errors.contact}</p>}
            </div>

            <div className="field">
              <label htmlFor="cp-zip">Zip Code *</label>
              <input
                id="cp-zip"
                type="text"
                inputMode="numeric"
                maxLength={5}
                autoComplete="off"
                placeholder="98402"
                value={form.zipCode}
                onChange={(e) => set("zipCode", e.target.value.replace(/\D/g, ""))}
              />
              {errors.zipCode && <p className="field-error">{errors.zipCode}</p>}
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn-primary btn-large">
              Continue →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
