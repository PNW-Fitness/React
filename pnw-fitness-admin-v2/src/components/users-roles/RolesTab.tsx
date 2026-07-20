import { useState, useEffect, useCallback } from "react";
import Checkbox from "../form/input/Checkbox";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { supabase } from "../../lib/supabaseClient";

interface Permission {
  id: string;
  key: string;
  label: string;
  group_name: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  role_permissions: { permission_id: string }[];
}

function groupBy(arr: Permission[], key: keyof Permission): Record<string, Permission[]> {
  return arr.reduce((acc: Record<string, Permission[]>, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export default function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showNewRole, setShowNewRole] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: r, error: e1 }, { data: p, error: e2 }] = await Promise.all([
      supabase
        .from("roles")
        .select("id, name, description, role_permissions(permission_id)")
        .order("name"),
      supabase.from("permissions").select("id, key, label, group_name").order("group_name, label"),
    ]);
    if (e1 || e2) setError((e1 || e2)!.message);
    else {
      setRoles(r ?? []);
      setPermissions(p ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePermission(roleId: string, permId: string, currentlyOn: boolean) {
    const key = `${roleId}:${permId}`;
    setToggling(key);
    setError("");
    let err;
    if (currentlyOn) {
      ({ error: err } = await supabase
        .from("role_permissions")
        .delete()
        .match({ role_id: roleId, permission_id: permId }));
    } else {
      ({ error: err } = await supabase.from("role_permissions").insert({ role_id: roleId, permission_id: permId }));
    }
    if (err) {
      setError(err.message);
    } else {
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id !== roleId) return r;
          const rps = r.role_permissions ?? [];
          return {
            ...r,
            role_permissions: currentlyOn
              ? rps.filter((rp) => rp.permission_id !== permId)
              : [...rps, { permission_id: permId }],
          };
        })
      );
    }
    setToggling(null);
  }

  async function handleDeleteRole(role: Role) {
    setError("");
    const { count } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role_id", role.id);
    if (count && count > 0) {
      setError(`Cannot delete "${role.name}" — ${count} user(s) assigned. Reassign them first.`);
      return;
    }
    const { error: err } = await supabase.from("roles").delete().eq("id", role.id);
    if (err) setError(err.message);
    else {
      setExpanded(null);
      await load();
    }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    const { error: err } = await supabase
      .from("roles")
      .insert({ name: newName.trim(), description: newDesc.trim() || null });
    if (err) setError(err.message);
    else {
      setNewName("");
      setNewDesc("");
      setShowNewRole(false);
      await load();
    }
    setCreating(false);
  }

  if (loading) return <p className="text-sm text-gray-400">Loading roles…</p>;

  const permsByGroup = groupBy(permissions, "group_name");

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg px-4 py-3 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
          {error}
        </p>
      )}

      {roles.map((role) => {
        const enabledIds = new Set((role.role_permissions ?? []).map((rp) => rp.permission_id));
        const isSuperAdmin = role.name === "Super Admin";
        const isOpen = expanded === role.id;

        return (
          <div
            key={role.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : role.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition"
            >
              <div>
                <p className="font-semibold text-gray-800 dark:text-white/90">{role.name}</p>
                {role.description && <p className="text-xs text-gray-400 mt-0.5">{role.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {enabledIds.size} / {permissions.length} permissions
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 dark:border-white/[0.05] px-5 py-4 space-y-5">
                {Object.entries(permsByGroup).map(([group, perms]) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group}</p>
                    <div className="space-y-2">
                      {perms.map((perm) => {
                        const on = enabledIds.has(perm.id);
                        const busy = toggling === `${role.id}:${perm.id}`;
                        return (
                          <div key={perm.id} className={isSuperAdmin ? "opacity-60 pointer-events-none" : ""}>
                            <Checkbox
                              label={perm.label}
                              checked={on}
                              disabled={isSuperAdmin || busy}
                              onChange={() => togglePermission(role.id, perm.id, on)}
                            />
                            {busy && <span className="text-xs text-gray-400 ml-8">Saving…</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {isSuperAdmin ? (
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
                    Super Admin role cannot be edited or deleted.
                  </p>
                ) : (
                  <div className="pt-3 border-t border-gray-100 dark:border-white/[0.05]">
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="text-xs text-error-500 hover:text-error-700 border border-error-200 dark:border-error-500/30 rounded-lg px-3 py-1.5 transition"
                    >
                      Delete role
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {showNewRole ? (
        <form
          onSubmit={handleCreateRole}
          className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] px-5 py-4 space-y-3"
        >
          <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">New role</p>
          <Input type="text" placeholder="Role name *" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={creating || !newName.trim()}>
              {creating ? "Creating…" : "Create role"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setShowNewRole(false);
                setNewName("");
                setNewDesc("");
              }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowNewRole(true)}
          className="w-full text-sm text-brand-600 hover:text-brand-800 dark:text-brand-400 border border-dashed border-brand-300 hover:border-brand-400 dark:border-brand-500/30 rounded-xl py-3 transition"
        >
          + Add new role
        </button>
      )}
    </div>
  );
}
