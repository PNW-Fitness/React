import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { pushSupported, subscribeToPush } from "../lib/push";

const DISMISSED_KEY = "pnw_push_prompt_dismissed";

export default function EnablePushBanner() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === "1");
  const [busy, setBusy] = useState(false);

  const shouldShow =
    !dismissed && userId && pushSupported() && Notification.permission === "default";

  if (!shouldShow) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  async function enable() {
    if (!userId) return;
    setBusy(true);
    await subscribeToPush(userId);
    setBusy(false);
    dismiss();
  }

  return (
    <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl bg-navy/5 border border-navy/10 px-4 py-3">
      <p className="text-sm text-navy">Turn on notifications for trades, time off, and team updates?</p>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={dismiss} className="text-xs font-medium text-navy/50 px-2 py-1">
          Not now
        </button>
        <button
          onClick={enable}
          disabled={busy}
          className="text-xs font-bold text-navy bg-gold rounded-lg px-3 py-1.5 disabled:opacity-50"
        >
          {busy ? "…" : "Enable"}
        </button>
      </div>
    </div>
  );
}
