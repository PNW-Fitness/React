import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import Button from "../components/ui/button/Button";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

export default function UserProfiles() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const currentEmail = session?.user?.email ?? "";

  const [phone, setPhone] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("admin_profiles")
      .select("phone_number")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => setPhone(data?.phone_number ?? ""));
  }, [userId]);

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

  return (
    <>
      <PageMeta title="Profile | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Profile" />

      <div className="space-y-6">
        <ComponentCard title="Username">
          <p className="text-sm text-gray-600 dark:text-gray-300">{currentEmail}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Employees' usernames are assigned by an admin and can't be changed from here.
          </p>
        </ComponentCard>

        <ComponentCard title="Phone">
          <div>
            <Label>Phone number</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneSaved(false);
              }}
              placeholder="(555) 555-5555"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSavePhone} disabled={phoneSaving}>
              {phoneSaving ? "Saving…" : "Save"}
            </Button>
            {phoneSaved && <span className="text-sm text-success-600 dark:text-success-400">Saved.</span>}
          </div>
          {phoneError && (
            <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
              {phoneError}
            </p>
          )}
        </ComponentCard>

        <ComponentCard title="Change Password">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleChangePassword} disabled={passwordSaving || !newPassword}>
              {passwordSaving ? "Saving…" : "Update Password"}
            </Button>
          </div>
          {passwordMessage && <p className="text-sm text-success-600 dark:text-success-400">{passwordMessage}</p>}
          {passwordError && (
            <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
              {passwordError}
            </p>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
