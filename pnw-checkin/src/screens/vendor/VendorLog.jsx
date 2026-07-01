import { useState, useEffect } from "react";
import { getTodayVendors } from "../../lib/db.js";
import { supabase } from "../../lib/supabase.js";

function formatTime(str) {
  if (!str) return "";
  // str is "YYYY-MM-DD HH:MM:SS" local time
  const [, timePart] = str.split(" ");
  if (!timePart) return str;
  const [h, m] = timePart.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

// Matches db.js's localNow() shape so both sources sort/format identically.
function isoToLocalTimeString(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function todayLocalMidnightIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function VendorLog({ onDone }) {
  const [localVendors, setLocalVendors] = useState([]);
  const [webVendors, setWebVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let channel;
    let cancelled = false;

    async function init() {
      try {
        const local = await getTodayVendors();
        if (!cancelled) setLocalVendors(local);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load vendor log.");
      }

      const { data, error: fetchErr } = await supabase
        .from("vendor_submissions")
        .select("id, name, company, reason, submitted_at")
        .gte("submitted_at", todayLocalMidnightIso())
        .order("submitted_at", { ascending: false });
      if (!cancelled) {
        if (fetchErr) console.error(fetchErr);
        else setWebVendors(data || []);
        setLoading(false);
      }

      // Unique per mount — see pendingQueue.js for why (StrictMode double-invoke race).
      channel = supabase
        .channel(`vendor_submissions_log-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "vendor_submissions" },
          (payload) => {
            if (cancelled) return;
            setWebVendors((prev) => [payload.new, ...prev]);
          }
        )
        .subscribe();
    }

    init();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const vendors = [
    ...localVendors.map((v) => ({ id: `local-${v.id}`, name: v.name, company: v.company, reason: v.reason, time_in: v.time_in })),
    ...webVendors.map((v) => ({
      id: `web-${v.id}`,
      name: v.name,
      company: v.company,
      reason: v.reason,
      time_in: isoToLocalTimeString(v.submitted_at),
    })),
  ].sort((a, b) => b.time_in.localeCompare(a.time_in));

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="step-indicator">Today's Vendor Log</div>
      </div>

      <div className="screen-body">
        <div className="vendor-log-header">
          <h2>Vendors — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h2>
          <button className="btn-outline" onClick={onDone}>← Home</button>
        </div>

        {loading && <p className="loading-text">Loading…</p>}
        {error && <p className="field-error">{error}</p>}
        {!loading && !error && vendors.length === 0 && (
          <p className="empty-log">No vendors signed in today.</p>
        )}
        {!loading && vendors.length > 0 && (
          <table className="vendor-table">
            <thead>
              <tr>
                <th>Time In</th>
                <th>Name</th>
                <th>Company</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td className="vendor-time">{formatTime(v.time_in)}</td>
                  <td>{v.name}</td>
                  <td>{v.company}</td>
                  <td>{v.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
