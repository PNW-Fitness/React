import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getActiveCheckinSession, generateNewCheckinSession } from "../lib/checkinSession.js";
import { CHECKIN_WEB_BASE_URL } from "../lib/checkinWebConfig.js";

async function renderQr(token) {
  const url = `${CHECKIN_WEB_BASE_URL}/checkin?token=${token}`;
  return QRCode.toDataURL(url, { width: 480, margin: 1 });
}

function formatExpiry(iso) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FrontDeskQrCode() {
  const [session, setSession] = useState(null); // { token, expiresAt } | null
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const active = await getActiveCheckinSession();
        setSession(active);
        if (active) setQrDataUrl(await renderQr(active.token));
      } catch (err) {
        console.error("Failed to load front desk QR code:", err);
        setError("Could not load the check-in QR code.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isValid = session && new Date(session.expiresAt) > new Date();

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const fresh = await generateNewCheckinSession();
      setSession(fresh);
      setQrDataUrl(await renderQr(fresh.token));
      setConfirmRegen(false);
    } catch (err) {
      console.error("Failed to generate front desk QR code:", err);
      setError("Could not generate a new code — please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Front Desk Check-In QR Code</h2>
      <p className="settings-section-desc">
        Print this code and post it at the front desk. Guests scan it with their own
        phone to fill out their check-in form and sign the waiver before staff verify
        their ID. Each code is valid for about a day — generate and print a fresh one
        each morning so a photo of yesterday's poster can't be reused later.
      </p>

      {loading && <p className="loading-text">Loading…</p>}

      {!loading && qrDataUrl && (
        <>
          <div className="qr-print-area">
            <img src={qrDataUrl} alt="Front desk check-in QR code" className="settings-qr-image" />
          </div>
          <div className={`settings-status ${isValid ? "settings-status-ready" : "settings-status-error"}`}>
            {isValid
              ? `✓ Valid until ${formatExpiry(session.expiresAt)}`
              : `✗ Expired ${formatExpiry(session.expiresAt)} — generate today's code and reprint`}
          </div>
        </>
      )}

      {!loading && !session && (
        <div className="settings-status settings-status-checking">
          No check-in code has been generated yet.
        </div>
      )}

      {error && <div className="settings-status settings-status-error">{error}</div>}

      <div className="settings-save-row settings-qr-actions">
        {qrDataUrl && (
          <button className="btn-outline" onClick={() => window.print()} disabled={loading}>
            Print
          </button>
        )}

        {!isValid ? (
          <button className="btn-primary" onClick={handleGenerate} disabled={loading || generating}>
            {generating ? "Generating…" : "Generate Today's Code"}
          </button>
        ) : !confirmRegen ? (
          <button className="btn-outline" onClick={() => setConfirmRegen(true)} disabled={loading}>
            Generate New Code…
          </button>
        ) : (
          <>
            <span className="settings-qr-confirm-text">
              This invalidates the current code before it expires. Continue?
            </span>
            <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating…" : "Yes, generate new code"}
            </button>
            <button className="btn-outline" onClick={() => setConfirmRegen(false)} disabled={generating}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
