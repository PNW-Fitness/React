import { useState } from "react";
import { saveVendor } from "../../lib/db.js";
import { supabase } from "../../lib/supabase.js";
import IdCapture from "../../components/IdCapture/IdCapture.jsx";
import IdTypeCheck from "../../components/IdCapture/IdTypeCheck.jsx";

const EMPTY = { name: "", company: "", phone: "", reason: "" };

function validate(form) {
  const errors = {};
  if (!form.name.trim())    errors.name    = "Required";
  if (!form.company.trim()) errors.company = "Required";
  if (!form.phone.trim())   errors.phone   = "Required";
  if (!form.reason.trim())  errors.reason  = "Required";
  return errors;
}

export default function VendorForm({ onDone, onBack }) {
  const [step,      setStep]      = useState("form"); // "form" | "hand_back" | "id_type" | "id_capture"
  const [form,      setForm]      = useState(EMPTY);
  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStep("hand_back");
  }

  async function pushToSupabase() {
    const { error } = await supabase.rpc("insert_vendor_submission", {
      p_name:    form.name,
      p_company: form.company,
      p_phone:   form.phone,
      p_reason:  form.reason,
    });
    return error;
  }

  async function handleIdConfirm(idPhotoDataUrl) {
    setSaving(true);
    setSaveError("");
    try {
      await saveVendor({ ...form, id_photo: idPhotoDataUrl });
    } catch (err) {
      setSaveError("Failed to save locally — please try again.");
      setSaving(false);
      return;
    }
    const error = await pushToSupabase();
    if (error) {
      setSaveError(`Sync failed: ${error.message} (${error.code})`);
      setSaving(false);
      return;
    }
    onDone();
  }

  async function handleSkipId() {
    setSaving(true);
    setSaveError("");
    try {
      await saveVendor({ ...form, id_photo: null });
    } catch (err) {
      setSaveError("Failed to save locally — please try again.");
      setSaving(false);
      return;
    }
    const error = await pushToSupabase();
    if (error) {
      setSaveError(`Sync failed: ${error.message} (${error.code})`);
      setSaving(false);
      return;
    }
    onDone();
  }

  if (step === "hand_back") {
    return (
      <div className="screen">
        <div className="screen-body centered">
          <div style={{ textAlign: "center", maxWidth: 480, padding: "2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1.25rem" }}>🪪</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>
              Please hand the tablet back to our staff member
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
              Our staff will verify your ID before completing sign-in.
            </p>
            <button className="btn-primary btn-large" onClick={() => setStep("id_type")}>
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "id_type") {
    return (
      <IdTypeCheck
        onConfirm={() => setStep("id_capture")}
        onBack={() => setStep("hand_back")}
        onDeclineId={handleSkipId}
      />
    );
  }

  if (step === "id_capture") {
    return (
      <IdCapture
        guestSession={{ isMinor: false, dob: null, formData: { first_name: form.name, last_name: "" } }}
        onConfirm={handleIdConfirm}
        onBack={() => setStep("id_type")}
        onDeclineId={handleSkipId}
      />
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Vendor Sign-In</div>
      </div>

      <div className="screen-body centered">
        <h2>Vendor Check-In</h2>
        <form onSubmit={handleFormSubmit} noValidate autoComplete="off" className="vendor-form">
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
            <label htmlFor="v-phone">Phone *</label>
            <input id="v-phone" type="tel" autoComplete="off" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>
          <div className="field">
            <label htmlFor="v-reason">Reason for Visit *</label>
            <textarea id="v-reason" rows={3} autoComplete="off" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
            {errors.reason && <p className="field-error">{errors.reason}</p>}
          </div>
          {saveError && <p className="field-error">{saveError}</p>}
          <div className="form-actions">
            <button type="submit" className="btn-primary btn-large" disabled={saving}>
              Next — ID Photo →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
