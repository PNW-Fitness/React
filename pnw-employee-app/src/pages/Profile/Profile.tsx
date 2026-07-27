import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";
import { pushSupported, subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "../../lib/push";

export default function Profile() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const userId = session?.user?.id;
  const currentEmail = session?.user?.email ?? "";

  const [fullName, setFullName] = useState("");
  const [fullNameSaved, setFullNameSaved] = useState(false);
  const [fullNameSaving, setFullNameSaving] = useState(false);
  const [fullNameError, setFullNameError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [notifState, setNotifState] = useState<"checking" | "on" | "off" | "unsupported">("checking");

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("admin_profiles")
      .select("display_name, phone_number")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.display_name ?? "");
        setPhone(data?.phone_number ?? "");
      });
  }, [userId]);

  useEffect(() => {
    if (!pushSupported()) {
      setNotifState("unsupported");
      return;
    }
    isPushSubscribed().then((subscribed) => setNotifState(subscribed ? "on" : "off"));
  }, []);

  async function handleSaveFullName() {
    if (!userId) return;
    setFullNameSaving(true);
    setFullNameError(null);
    setFullNameSaved(false);
    const { error } = await supabase.from("admin_profiles").update({ display_name: fullName.trim() || null }).eq("user_id", userId);
    setFullNameSaving(false);
    if (error) setFullNameError(error.message);
    else setFullNameSaved(true);
  }

  async function handleSavePhone() {
    if (!userId) return;
    setPhoneSaving(true);
    setPhoneError(null);
    setPhoneSaved(false);
    const { error } = await supabase.from("admin_profiles").update({ phone_number: phone.trim() || null }).eq("user_id", userId);
    setPhoneSaving(false);
    if (error) setPhoneError(error.message);
    else setPhoneSaved(true);
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordMessage(null);
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPasswordMessage("Password updated.");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleToggleNotifications() {
    if (!userId) return;
    if (notifState === "on") {
      await unsubscribeFromPush();
      setNotifState("off");
    } else {
      const result = await subscribeToPush(userId);
      if (result === "granted") setNotifState("on");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl border border-navy/10 p-4">
        <p className="text-sm font-bold text-navy mb-3">Full Name</p>
        <input
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setFullNameSaved(false);
          }}
          placeholder="e.g. Jane Smith"
          className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy mb-2"
        />
        <button
          onClick={handleSaveFullName}
          disabled={fullNameSaving}
          className="text-sm font-bold text-navy bg-gold px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {fullNameSaving ? "Saving…" : "Save"}
        </button>
        {fullNameSaved && <p className="text-sm text-emerald-700 mt-2">Saved.</p>}
        {fullNameError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{fullNameError}</p>}
        <p className="text-xs text-navy/40 mt-2">Shown to coworkers and managers instead of your username.</p>
      </div>

      <div className="bg-white rounded-xl border border-navy/10 p-4">
        <p className="text-sm font-bold text-navy mb-1">Username</p>
        <p className="text-sm text-navy/60">{currentEmail}</p>
        <p className="text-xs text-navy/40 mt-1">Set by your manager — contact them to change it.</p>
      </div>

      <div className="bg-white rounded-xl border border-navy/10 p-4">
        <p className="text-sm font-bold text-navy mb-3">Phone</p>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setPhoneSaved(false);
          }}
          placeholder="(555) 555-5555"
          className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy mb-2"
        />
        <button
          onClick={handleSavePhone}
          disabled={phoneSaving}
          className="text-sm font-bold text-navy bg-gold px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {phoneSaving ? "Saving…" : "Save"}
        </button>
        {phoneSaved && <p className="text-sm text-emerald-700 mt-2">Saved.</p>}
        {phoneError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{phoneError}</p>}
      </div>

      <div className="bg-white rounded-xl border border-navy/10 p-4">
        <p className="text-sm font-bold text-navy mb-3">Change Password</p>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy mb-2"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy mb-2"
        />
        <button
          onClick={handleChangePassword}
          disabled={passwordSaving || !newPassword}
          className="text-sm font-bold text-navy bg-gold px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {passwordSaving ? "Saving…" : "Update Password"}
        </button>
        {passwordMessage && <p className="text-sm text-emerald-700 mt-2">{passwordMessage}</p>}
        {passwordError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{passwordError}</p>}
      </div>

      <div className="bg-white rounded-xl border border-navy/10 p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-navy">Notifications</p>
          <p className="text-xs text-navy/50">
            {notifState === "unsupported"
              ? "Not supported on this browser."
              : notifState === "on"
                ? "Enabled on this device."
                : "Off — trades, time off, and team updates won't push."}
          </p>
        </div>
        {notifState !== "unsupported" && notifState !== "checking" && (
          <button
            onClick={handleToggleNotifications}
            className={`text-xs font-bold px-3 py-2 rounded-lg shrink-0 ${notifState === "on" ? "text-navy/60 border border-navy/15" : "text-navy bg-gold"}`}
          >
            {notifState === "on" ? "Disable" : "Enable"}
          </button>
        )}
      </div>

      <button onClick={handleSignOut} className="w-full text-sm font-medium text-navy/60 border border-navy/15 px-4 py-2.5 rounded-xl">
        Sign Out
      </button>
    </div>
  );
}
