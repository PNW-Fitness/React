import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { resolveNotificationLink } from "../lib/linkFallback";
import { BellIcon } from "./icons";

interface Notification {
  id: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const userId = session?.user?.id;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const unread = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("notifications")
      .select("id, message, link, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setItems(data ?? []));

    const channel = supabase
      .channel(`emp_notifications_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => setItems((prev) => [payload.new as Notification, ...prev])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0 && userId) {
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    }
  }

  function handleClick(n: Notification) {
    setOpen(false);
    navigate(resolveNotificationLink(n.link));
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-10 h-10 rounded-full text-white/90 active:bg-white/10"
      >
        <BellIcon className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-gold" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-80 max-w-[85vw] max-h-[70vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-black/5">
            <p className="px-4 py-3 text-sm font-semibold text-navy border-b border-black/5">Notifications</p>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center text-navy/40">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`block w-full text-left px-4 py-3 border-b border-black/5 last:border-0 ${n.is_read ? "" : "bg-gold/10"}`}
                >
                  <p className="text-sm text-navy">{n.message}</p>
                  <p className="text-xs text-navy/40 mt-0.5">{timeAgo(n.created_at)}</p>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
