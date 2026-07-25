import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";
import { usePermissions } from "../../lib/PermissionsContext";
import { type Announcement, loadAnnouncements } from "../../lib/teamBoard";
import AnnouncementSheet from "./AnnouncementSheet";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TeamBoard() {
  const { session } = useAuth();
  const { can } = usePermissions();
  const canPost = can("team_board.post");
  const userId = session?.user?.id ?? null;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [myName, setMyName] = useState("Staff");
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const refresh = useCallback(async () => {
    setAnnouncements(await loadAnnouncements());
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await refresh();
      setLoading(false);
    }
    init();
  }, [refresh]);

  // Resolve the current user's display name for post authorship — same
  // pattern as the admin dashboard's TeamBoard.
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

  function openNew() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setSheetOpen(true);
  }

  return (
    <div className="p-4">
      {canPost && (
        <button
          onClick={openNew}
          className="w-full text-sm font-bold text-navy bg-gold px-4 py-2.5 rounded-xl mb-4"
        >
          New Announcement
        </button>
      )}

      {loading ? (
        <p className="text-sm text-navy/40">Loading announcements…</p>
      ) : announcements.length === 0 ? (
        <p className="text-sm text-navy/40">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-navy/10 p-4">
              <p className="text-sm font-bold text-navy">{a.pinned ? `📌 ${a.title}` : a.title}</p>
              <p className="text-xs text-navy/40 mb-2">
                {a.posted_by_name || "Unknown"} · {formatDate(a.created_at)}
              </p>
              <p className="text-sm text-navy whitespace-pre-wrap">{a.body}</p>
              {canPost && (
                <button onClick={() => openEdit(a)} className="text-xs text-navy/40 mt-2">
                  Edit
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canPost && (
        <AnnouncementSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          announcement={editing}
          posterId={userId}
          posterName={myName}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
