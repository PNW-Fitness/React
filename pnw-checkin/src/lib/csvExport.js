import { invoke } from "@tauri-apps/api/core";
import { getExportDir } from "./fileExport/fileExport.js";
import {
  getGuestsByDateRange,
  getClassPassByDateRange,
  getVendorsByDateRange,
} from "./db.js";

function esc(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function row(...values) {
  return values.map(esc).join(",");
}

function buildGuestsCsv(rows) {
  const lines = [
    row(
      "Signed At", "First Name", "Last Name", "Phone", "Email", "Zip",
      "Visit Reason", "How Heard", "Interests", "Is Minor",
      "Guardian Name", "Guardian Phone"
    ),
  ];
  for (const r of rows) {
    let interests = r.interests;
    if (typeof interests === "string" && interests) {
      try { interests = JSON.parse(interests).join("; "); } catch { /* leave as-is */ }
    }
    lines.push(row(
      r.signed_at, r.first_name, r.last_name, r.phone, r.email, r.zip_code,
      r.visit_reason,
      r.how_heard_specify ? `${r.how_heard} — ${r.how_heard_specify}` : r.how_heard,
      interests,
      r.is_minor ? "Yes" : "No",
      r.guardian_name, r.guardian_phone
    ));
  }
  return lines.join("\r\n");
}

function buildClassPassCsv(rows) {
  const lines = [row("Signed At", "Guest Name", "Contact", "Zip Code")];
  for (const r of rows) {
    lines.push(row(r.signed_at, r.guest_name, r.contact, r.zip_code));
  }
  return lines.join("\r\n");
}

function buildVendorsCsv(rows) {
  const lines = [row("Time In", "Name", "Company", "Reason")];
  for (const r of rows) {
    lines.push(row(r.time_in, r.name, r.company, r.reason));
  }
  return lines.join("\r\n");
}

// Queries all three tables for the date range and writes CSV files to
// [export_dir]\exports\. Returns { exportDir, counts }.
export async function exportDateRangeCsv(from, to) {
  const [guests, classPasses, vendors, baseDir] = await Promise.all([
    getGuestsByDateRange(from, to),
    getClassPassByDateRange(from, to),
    getVendorsByDateRange(from, to),
    getExportDir(),
  ]);

  const exportDir = `${baseDir}\\exports`;
  const suffix = `${from}_to_${to}`;

  await Promise.all([
    invoke("write_text_file", {
      path: `${exportDir}\\guests_${suffix}.csv`,
      content: buildGuestsCsv(guests),
    }),
    invoke("write_text_file", {
      path: `${exportDir}\\classpass_${suffix}.csv`,
      content: buildClassPassCsv(classPasses),
    }),
    invoke("write_text_file", {
      path: `${exportDir}\\vendors_${suffix}.csv`,
      content: buildVendorsCsv(vendors),
    }),
  ]);

  return {
    exportDir,
    counts: {
      guests: guests.length,
      classPasses: classPasses.length,
      vendors: vendors.length,
    },
  };
}
