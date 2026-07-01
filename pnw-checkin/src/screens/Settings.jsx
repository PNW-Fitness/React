import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { getExportDir } from "../lib/fileExport/fileExport.js";
import { getPendingSyncStats } from "../lib/db.js";
import { retryPendingLeads } from "../lib/leadSync.js";
import { exportDateRangeCsv } from "../lib/csvExport.js";
import FrontDeskQrCode from "../components/FrontDeskQrCode.jsx";

export default function Settings({ onBack }) {
  const [path, setPath] = useState("");
  const [savedPath, setSavedPath] = useState("");
  const [status, setStatus] = useState(null); // null | 'checking' | 'ready' | 'error'
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [syncStats, setSyncStats] = useState({ total: 0, stuck: 0 });
  const [syncRetrying, setSyncRetrying] = useState(false);

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
                  disabled={syncRetrying}
                >
                  {syncRetrying ? "Retrying…" : "Retry now"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
