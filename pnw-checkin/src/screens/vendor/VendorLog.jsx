import { useState, useEffect } from "react";
import { getTodayVendors } from "../../lib/db.js";

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

export default function VendorLog({ onDone }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTodayVendors()
      .then(setVendors)
      .catch((err) => { console.error(err); setError("Could not load vendor log."); })
      .finally(() => setLoading(false));
  }, []);

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
