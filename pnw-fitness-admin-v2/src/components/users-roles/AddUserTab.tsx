import { useState } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { supabase } from "../../lib/supabaseClient";
import { edgeFunctionErrorMessage } from "../../lib/edgeFunctionError";

type Mode = "invite" | "create";

export default function AddUserTab() {
  const [mode, setMode] = useState<Mode>("invite");

  // Invite link
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: string; text: string }>({ type: "", text: "" });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Direct create
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: string; text: string }>({ type: "", text: "" });

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteMsg({ type: "", text: "" });
    setInviteLink(null);
    setCopied(false);
    setInviting(true);

    const { data, error: fnErr } = await supabase.functions.invoke("invite-admin", {
      body: { email: inviteEmail.trim(), redirectTo: `${window.location.origin}/accept-invite` },
    });

    if (fnErr) {
      setInviteMsg({ type: "error", text: await edgeFunctionErrorMessage(fnErr) });
      setInviting(false);
      return;
    }

    setInviting(false);
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (parsed?.inviteLink) {
      setInviteLink(parsed.inviteLink);
      setInviteMsg({
        type: "success",
        text: `Access granted for ${inviteEmail.trim()}. Send them the link below to set their password, then assign them an RBAC role.`,
      });
    } else {
      setInviteMsg({
        type: "success",
        text: `Access granted for ${inviteEmail.trim()}. They already have an account and can sign in. Remember to assign them an RBAC role.`,
      });
    }
    setInviteEmail("");
  }

  async function handleCopyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateMsg({ type: "", text: "" });
    if (password.length < 6) {
      setCreateMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirmPw) {
      setCreateMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    setCreating(true);
    const { error: fnErr } = await supabase.functions.invoke("create-admin-user", {
      body: { username: username.trim(), password, role: "staff" },
    });
    setCreating(false);
    if (fnErr) {
      let msg = await edgeFunctionErrorMessage(fnErr);
      if (msg.toLowerCase().includes("failed to send") || msg.toLowerCase().includes("not found")) {
        msg = "Account creation service is not deployed yet. See the deployment instructions above.";
      }
      setCreateMsg({ type: "error", text: msg });
      return;
    }
    setCreateMsg({
      type: "success",
      text: `Account created for "${username.trim()}". They can sign in immediately — remember to assign them an RBAC role.`,
    });
    setUsername("");
    setPassword("");
    setConfirmPw("");
  }

  return (
    <div className="max-w-md">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-5 text-sm font-medium">
        <button
          type="button"
          onClick={() => {
            setMode("invite");
            setInviteMsg({ type: "", text: "" });
            setInviteLink(null);
            setCopied(false);
          }}
          className={`flex-1 py-2 transition ${
            mode === "invite" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
          }`}
        >
          Generate invite link
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("create");
            setCreateMsg({ type: "", text: "" });
          }}
          className={`flex-1 py-2 transition ${
            mode === "create" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
          }`}
        >
          Set username &amp; password
        </button>
      </div>

      {/* Invite link form */}
      {mode === "invite" && (
        <form onSubmit={handleInvite} className="space-y-3">
          <p className="text-xs text-gray-400 mb-2">
            Generates a one-time link you can send to the user to set their password. Assign their RBAC role after
            they accept.
          </p>
          <Input
            type="email"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          {inviteMsg.text && (
            <p
              className={`text-sm px-3 py-2 rounded border ${
                inviteMsg.type === "error"
                  ? "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400"
                  : "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-400"
              }`}
            >
              {inviteMsg.text}
            </p>
          )}

          {inviteLink && (
            <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 break-all font-mono">{inviteLink}</p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-medium px-3 py-1.5 rounded transition"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}

          <Button size="sm" disabled={inviting}>
            {inviting ? "Generating…" : "Generate invite link"}
          </Button>
        </form>
      )}

      {/* Direct create form */}
      {mode === "create" && (
        <form onSubmit={handleCreate} className="space-y-3">
          <p className="text-xs text-gray-400 mb-2">
            Creates an account immediately with a username and password — no email address needed. Assign their RBAC
            role after creating.
          </p>
          <div>
            <Label>Username</Label>
            <Input
              type="text"
              placeholder="e.g. frontdesk or john"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
            />
            <p className="text-xs text-gray-400 mt-1">No @ needed. They'll sign in with this username.</p>
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Confirm password</Label>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          {createMsg.text && (
            <p
              className={`text-sm px-3 py-2 rounded border ${
                createMsg.type === "error"
                  ? "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400"
                  : "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-400"
              }`}
            >
              {createMsg.text}
            </p>
          )}

          <Button size="sm" disabled={creating}>
            {creating ? "Creating…" : "Create account"}
          </Button>
        </form>
      )}
    </div>
  );
}
