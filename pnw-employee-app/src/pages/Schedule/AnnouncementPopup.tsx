import { useState, useEffect } from "react";
import Sheet from "../../components/Sheet";
import { type Announcement, loadAnnouncements } from "../../lib/teamBoard";

function storageKey(userId: string) {
  return `pnw_last_seen_announcement_${userId}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface AnnouncementPopupProps {
  userId: string | null;
}

// Surfaces Team Board announcements the employee hasn't seen yet, right when
// they land on Schedule after logging in — so something like updated
// holiday hours doesn't get missed just because nobody thought to check
// Team Board that day. "Seen" is tracked per-device (not synced anywhere),
// which is fine here: worst case someone re-sees an announcement on a new
// device, never worse than that.
export default function AnnouncementPopup({ userId }: AnnouncementPopupProps) {
  const [unseen, setUnseen] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadAnnouncements().then((announcements) => {
      if (announcements.length === 0) return;
      const newest = announcements.reduce((max, a) => (a.created_at > max ? a.created_at : max), announcements[0].created_at);
      const lastSeen = localStorage.getItem(storageKey(userId));

      if (!lastSeen) {
        // First time this device has ever checked — start tracking from now
        // rather than dumping the team's entire announcement history on a
        // brand-new employee's first login.
        localStorage.setItem(storageKey(userId), newest);
        return;
      }

      const fresh = announcements.filter((a) => a.created_at > lastSeen).sort((a, b) => (a.pinned === b.pinned ? b.created_at.localeCompare(a.created_at) : a.pinned ? -1 : 1));
      if (fresh.length > 0) {
        setUnseen(fresh);
        setOpen(true);
      }
    });
  }, [userId]);

  function handleClose() {
    if (userId && unseen.length > 0) {
      const newest = unseen.reduce((max, a) => (a.created_at > max ? a.created_at : max), unseen[0].created_at);
      localStorage.setItem(storageKey(userId), newest);
    }
    setOpen(false);
  }

  if (unseen.length === 0) return null;

  return (
    <Sheet isOpen={open} onClose={handleClose}>
      <h3 className="font-bold text-navy mb-1">
        {unseen.length === 1 ? "New Announcement" : `${unseen.length} New Announcements`}
      </h3>
      <p className="text-sm text-navy/50 mb-4">From Team Board</p>

      <div className="space-y-3 mb-4">
        {unseen.map((a) => (
          <div key={a.id} className="bg-navy/5 rounded-xl p-3">
            <p className="text-sm font-bold text-navy">{a.pinned ? `📌 ${a.title}` : a.title}</p>
            <p className="text-xs text-navy/40 mb-1.5">
              {a.posted_by_name || "Unknown"} · {formatDate(a.created_at)}
            </p>
            <p className="text-sm text-navy whitespace-pre-wrap">{a.body}</p>
          </div>
        ))}
      </div>

      <button onClick={handleClose} className="w-full text-sm font-bold text-navy bg-gold px-4 py-2.5 rounded-xl">
        Got it
      </button>
    </Sheet>
  );
}
