// NOTE: better-sqlite3 is a Node.js native addon and cannot run inside WebView2.
// tauri-plugin-sql provides the same SQLite functionality through the Rust backend.
// The schema and SQL queries below are identical to what better-sqlite3 would use.

import Database from "@tauri-apps/plugin-sql";

let _db = null;

// To seed test data, open a PowerShell terminal and run:
//   $dbPath = "$env:APPDATA\com.veteran.pnw-checkin\pnw-checkin.db"
//   sqlite3 $dbPath "INSERT INTO guests (first_name, last_name, zip_code, phone, email, visit_reason, is_minor, supervision_required, created_at) VALUES ('Jane', 'Doe', '98402', '2535550123', 'jane@example.com', 'Day/week pass workout', 0, 0, datetime('now', 'localtime'));"
// For a test minor record (age 14-15), add is_minor=1, supervision_required=1

async function getDb() {
  if (_db) return _db;

  _db = await Database.load("sqlite:pnw-checkin.db");

  await _db.execute(`
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      visit_reason TEXT NOT NULL,
      how_heard TEXT,
      how_heard_specify TEXT,
      interests TEXT,
      is_minor INTEGER NOT NULL DEFAULT 0,
      supervision_required INTEGER NOT NULL DEFAULT 0,
      guardian_name TEXT,
      guardian_phone TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await _db.execute(`
    CREATE TABLE IF NOT EXISTS waivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER NOT NULL REFERENCES guests(id),
      signed_at TEXT NOT NULL,
      signed_by_guardian INTEGER NOT NULL DEFAULT 0,
      pdf_path TEXT,
      id_photo_path TEXT
    )
  `);

  await _db.execute(
    `CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone)`
  );

  await _db.execute(`
    CREATE TABLE IF NOT EXISTS vendor_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      reason TEXT NOT NULL,
      time_in TEXT NOT NULL
    )
  `);

  await _db.execute(`
    CREATE TABLE IF NOT EXISTS classpass_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      contact TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      booking_verified INTEGER NOT NULL DEFAULT 0,
      signed_at TEXT NOT NULL,
      pdf_path TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await _db.execute(`
    CREATE TABLE IF NOT EXISTS pending_lead_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER NOT NULL,
      payload TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      last_attempted_at TEXT
    )
  `);

  return _db;
}

export function localNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function normalizePhone(phone) {
  return phone.replace(/\D/g, "").slice(-10);
}

// Returns the most recent guest matching this phone, plus their last waiver date.
// Returns null if no match.
export async function lookupByPhone(rawPhone) {
  const db = await getDb();
  const phone = normalizePhone(rawPhone);
  const rows = await db.select(
    `SELECT g.id, g.first_name, g.last_name, g.zip_code, g.phone, g.email,
            g.visit_reason, g.how_heard, g.how_heard_specify, g.interests,
            g.is_minor, g.supervision_required, g.guardian_name, g.guardian_phone,
            MAX(w.signed_at) as last_waiver_date
     FROM guests g
     LEFT JOIN waivers w ON w.guest_id = g.id
     WHERE g.phone = ?
     GROUP BY g.id
     ORDER BY g.created_at DESC
     LIMIT 1`,
    [phone]
  );
  return rows.length > 0 ? rows[0] : null;
}

// Inserts a new guest row. Returns the new guest id.
export async function saveGuest(data) {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO guests
       (first_name, last_name, zip_code, phone, email, visit_reason,
        how_heard, how_heard_specify, interests,
        is_minor, supervision_required, guardian_name, guardian_phone, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.first_name,
      data.last_name,
      data.zip_code,
      normalizePhone(data.phone),
      data.email,
      data.visit_reason,
      data.how_heard || null,
      data.how_heard_specify || null,
      data.interests ? JSON.stringify(data.interests) : null,
      data.is_minor ? 1 : 0,
      data.supervision_required ? 1 : 0,
      data.guardian_name || null,
      data.guardian_phone ? normalizePhone(data.guardian_phone) : null,
      localNow(),
    ]
  );
  return result.lastInsertId;
}

// Inserts a waiver row linked to guestId. Returns { id, signedAt }.
export async function saveWaiver(guestId, signedByGuardian = false, signedAt = null) {
  const db = await getDb();
  const ts = signedAt || localNow();
  const result = await db.execute(
    `INSERT INTO waivers (guest_id, signed_at, signed_by_guardian)
     VALUES (?, ?, ?)`,
    [guestId, ts, signedByGuardian ? 1 : 0]
  );
  return { id: result.lastInsertId, signedAt: ts };
}

// Updates pdf_path on a waiver row after successful file export.
export async function updateWaiverPaths(waiverId, pdfPath) {
  const db = await getDb();
  await db.execute(
    `UPDATE waivers SET pdf_path = ? WHERE id = ?`,
    [pdfPath, waiverId]
  );
}

// Inserts a ClassPass check-in row. Returns the new row id.
export async function saveClassPassCheckin(data) {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO classpass_checkins (guest_name, contact, zip_code, booking_verified, signed_at, created_at)
     VALUES (?, ?, ?, 1, ?, ?)`,
    [data.guestName, data.contact, data.zipCode, data.signedAt, localNow()]
  );
  return result.lastInsertId;
}

// Updates pdf_path on a classpass_checkins row after successful file export.
export async function updateClassPassPdfPath(checkinId, pdfPath) {
  const db = await getDb();
  await db.execute(
    `UPDATE classpass_checkins SET pdf_path = ? WHERE id = ?`,
    [pdfPath, checkinId]
  );
}

// Inserts a vendor log entry. Returns the new row id.
export async function saveVendor(data) {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO vendor_log (name, company, reason, time_in)
     VALUES (?, ?, ?, ?)`,
    [data.name, data.company, data.reason, localNow()]
  );
  return result.lastInsertId;
}

// Adds a failed lead push to the retry queue.
export async function queuePendingLead(guestId, payload) {
  const db = await getDb();
  await db.execute(
    `INSERT INTO pending_lead_sync (guest_id, payload, created_at)
     VALUES (?, ?, ?)`,
    [guestId, JSON.stringify(payload), localNow()]
  );
}

// Returns pending leads that have not yet exceeded 10 attempts.
export async function getPendingLeads() {
  const db = await getDb();
  return await db.select(
    `SELECT id, guest_id, payload, attempt_count, last_error
     FROM pending_lead_sync
     WHERE attempt_count < 10
     ORDER BY id ASC`
  );
}

// Removes a successfully synced lead from the queue.
export async function deletePendingLead(id) {
  const db = await getDb();
  await db.execute(`DELETE FROM pending_lead_sync WHERE id = ?`, [id]);
}

// Increments attempt_count and records the last error message.
export async function updatePendingLeadAttempt(id, error) {
  const db = await getDb();
  await db.execute(
    `UPDATE pending_lead_sync
     SET attempt_count = attempt_count + 1,
         last_error = ?,
         last_attempted_at = ?
     WHERE id = ?`,
    [error, localNow(), id]
  );
}

// Returns { total, stuck } counts for the Settings screen.
export async function getPendingSyncStats() {
  const db = await getDb();
  const rows = await db.select(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN attempt_count >= 10 THEN 1 ELSE 0 END) as stuck
     FROM pending_lead_sync`
  );
  const row = rows[0] ?? {};
  return { total: Number(row.total ?? 0), stuck: Number(row.stuck ?? 0) };
}

// Returns guest+waiver rows whose waiver was signed within [from, to] (YYYY-MM-DD inclusive).
export async function getGuestsByDateRange(from, to) {
  const db = await getDb();
  return await db.select(
    `SELECT g.first_name, g.last_name, g.phone, g.email, g.zip_code,
            g.visit_reason, g.how_heard, g.how_heard_specify, g.interests,
            g.is_minor, g.guardian_name, g.guardian_phone,
            w.signed_at
     FROM guests g
     JOIN waivers w ON w.guest_id = g.id
     WHERE date(w.signed_at) >= ? AND date(w.signed_at) <= ?
     ORDER BY w.signed_at ASC`,
    [from, to]
  );
}

// Returns ClassPass check-in rows within [from, to] (YYYY-MM-DD inclusive).
export async function getClassPassByDateRange(from, to) {
  const db = await getDb();
  return await db.select(
    `SELECT guest_name, contact, zip_code, signed_at
     FROM classpass_checkins
     WHERE date(signed_at) >= ? AND date(signed_at) <= ?
     ORDER BY signed_at ASC`,
    [from, to]
  );
}

// Returns vendor log rows within [from, to] (YYYY-MM-DD inclusive).
export async function getVendorsByDateRange(from, to) {
  const db = await getDb();
  return await db.select(
    `SELECT name, company, reason, time_in
     FROM vendor_log
     WHERE date(time_in) >= ? AND date(time_in) <= ?
     ORDER BY time_in ASC`,
    [from, to]
  );
}

// Returns all vendor_log rows where time_in is today (local time).
export async function getTodayVendors() {
  const db = await getDb();
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const datePrefix = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return await db.select(
    `SELECT id, name, company, reason, time_in
     FROM vendor_log
     WHERE time_in LIKE ?
     ORDER BY id DESC`,
    [`${datePrefix}%`]
  );
}
