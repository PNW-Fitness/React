import { useState, useEffect, useCallback } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../ui/table";
import Badge from "../ui/badge/Badge";
import Select from "../form/Select";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { supabase } from "../../lib/supabaseClient";
import { edgeFunctionErrorMessage } from "../../lib/edgeFunctionError";
import { STAFF_COLOR_PALETTE, updateStaffColor } from "../../lib/scheduling";

interface RbacRole {
  id: string;
  name: string;
}

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string;
  schedule_color: string | null;
  userRole: { user_id: string; role_id: string; roles: RbacRole | null } | null;
}

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rbacRoles, setRbacRoles] = useState<RbacRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [saving, setSaving] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });

  // Set-password modal
  const [pwTarget, setPwTarget] = useState<AdminUser | null>(null);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const [
      { data: profiles, error: e1 },
      { data: userRolesList, error: e2 },
      { data: roleList, error: e3 },
    ] = await Promise.all([
      supabase
        .from("admin_profiles")
        .select("user_id, email, display_name, role, is_active, created_at, schedule_color")
        .order("created_at"),
      supabase.from("user_roles").select("user_id, role_id, roles(id, name)"),
      supabase.from("roles").select("id, name").order("name"),
    ]);

    if (e1 || e2 || e3) {
      setError((e1 || e2 || e3)!.message);
    } else {
      const urMap = Object.fromEntries((userRolesList ?? []).map((ur) => [ur.user_id, ur]));
      setUsers((profiles ?? []).map((p) => ({ ...p, userRole: urMap[p.user_id] ?? null })));
      setRbacRoles(roleList ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function countSuperAdmins() {
    const sa = rbacRoles.find((r) => r.name === "Super Admin");
    if (!sa) return 0;
    const { count } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role_id", sa.id);
    return count ?? 0;
  }

  async function handleRbacChange(user: AdminUser, newRoleId: string) {
    setError("");
    const sa = rbacRoles.find((r) => r.name === "Super Admin");
    const currentRoleId = user.userRole?.role_id;

    if (sa && currentRoleId === sa.id && newRoleId !== sa.id) {
      if ((await countSuperAdmins()) <= 1) {
        setError("Cannot demote the last Super Admin. Assign another Super Admin first.");
        return;
      }
    }

    setSaving(user.user_id);
    let err;
    if (!newRoleId) {
      ({ error: err } = await supabase.from("user_roles").delete().eq("user_id", user.user_id));
    } else {
      ({ error: err } = await supabase
        .from("user_roles")
        .upsert({ user_id: user.user_id, role_id: newRoleId }, { onConflict: "user_id" }));
    }
    if (err) setError(err.message);
    else await load();
    setSaving(null);
  }

  async function handleToggleActive(user: AdminUser) {
    setError("");
    const sa = rbacRoles.find((r) => r.name === "Super Admin");
    if (user.is_active && sa && user.userRole?.role_id === sa.id) {
      if ((await countSuperAdmins()) <= 1) {
        setError("Cannot deactivate the last Super Admin.");
        return;
      }
    }
    setSaving(user.user_id);
    const { error: err } = await supabase
      .from("admin_profiles")
      .update({ is_active: !user.is_active })
      .eq("user_id", user.user_id);
    if (err) setError(err.message);
    else await load();
    setSaving(null);
  }

  async function handleColorChange(user: AdminUser, color: string) {
    setSaving(user.user_id);
    const { error: err } = await updateStaffColor(user.user_id, color);
    if (err) setError(err.message);
    else setUsers((u) => u.map((x) => (x.user_id === user.user_id ? { ...x, schedule_color: color } : x)));
    setSaving(null);
  }

  async function handleEmailReset(user: AdminUser) {
    setResetMessage({ type: "", text: "" });
    setResetTarget(user.user_id);
    const { error: err } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetTarget(null);
    if (err) {
      setResetMessage({ type: "error", text: `Failed to send reset email: ${err.message}` });
    } else {
      setResetMessage({ type: "success", text: `Password reset email sent to ${user.email}.` });
    }
  }

  function openSetPw(user: AdminUser) {
    setPwTarget(user);
    setNewPw("");
    setConfirmPw("");
    setPwError("");
    setPwSuccess("");
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (newPw.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwLoading(true);
    const { error: fnErr } = await supabase.functions.invoke("set-user-password", {
      body: { userId: pwTarget!.user_id, password: newPw },
    });
    setPwLoading(false);

    if (fnErr) {
      setPwError(await edgeFunctionErrorMessage(fnErr));
      return;
    }
    setPwSuccess(`Password updated for ${pwTarget!.email}.`);
    setNewPw("");
    setConfirmPw("");
  }

  async function handleRemove(user: AdminUser) {
    if (
      !window.confirm(
        `Remove ${user.email} from the admin panel?\n\nThis deletes their profile but does NOT delete their Supabase auth account.`
      )
    )
      return;
    setError("");
    const { error: e1 } = await supabase.from("staff_admins").delete().eq("user_id", user.user_id);
    if (e1) {
      setError(e1.message);
      return;
    }
    const { error: e2 } = await supabase.from("admin_profiles").delete().eq("user_id", user.user_id);
    if (e2) {
      setError(e2.message);
      return;
    }
    setUsers((u) => u.filter((x) => x.user_id !== user.user_id));
  }

  if (loading) return <p className="text-sm text-gray-400">Loading users…</p>;

  const roleOptions = rbacRoles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg px-4 py-3 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
          {error}
        </p>
      )}
      {resetMessage.text && (
        <p
          className={`mb-4 text-sm px-4 py-3 rounded-lg border ${
            resetMessage.type === "error"
              ? "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400"
              : "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-400"
          }`}
        >
          {resetMessage.text}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  User
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Role
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Schedule Color
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {users.map((user) => {
                const isSelf = user.user_id === currentUserId;
                const isBusy = saving === user.user_id;
                const rbacRole = user.userRole?.roles;

                return (
                  <TableRow key={user.user_id} className={!user.is_active ? "opacity-50" : ""}>
                    <TableCell className="px-4 py-3 text-start">
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {user.display_name || "—"}
                        {isSelf && (
                          <span className="ml-2 text-xs bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 font-semibold px-2 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-start">
                      <Select
                        key={`${user.user_id}:${rbacRole?.id ?? ""}`}
                        options={roleOptions}
                        placeholder="— none —"
                        defaultValue={rbacRole?.id ?? ""}
                        onChange={(value) => handleRbacChange(user, value)}
                        className={isBusy ? "opacity-50 pointer-events-none" : ""}
                      />
                    </TableCell>

                    <TableCell className="px-4 py-3 text-start">
                      <Badge size="sm" color={user.is_active ? "success" : "light"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-[150px]">
                        {STAFF_COLOR_PALETTE.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleColorChange(user, c)}
                            disabled={isBusy}
                            title={c}
                            className={`w-5 h-5 rounded-full transition ${
                              user.schedule_color === c
                                ? "ring-2 ring-offset-1 ring-gray-800 dark:ring-white dark:ring-offset-gray-900"
                                : "hover:scale-110"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-3 flex-wrap text-xs">
                        <button
                          onClick={() => openSetPw(user)}
                          className="text-success-600 hover:text-success-800 hover:underline"
                        >
                          Set password
                        </button>
                        <button
                          onClick={() => handleEmailReset(user)}
                          disabled={resetTarget === user.user_id}
                          className="text-brand-500 hover:text-brand-700 hover:underline disabled:opacity-40"
                        >
                          {resetTarget === user.user_id ? "Sending…" : "Email reset"}
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={isBusy}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 transition disabled:opacity-50"
                          >
                            {isBusy ? "…" : user.is_active ? "Deactivate" : "Reactivate"}
                          </button>
                        )}
                        {isSelf ? (
                          <span className="text-gray-300 dark:text-gray-600">Can't remove yourself</span>
                        ) : (
                          <button
                            onClick={() => handleRemove(user)}
                            className="text-error-500 hover:text-error-700 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No users yet.
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Set password modal */}
      <Modal isOpen={!!pwTarget} onClose={() => setPwTarget(null)} className="max-w-sm p-6">
        {pwTarget && (
          <>
            <h3 className="font-bold text-gray-800 dark:text-white/90 mb-1">Set password</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Set a new password for{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">{pwTarget.email}</span>.
            </p>
            <form onSubmit={handleSetPassword} className="space-y-3">
              <div>
                <Label>New password</Label>
                <Input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <Label>Confirm password</Label>
                <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
              </div>
              {pwError && (
                <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
                  {pwError}
                </p>
              )}
              {pwSuccess && (
                <p className="text-sm text-success-700 bg-success-50 border border-success-200 rounded px-3 py-2 dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-400">
                  {pwSuccess}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 justify-center" disabled={pwLoading}>
                  {pwLoading ? "Saving…" : "Set password"}
                </Button>
                <button
                  type="button"
                  onClick={() => setPwTarget(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium py-3 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
