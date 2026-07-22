import { useState, useEffect, Fragment } from "react";
import { useSearchParams } from "react-router";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../ui/table";
import { supabase } from "../../lib/supabaseClient";
import { usePermissions } from "../../lib/PermissionsContext";
import { GuestBan, findActiveBan, findBanHistory, liftBan } from "../../lib/bans";

interface BannedLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

function formatDateTime(ts: string | null | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function BannedGuestsTable() {
  const { can } = usePermissions();
  const canManage = can("bans.manage");
  const [searchParams] = useSearchParams();
  const preselectGuestId = searchParams.get("guest");

  const [guests, setGuests] = useState<BannedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBans, setActiveBans] = useState<Record<string, GuestBan | null>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, GuestBan[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);
  const [lifting, setLifting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);

  useEffect(() => {
    async function resolveUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("admin_profiles")
        .select("display_name, email")
        .eq("user_id", user.id)
        .maybeSingle();
      setMyName(profile?.display_name || profile?.email || user.email || "Staff");
    }
    resolveUser();
  }, []);

  async function handleExpand(guest: BannedLead) {
    if (expanded === guest.id) {
      setExpanded(null);
      return;
    }
    setExpanded(guest.id);
    if (history[guest.id]) return;
    setHistoryLoading(guest.id);
    const rows = await findBanHistory(guest);
    setHistory((h) => ({ ...h, [guest.id]: rows }));
    setHistoryLoading(null);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("lead_submissions")
        .select("id, name, email, phone")
        .eq("ban_status", "banned")
        .order("name");
      const rows = data ?? [];
      setGuests(rows);

      const bansMap: Record<string, GuestBan | null> = {};
      await Promise.all(
        rows.map(async (g) => {
          bansMap[g.id] = await findActiveBan(g);
        })
      );
      setActiveBans(bansMap);
      setLoading(false);

      const preselected = rows.find((g) => g.id === preselectGuestId);
      if (preselected) handleExpand(preselected);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLift(guest: BannedLead) {
    setError(null);
    const ban = activeBans[guest.id];
    if (!ban) {
      setError("Couldn't find the ban record for this guest — try refreshing.");
      return;
    }
    setLifting(guest.id);
    const { error: err } = await liftBan(ban, guest, myName || "Staff");
    setLifting(null);
    if (err) setError(err.message);
    else setGuests((g) => g.filter((x) => x.id !== guest.id));
  }

  if (loading) return <p className="text-sm text-gray-400">Loading banned guests…</p>;

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg px-4 py-3 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Guest
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Contact
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Reason
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Applied By
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Date
                </TableCell>
                <TableCell isHeader className="px-4 py-3">{null}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {guests.map((guest) => {
                const ban = activeBans[guest.id];
                const isOpen = expanded === guest.id;
                return (
                  <Fragment key={guest.id}>
                    <TableRow>
                      <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        <button onClick={() => handleExpand(guest)} className="hover:underline text-left">
                          {guest.name}
                        </button>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                        {guest.phone || guest.email || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {ban?.reason || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {ban?.decided_by_name || ban?.requested_by_name || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDateTime(ban?.decided_at ?? ban?.requested_at)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-end whitespace-nowrap">
                        {canManage && (
                          <button
                            onClick={() => handleLift(guest)}
                            disabled={lifting === guest.id}
                            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 disabled:opacity-50"
                          >
                            {lifting === guest.id ? "…" : "Lift ban"}
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 bg-gray-50 dark:bg-white/[0.02]">
                          {historyLoading === guest.id ? (
                            <p className="text-xs text-gray-400">Loading history…</p>
                          ) : (history[guest.id] ?? []).length === 0 ? (
                            <p className="text-xs text-gray-400">No history found.</p>
                          ) : (
                            <div className="space-y-2">
                              {(history[guest.id] ?? []).map((h) => (
                                <div key={h.id} className="text-xs text-gray-600 dark:text-gray-300">
                                  <span className="font-semibold capitalize">{h.status}</span> — {h.reason}
                                  <span className="text-gray-400">
                                    {" "}
                                    · {h.requested_by_name} requested {formatDateTime(h.requested_at)}
                                    {h.decided_by_name && `, ${h.decided_by_name} decided ${formatDateTime(h.decided_at)}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {guests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    No banned guests.
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
