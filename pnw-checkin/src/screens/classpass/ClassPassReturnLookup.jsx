import { useState, useRef } from "react";
import { lookupClassPassGuest } from "../../lib/db.js";

export default function ClassPassReturnLookup({ onFound, onBack }) {
  const [term,     setTerm]     = useState("");
  const [results,  setResults]  = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const debounceRef = useRef(null);

  async function handleChange(value) {
    setTerm(value);
    clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const rows = await lookupClassPassGuest(value);
      setResults(rows);
      setSearched(true);
      setLoading(false);
    }, 300);
  }

  function formatDate(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="step-indicator">Returning guest — lookup</div>
      </div>
      <div className="screen-body" style={{ padding: "24px 20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>
          Find returning guest
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
          Search by name, phone, or email.
        </p>

        <input
          type="text"
          autoFocus
          placeholder="e.g. Jane Smith or 2535550123"
          value={term}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            fontSize: "16px", padding: "12px 14px",
            border: "1px solid #d1d5db", borderRadius: "10px",
            marginBottom: "16px", outline: "none",
          }}
        />

        {loading && (
          <p style={{ color: "#9ca3af", fontSize: "14px", textAlign: "center" }}>
            Searching…
          </p>
        )}

        {!loading && searched && results.length === 0 && (
          <p style={{ color: "#9ca3af", fontSize: "14px", textAlign: "center" }}>
            No returning guests found for "{term}".
          </p>
        )}

        {results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => onFound({ guestName: r.guest_name, contact: r.contact, zipCode: r.zip_code })}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", background: "#fff",
                  border: "1px solid #e5e7eb", borderRadius: "12px",
                  cursor: "pointer", textAlign: "left", width: "100%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: "16px", margin: 0, color: "#111827" }}>
                    {r.guest_name}
                  </p>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0 0" }}>
                    {r.contact}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
                    Last visit: {formatDate(r.last_visit)}
                  </p>
                  <p style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600, margin: "2px 0 0" }}>
                    {r.visit_count} {r.visit_count === 1 ? "visit" : "visits"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
