import { useState, useEffect } from "react";

const VISIT_REASONS = [
  "Day/week pass workout",
  "Interested in membership",
  "ClassPass",
  "Event/Promotion",
];

const HOW_HEARD_OPTIONS = [
  { value: "Search Engine", label: "Search Engine", hasSpecify: false },
  { value: "Social Media", label: "Social Media", hasSpecify: false },
  { value: "Word of Mouth / Referral", label: "Word of Mouth / Referral (Please specify if current member)", hasSpecify: true },
  { value: "Website / Blog", label: "Website / Blog", hasSpecify: false },
  { value: "Email Newsletter", label: "Email Newsletter", hasSpecify: false },
  { value: "Advertisement", label: "Advertisement", hasSpecify: false },
  { value: "Event / Trade Show", label: "Event / Trade Show", hasSpecify: false },
  { value: "Other", label: "Other (Please specify)", hasSpecify: true },
];

const INTEREST_OPTIONS = [
  "Weight lifting",
  "Cardio",
  "Group Fitness",
  "Personal Training",
  "Tanning",
];

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  zip_code: "",
  phone: "",
  email: "",
  visit_reason: "",
  how_heard: "",
  how_heard_specify: "",
  interests: [],
  guardian_name: "",
  guardian_phone: "",
};

function validate(form, isMinor) {
  const errors = {};
  if (!form.first_name.trim()) errors.first_name = "Required";
  if (!form.last_name.trim()) errors.last_name = "Required";
  if (!/^\d{5}$/.test(form.zip_code.trim())) errors.zip_code = "Enter a 5-digit zip code";
  const digits = form.phone.replace(/\D/g, "");
  if (digits.length !== 10) errors.phone = "Enter a 10-digit phone number";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (!form.visit_reason) errors.visit_reason = "Required";
  if (isMinor) {
    if (!form.guardian_name.trim()) errors.guardian_name = "Required for minor guests";
    const gDigits = form.guardian_phone.replace(/\D/g, "");
    if (gDigits.length !== 10) errors.guardian_phone = "Enter a 10-digit phone number";
  }
  return errors;
}

export default function GuestForm({ guestSession, navigate, onBack }) {
  const { isMinor, prefillData } = guestSession;
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (prefillData) {
      setForm({
        first_name: prefillData.first_name || "",
        last_name: prefillData.last_name || "",
        zip_code: prefillData.zip_code || "",
        phone: prefillData.phone || "",
        email: prefillData.email || "",
        visit_reason: prefillData.visit_reason || "",
        how_heard: prefillData.how_heard || "",
        how_heard_specify: prefillData.how_heard_specify || "",
        interests: prefillData.interests
          ? JSON.parse(prefillData.interests)
          : [],
        guardian_name: prefillData.guardian_name || "",
        guardian_phone: prefillData.guardian_phone || "",
      });
    }
  }, [prefillData]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function toggleInterest(interest) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : [...f.interests, interest],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form, isMinor);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    navigate("guest_waiver", { formData: form });
  }

  const howHeardEntry = HOW_HEARD_OPTIONS.find((o) => o.value === form.how_heard);
  const showSpecify = howHeardEntry?.hasSpecify;

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Step 2 of 3 — Guest information</div>
      </div>

      <div className="screen-body form-body">
        {isMinor && (
          <div className={`notice-minor ${guestSession.supervisionRequired ? "notice-supervision" : ""}`}>
            Minor guest{guestSession.supervisionRequired ? " — supervision required (guardian must be present)" : " (16–17)"}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="form-section">
            <legend>Guest Information</legend>

            <div className="field-row">
              <div className="field">
                <label htmlFor="first_name">First Name *</label>
                <input id="first_name" type="text" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
                {errors.first_name && <p className="field-error">{errors.first_name}</p>}
              </div>
              <div className="field">
                <label htmlFor="last_name">Last Name *</label>
                <input id="last_name" type="text" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
                {errors.last_name && <p className="field-error">{errors.last_name}</p>}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="zip_code">Zip Code *</label>
                <input id="zip_code" type="text" inputMode="numeric" maxLength={5} value={form.zip_code} onChange={(e) => set("zip_code", e.target.value.replace(/\D/g, ""))} />
                {errors.zip_code && <p className="field-error">{errors.zip_code}</p>}
              </div>
              <div className="field">
                <label htmlFor="phone">Phone Number *</label>
                <input id="phone" type="tel" placeholder="(253) 555-0123" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email *</label>
              <input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className="field">
              <label htmlFor="visit_reason">Reason for Visit *</label>
              <select id="visit_reason" value={form.visit_reason} onChange={(e) => set("visit_reason", e.target.value)}>
                <option value="">— Select —</option>
                {VISIT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.visit_reason && <p className="field-error">{errors.visit_reason}</p>}
            </div>
          </fieldset>

          {isMinor && (
            <fieldset className="form-section guardian-section">
              <legend>Guardian Information</legend>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="guardian_name">Guardian Full Name *</label>
                  <input id="guardian_name" type="text" value={form.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} />
                  {errors.guardian_name && <p className="field-error">{errors.guardian_name}</p>}
                </div>
                <div className="field">
                  <label htmlFor="guardian_phone">Guardian Phone *</label>
                  <input id="guardian_phone" type="tel" placeholder="(253) 555-0123" value={form.guardian_phone} onChange={(e) => set("guardian_phone", e.target.value)} />
                  {errors.guardian_phone && <p className="field-error">{errors.guardian_phone}</p>}
                </div>
              </div>
            </fieldset>
          )}

          <fieldset className="form-section optional-section">
            <legend>Optional — Help us serve you better</legend>

            <div className="field">
              <label htmlFor="how_heard">How did you hear about us?</label>
              <select id="how_heard" value={form.how_heard} onChange={(e) => { set("how_heard", e.target.value); set("how_heard_specify", ""); }}>
                <option value="">— Select (optional) —</option>
                {HOW_HEARD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {showSpecify && (
              <div className="field">
                <label htmlFor="how_heard_specify">Please specify</label>
                <input id="how_heard_specify" type="text" value={form.how_heard_specify} onChange={(e) => set("how_heard_specify", e.target.value)} />
              </div>
            )}

            <div className="field">
              <label className="field-label-block">What are you interested in?</label>
              <div className="checkbox-group">
                {INTEREST_OPTIONS.map((interest) => (
                  <label key={interest} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.interests.includes(interest)}
                      onChange={() => toggleInterest(interest)}
                    />
                    {interest}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn-primary btn-large">
              Continue to Waiver →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
