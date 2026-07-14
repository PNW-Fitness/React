import { useState, useEffect, useRef } from "react";
import { saveVendor, searchVendors } from "../../lib/db.js";
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

function formatLastVisit(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VendorForm({ onDone, onBack }) {
  // steps: "landing" | "return_search" | "return_confirm" | "form" | "hand_back" | "id_type" | "id_capture"
  const [step,         setStep]         = useState("landing");
  const [form,         setForm]         = useState(EMPTY);
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState("");

  // Return visitor search
  const [searchTerm,   setSearchTerm]   = useState("");
  const [searchResults,setSearchResults]= useState([]);
  const [searching,    setSearching]    = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const searchTimer = useRef(null);

  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const rows = await searchVendors(searchTerm);
        setSearchResults(rows ?? []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
  }, [searchTerm]);

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

  function handleSelectReturn(vendor) {
    setSelected(vendor);
    setReturnReason(vendor.reason || "");
    setStep("return_confirm");
  }

  function handleConfirmReturn() {
    // Pre-fill the form from the selected returning vendor
    setForm({
      name:    selected.name    || "",
      company: selected.company || "",
      phone:   selected.phone   || "",
      reason:  returnReason.trim() || selected.reason || "",
    });
    setStep("hand_back");
  }

  async function pushToSupabase(formData) {
    const { error } = await supabase.rpc("insert_vendor_submission", {
      p_name:    formData.name,
      p_company: formData.company,
      p_phone:   formData.phone,
      p_reason:  formData.reason,
    });
    return error;
  }

  async function handleIdConfirm(idPhotoDataUrl) {
    setSaving(true);
    setSaveError("");
    try {
      await saveVendor({ ...form, id_photo: idPhotoDataUrl });
    } catch {
      setSaveError("Failed to save locally — please try again.");
      setSaving(false);
      return;
    }
    const error = await pushToSupabase(form);
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
    } catch {
      setSaveError("Failed to save locally — please try again.");
      setSaving(false);
      return;
    }
    const error = await pushToSupabase(form);
    if (error) {
      setSaveError(`Sync failed: ${error.message} (${error.code})`);
      setSaving(false);
      return;
    }
    onDone();
  }

  // ── Landing ──────────────────────────────────────────────────────────────
  if (step === "landing") {
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <div className="step-indicator">Vendor Sign-In</div>
        </div>
        <div className="screen-body centered">
          <div style={{ textAlign: "center", maxWidth: 460, padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏢</div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.75rem", color: "#111827" }}>
              Have you visited before?
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "2.5rem" }}>
              Returning visitors can check in quickly without re-entering all their information.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button
                className="btn-primary btn-large"
                onClick={() => setStep("return_search")}
              >
                Yes — returning visitor
              </button>
              <button
                className="btn-secondary btn-large"
                onClick={() => setStep("form")}
              >
                No — first time here
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Return search ─────────────────────────────────────────────────────────
  if (step === "return_search") {
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="btn-back" onClick={() => { setSearchTerm(""); setSearchResults([]); setStep("landing"); }}>← Back</button>
          <div className="step-indicator">Find Your Record</div>
        </div>
        <div className="screen-body" style={{ padding: "2rem" }}>
          <h2 style={{ marginBottom: "1.25rem" }}>Search by name, company, or phone</h2>
          <input
            type="text"
            autoFocus
            placeholder="Start typing…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%", padding: "0.75rem 1rem", fontSize: "1.1rem",
              border: "1.5px solid #d1d5db", borderRadius: "0.75rem",
              marginBottom: "1.5rem", outline: "none", boxSizing: "border-box",
            }}
          />
          {searching && (
            <p style={{ color: "#9ca3af", textAlign: "center" }}>Searching…</p>
          )}
          {!searching && searchTerm.trim().length >= 2 && searchResults.length === 0 && (
            <div style={{ textAlign: "center", color: "#6b7280", marginTop: "1rem" }}>
              <p>No previous records found.</p>
              <button
                className="btn-secondary"
                style={{ marginTop: "1rem" }}
                onClick={() => setStep("form")}
              >
                Fill in new form instead
              </button>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {searchResults.map((v, i) => (
              <button
                key={i}
                onClick={() => handleSelectReturn(v)}
                style={{
                  textAlign: "left", background: "#fff", border: "1.5px solid #e5e7eb",
                  borderRadius: "0.75rem", padding: "1rem 1.25rem", cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
              >
                <div style={{ fontWeight: 600, color: "#111827", marginBottom: "0.2rem" }}>{v.name}</div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  {v.company}{v.company && v.phone ? " · " : ""}{v.phone}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.15rem" }}>
                  Last visit: {formatLastVisit(v.last_visit)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Return confirm ────────────────────────────────────────────────────────
  if (step === "return_confirm") {
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="btn-back" onClick={() => setStep("return_search")}>← Back</button>
          <div className="step-indicator">Confirm Details</div>
        </div>
        <div className="screen-body" style={{ padding: "2rem", maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>Is this you?</h2>
          <div style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.25rem 1.5rem", marginBottom: "1.75rem" }}>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827", marginBottom: "0.25rem" }}>{selected?.name}</div>
            <div style={{ color: "#6b7280", fontSize: "0.95rem" }}>{selected?.company}</div>
            {selected?.phone && <div style={{ color: "#6b7280", fontSize: "0.95rem" }}>{selected?.phone}</div>}
          </div>

          <div className="field" style={{ marginBottom: "1.75rem" }}>
            <label htmlFor="v-return-reason" style={{ fontWeight: 600, marginBottom: "0.5rem", display: "block" }}>
              Reason for today's visit
            </label>
            <textarea
              id="v-return-reason"
              rows={3}
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              placeholder="Same as before or update here…"
              style={{
                width: "100%", padding: "0.75rem 1rem", fontSize: "1rem",
                border: "1.5px solid #d1d5db", borderRadius: "0.75rem",
                resize: "none", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              className="btn-primary btn-large"
              onClick={handleConfirmReturn}
              disabled={!returnReason.trim()}
            >
              Yes, check in →
            </button>
            <button
              className="btn-secondary"
              onClick={() => setStep("return_search")}
            >
              Not me — search again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Hand back ─────────────────────────────────────────────────────────────
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

  // ── ID type ───────────────────────────────────────────────────────────────
  if (step === "id_type") {
    return (
      <IdTypeCheck
        onConfirm={() => setStep("id_capture")}
        onBack={() => setStep("hand_back")}
        onDeclineId={handleSkipId}
      />
    );
  }

  // ── ID capture ────────────────────────────────────────────────────────────
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

  // ── New vendor form ───────────────────────────────────────────────────────
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={() => setStep("landing")}>← Back</button>
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
