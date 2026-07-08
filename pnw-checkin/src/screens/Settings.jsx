import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { getExportDir } from "../lib/fileExport/fileExport.js";
import { getPendingSyncStats, resetStuckLeads, getPendingClassPassStats, resetStuckClassPass } from "../lib/db.js";
import { retryPendingLeads, retryPendingClassPass, pushClassPassToSupabase } from "../lib/leadSync.js";
import { supabase } from "../lib/supabase.js";
import { exportDateRangeCsv } from "../lib/csvExport.js";
import FrontDeskQrCode from "../components/FrontDeskQrCode.jsx";
import { getSettingsPin, setSettingsPin } from "./SettingsPinGate.jsx";
import { getMgrOverridePin, setMgrOverridePin } from "./ManagerOverrideGate.jsx";

export default function Settings({ onBack }) {
  const [path, setPath] = useState("");
  const [savedPath, setSavedPath] = useState("");

  // Settings PIN change state
  const [pinCurrent, setPinCurrent] = useState("");
  const [pinNew,     setPinNew]     = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinMsg,     setPinMsg]     = useState({ type: "", text: "" });

  // Manager override PIN change state
  const [mgrPinCurrent, setMgrPinCurrent] = useState("");
  const [mgrPinNew,     setMgrPinNew]     = useState("");
  const [mgrPinConfirm, setMgrPinConfirm] = useState("");
  const [mgrPinMsg,     setMgrPinMsg]     = useState({ type: "", text: "" });

  function handleChangePin(e) {
    e.preventDefault();
    if (pinCurrent !== getSettingsPin()) {
      setPinMsg({ type: "error", text: "Current PIN is incorrect." });
      return;
    }
    if (!/^\d{4}$/.test(pinNew)) {
      setPinMsg({ type: "error", text: "New PIN must be exactly 4 digits." });
      return;
    }
    if (pinNew !== pinConfirm) {
      setPinMsg({ type: "error", text: "PINs do not match." });
      return;
    }
    setSettingsPin(pinNew);
    setPinCurrent(""); setPinNew(""); setPinConfirm("");
    setPinMsg({ type: "success", text: "PIN updated." });
  }

  function handleChangeMgrPin(e) {
    e.preventDefault();
    if (mgrPinCurrent !== getMgrOverridePin()) {
      setMgrPinMsg({ type: "error", text: "Current PIN is incorrect." });
      return;
    }
    if (!/^\d{4}$/.test(mgrPinNew)) {
      setMgrPinMsg({ type: "error", text: "New PIN must be exactly 4 digits." });
      return;
    }
    if (mgrPinNew !== mgrPinConfirm) {
      setMgrPinMsg({ type: "error", text: "PINs do not match." });
      return;
    }
    setMgrOverridePin(mgrPinNew);
    setMgrPinCurrent(""); setMgrPinNew(""); setMgrPinConfirm("");
    setMgrPinMsg({ type: "success", text: "PIN updated." });
  }
  const [status, setStatus] = useState(null); // null | 'checking' | 'ready' | 'error'
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [syncStats, setSyncStats] = useState({ total: 0, stuck: 0 });
  const [syncRetrying, setSyncRetrying] = useState(false);
  const [syncResetting, setSyncResetting] = useState(false);

  const [cpSyncStats, setCpSyncStats] = useState({ total: 0, stuck: 0, lastError: null });
  const [cpSyncRetrying, setCpSyncRetrying] = useState(false);
  const [cpSyncResetting, setCpSyncResetting] = useState(false);
  const [cpTestResult, setCpTestResult] = useState(null); // null | { ok, msg }
  const [cpTesting,    setCpTesting]    = useState(false);
  const [vendorTesting, setVendorTesting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  })();
  const [exportFrom, setExportFrom] = useState(weekAgo);
  const [exportTo, setExportTo] = useState(today);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportError, setExportError] = useState(null);

  useEffect(() => {
    getExportDir().then((dir) => {
      setPath(dir);
      setSavedPath(dir);
      checkWritable(dir);
    });
    getPendingSyncStats().then(setSyncStats);
    getPendingClassPassStats().then(setCpSyncStats);
  }, []);

  async function checkWritable(dir) {
    setStatus("checking");
    const ok = await invoke("check_dir_writable", { path: dir });
    setStatus(ok ? "ready" : "error");
  }

  async function handleExport() {
    setExporting(true);
    setExportResult(null);
    setExportError(null);
    try {
      const result = await exportDateRangeCsv(exportFrom, exportTo);
      setExportResult(result);
    } catch (err) {
      setExportError(typeof err === "string" ? err : err?.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function handleSyncRetry() {
    setSyncRetrying(true);
    try {
      await retryPendingLeads();
    } finally {
      const stats = await getPendingSyncStats();
      setSyncStats(stats);
      setSyncRetrying(false);
    }
  }

  async function handleResetStuck() {
    setSyncResetting(true);
    try {
      await resetStuckLeads();
      await retryPendingLeads();
    } finally {
      const stats = await getPendingSyncStats();
      setSyncStats(stats);
      setSyncResetting(false);
    }
  }

  async function handleCpSyncRetry() {
    setCpSyncRetrying(true);
    try {
      await retryPendingClassPass();
    } finally {
      setCpSyncStats(await getPendingClassPassStats());
      setCpSyncRetrying(false);
    }
  }

  async function handleCpTestSync() {
    setCpTesting(true);
    setCpTestResult(null);
    // Use a unique phone so dedup never matches an existing record.
    const testPhone = `000${Date.now().toString().slice(-7)}`;
    const signedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const { success, error } = await pushClassPassToSupabase(
      { guestName: 'SYNC TEST — DELETE ME', contact: testPhone, zipCode: '00000' },
      signedAt
    );
    setCpTestResult(
      success
        ? { ok: true,  msg: `✓ Success — test entry created (phone ${testPhone}). Mark it as test in admin panel and delete.` }
        : { ok: false, msg: `✗ Failed: ${error}` }
    );
    setCpTesting(false);
  }

  async function handleVendorTestSync() {
    setVendorTesting(true);
    try {
      const { error } = await supabase.rpc("insert_vendor_submission", {
        p_name:    "TEST VENDOR — DELETE ME",
        p_company: "Test Company",
        p_phone:   "0000000000",
        p_reason:  "Connection test",
      });
      // Use alert so the result is always visible regardless of scroll position.
      if (error) {
        alert(`Vendor sync FAILED:\n${error.message}\nCode: ${error.code}`);
      } else {
        alert("Vendor sync OK — test entry created. Delete it from the Vendor Log.");
      }
    } catch (err) {
      alert(`Vendor sync EXCEPTION:\n${err?.message ?? String(err)}`);
    } finally {
      setVendorTesting(false);
    }
  }

  async function handleCpResetStuck() {
    setCpSyncResetting(true);
    try {
      await resetStuckClassPass();
      await retryPendingClassPass();
    } finally {
      setCpSyncStats(await getPendingClassPassStats());
      setCpSyncResetting(false);
    }
  }

  async function handleBrowse() {
    const selected = await open({ directory: true, title: "Select export folder" });
    if (selected) {
      setPath(selected);
      setJustSaved(false);
      checkWritable(selected);
    }
  }

  async function handleSave() {
    setSaving(true);
    setJustSaved(false);
    try {
      await invoke("set_export_dir", { path });
      setSavedPath(path);
      setJustSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const isDirty = path !== savedPath;
  const canSave = isDirty && status === "ready";

  let saveLabel = "Save";
  if (saving) saveLabel = "Saving…";
  else if (justSaved && !isDirty) saveLabel = "Saved ✓";

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <span className="settings-title">Settings</span>
      </div>
      <div className="screen-body">
        <FrontDeskQrCode />

        <div className="settings-divider" />

        <div className="settings-section">
          <h2 className="settings-section-title">Export Folder</h2>
          <p className="settings-section-desc">
            Signed PDF records are saved here, organized by date.
            Choose a OneDrive-synced folder to back them up automatically.
          </p>

          <div className="settings-path-row">
            <div className="settings-path-display">{path || "—"}</div>
            <button className="btn-outline settings-browse-btn" onClick={handleBrowse}>
              Browse…
            </button>
          </div>

          {status === "checking" && (
            <div className="settings-status settings-status-checking">Checking folder…</div>
          )}
          {status === "ready" && (
            <div className="settings-status settings-status-ready">✓ Folder exists and is writable</div>
          )}
          {status === "error" && (
            <div className="settings-status settings-status-error">✗ Folder not found or not writable</div>
          )}

          <div className="settings-save-row">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!canSave || saving}
            >
              {saveLabel}
            </button>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <h2 className="settings-section-title">Folder Structure</h2>
          <p className="settings-section-desc">
            Files are automatically sorted into subfolders by check-in type inside each date folder.
          </p>
          <div className="settings-tree">
            <div className="settings-tree-row">
              <span className="tree-icon">📁</span>
              <span className="tree-label tree-root">{path || "[export folder]"}</span>
            </div>
            <div className="settings-tree-row tree-indent-1">
              <span className="tree-icon">📁</span>
              <span className="tree-label">YYYY-MM-DD</span>
            </div>
            <div className="settings-tree-row tree-indent-2">
              <span className="tree-icon">📁</span>
              <span className="tree-label">Guests</span>
            </div>
            <div className="settings-tree-row tree-indent-3">
              <span className="tree-icon">📄</span>
              <span className="tree-label tree-file">GuestName_ID.pdf</span>
            </div>
            <div className="settings-tree-row tree-indent-2">
              <span className="tree-icon">📁</span>
              <span className="tree-label">ClassPass</span>
            </div>
            <div className="settings-tree-row tree-indent-3">
              <span className="tree-icon">📄</span>
              <span className="tree-label tree-file">ClassPass_Name_ID.pdf</span>
            </div>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <h2 className="settings-section-title">Export Data</h2>
          <p className="settings-section-desc">
            Export guest, ClassPass, and vendor records as CSV files.
            Files are saved to the <strong>exports</strong> subfolder of your export folder.
          </p>

          <div className="settings-date-row">
            <div className="settings-date-field">
              <label className="settings-date-label">From</label>
              <input
                type="date"
                className="settings-date-input"
                value={exportFrom}
                max={exportTo}
                onChange={e => { setExportFrom(e.target.value); setExportResult(null); }}
              />
            </div>
            <div className="settings-date-field">
              <label className="settings-date-label">To</label>
              <input
                type="date"
                className="settings-date-input"
                value={exportTo}
                min={exportFrom}
                max={today}
                onChange={e => { setExportTo(e.target.value); setExportResult(null); }}
              />
            </div>
          </div>

          <div className="settings-save-row">
            <button className="btn-primary" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>

          {exportResult && (
            <div className="settings-status settings-status-ready">
              ✓ {exportResult.counts.guests} guests · {exportResult.counts.classPasses} ClassPass · {exportResult.counts.vendors} vendors
              <div className="settings-export-path">{exportResult.exportDir}</div>
            </div>
          )}
          {exportError && (
            <div className="settings-status settings-status-error">{exportError}</div>
          )}
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <h2 className="settings-section-title">Settings PIN</h2>
          <p className="settings-section-desc">
            Change the 4-digit PIN required to open Settings from the kiosk landing screen.
            Default PIN is <strong>0000</strong>.
          </p>
          <form onSubmit={handleChangePin} className="settings-pin-form">
            <div className="settings-pin-fields">
              <div className="settings-date-field">
                <label className="settings-date-label">Current PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="settings-date-input"
                  value={pinCurrent}
                  onChange={e => { setPinCurrent(e.target.value.replace(/\D/g, '')); setPinMsg({ type: "", text: "" }); }}
                  placeholder="••••"
                />
              </div>
              <div className="settings-date-field">
                <label className="settings-date-label">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="settings-date-input"
                  value={pinNew}
                  onChange={e => { setPinNew(e.target.value.replace(/\D/g, '')); setPinMsg({ type: "", text: "" }); }}
                  placeholder="••••"
                />
              </div>
              <div className="settings-date-field">
                <label className="settings-date-label">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="settings-date-input"
                  value={pinConfirm}
                  onChange={e => { setPinConfirm(e.target.value.replace(/\D/g, '')); setPinMsg({ type: "", text: "" }); }}
                  placeholder="••••"
                />
              </div>
            </div>
            {pinMsg.text && (
              <div className={`settings-status ${pinMsg.type === "error" ? "settings-status-error" : "settings-status-ready"}`}>
                {pinMsg.type === "success" ? "✓ " : "✗ "}{pinMsg.text}
              </div>
            )}
            <div className="settings-save-row">
              <button type="submit" className="btn-primary" disabled={!pinCurrent || !pinNew || !pinConfirm}>
                Update PIN
              </button>
            </div>
          </form>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <h2 className="settings-section-title">Manager Override PIN</h2>
          <p className="settings-section-desc">
            Required when front desk staff tap "Guest declined to provide ID."
            Keep this PIN separate from the Settings PIN and share it only with managers.
            Default is <strong>0000</strong> — change it before going live.
          </p>
          <form onSubmit={handleChangeMgrPin} className="settings-pin-form">
            <div className="settings-pin-fields">
              <div className="settings-date-field">
                <label className="settings-date-label">Current PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="settings-date-input"
                  value={mgrPinCurrent}
                  onChange={e => { setMgrPinCurrent(e.target.value.replace(/\D/g, '')); setMgrPinMsg({ type: "", text: "" }); }}
                  placeholder="••••"
                />
              </div>
              <div className="settings-date-field">
                <label className="settings-date-label">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="settings-date-input"
                  value={mgrPinNew}
                  onChange={e => { setMgrPinNew(e.target.value.replace(/\D/g, '')); setMgrPinMsg({ type: "", text: "" }); }}
                  placeholder="••••"
                />
              </div>
              <div className="settings-date-field">
                <label className="settings-date-label">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="settings-date-input"
                  value={mgrPinConfirm}
                  onChange={e => { setMgrPinConfirm(e.target.value.replace(/\D/g, '')); setMgrPinMsg({ type: "", text: "" }); }}
                  placeholder="••••"
                />
              </div>
            </div>
            {mgrPinMsg.text && (
              <div className={`settings-status ${mgrPinMsg.type === "error" ? "settings-status-error" : "settings-status-ready"}`}>
                {mgrPinMsg.type === "success" ? "✓ " : "✗ "}{mgrPinMsg.text}
              </div>
            )}
            <div className="settings-save-row">
              <button type="submit" className="btn-primary" disabled={!mgrPinCurrent || !mgrPinNew || !mgrPinConfirm}>
                Update PIN
              </button>
            </div>
          </form>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <h2 className="settings-section-title">Vendor Sync</h2>
          <p className="settings-section-desc">
            Vendor sign-ins are pushed to the admin panel Vendor Log via Supabase.
            Use this to verify the connection is working.
          </p>
          <div className="settings-save-row">
            <button className="btn-outline" onClick={handleVendorTestSync} disabled={vendorTesting}>
              {vendorTesting ? "Testing…" : "Test vendor sync"}
            </button>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <h2 className="settings-section-title">Lead Sync</h2>
          <p className="settings-section-desc">
            Qualifying guest check-ins are pushed to the admin panel as leads.
            Records that fail to sync are retried automatically every 5 minutes.
          </p>

          {syncStats.total === 0 ? (
            <div className="settings-status settings-status-ready">✓ No pending records</div>
          ) : (
            <>
              <div className={`settings-status ${syncStats.stuck > 0 ? "settings-status-error" : "settings-status-checking"}`}>
                {syncStats.total} pending
                {syncStats.stuck > 0 && ` · ${syncStats.stuck} stuck (≥10 failed attempts)`}
              </div>
              <div className="settings-save-row">
                <button
                  className="btn-primary"
                  onClick={handleSyncRetry}
                  disabled={syncRetrying || syncResetting}
                >
                  {syncRetrying ? "Retrying…" : "Retry now"}
                </button>
                {syncStats.stuck > 0 && (
                  <button
                    className="btn-outline"
                    onClick={handleResetStuck}
                    disabled={syncRetrying || syncResetting}
                    title="Reset stuck records and try again"
                  >
                    {syncResetting ? "Resetting…" : "Reset stuck & retry"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <h2 className="settings-section-title">ClassPass Lead Sync</h2>
          <p className="settings-section-desc">
            ClassPass check-ins are pushed to the admin panel leads.
            Records that fail to sync are retried automatically every 5 minutes.
          </p>

          <div className="settings-save-row">
            <button className="btn-outline" onClick={handleCpTestSync} disabled={cpTesting}>
              {cpTesting ? "Testing…" : "Test connection"}
            </button>
          </div>
          {cpTestResult && (
            <div className={`settings-status ${cpTestResult.ok ? "settings-status-ready" : "settings-status-error"}`} style={{ wordBreak: "break-word" }}>
              {cpTestResult.msg}
            </div>
          )}

          {cpSyncStats.total === 0 ? (
            <div className="settings-status settings-status-ready">✓ No pending records</div>
          ) : (
            <>
              <div className={`settings-status ${cpSyncStats.stuck > 0 ? "settings-status-error" : "settings-status-checking"}`}>
                {cpSyncStats.total} pending
                {cpSyncStats.stuck > 0 && ` · ${cpSyncStats.stuck} stuck (≥10 failed attempts)`}
              </div>
              {cpSyncStats.lastError && (
                <div className="settings-status settings-status-error" style={{ marginTop: "0.5rem", fontSize: "0.8rem", wordBreak: "break-word" }}>
                  Last error: {cpSyncStats.lastError}
                </div>
              )}
              <div className="settings-save-row">
                <button
                  className="btn-primary"
                  onClick={handleCpSyncRetry}
                  disabled={cpSyncRetrying || cpSyncResetting}
                >
                  {cpSyncRetrying ? "Retrying…" : "Retry now"}
                </button>
                {cpSyncStats.stuck > 0 && (
                  <button
                    className="btn-outline"
                    onClick={handleCpResetStuck}
                    disabled={cpSyncRetrying || cpSyncResetting}
                    title="Reset stuck records and try again"
                  >
                    {cpSyncResetting ? "Resetting…" : "Reset stuck & retry"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
