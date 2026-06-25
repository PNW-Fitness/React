import { useState } from "react";
import { saveVendor } from "../../lib/db.js";

const EMPTY = { name: "", company: "", reason: "" };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Required";
  if (!form.company.trim()) errors.company = "Required";
  if (!form.reason.trim()) errors.reason = "Required";
  return errors;
}

export default function VendorForm({ onDone, onBack }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await saveVendor(form);
      onDone();
    } catch (err) {
      console.error(err);
      setSaveError("Failed to save — please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Vendor Sign-In</div>
      </div>

      <div className="screen-body centered">
        <h2>Vendor Check-In</h2>
        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="vendor-form">
          <div className="field">
            <label htmlFor="v-name">Name *</label>
            <input id="v-name" type="text" autoComplete="off" value={form.name} onChange={(e) => set("name", e.target.value)} />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div className="field">
            <label htmlFor="v-company">Company *</label>
            <input id="v-company" type="text" autoComplete="off" value={form.company} onChange={(e) => set("company", e.target.value)} />
            {errors.company && <p className="field-error">{errors.company}</p>}
          </div>
          <div className="field">
            <label htmlFor="v-reason">Reason for Visit *</label>
            <textarea id="v-reason" rows={3} autoComplete="off" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
            {errors.reason && <p className="field-error">{errors.reason}</p>}
          </div>
          {saveError && <p className="field-error">{saveError}</p>}
          <div className="form-actions">
            <button type="submit" className="btn-primary btn-large" disabled={saving}>
              {saving ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
