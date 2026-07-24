import { useState, useEffect, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { useModal } from "../../hooks/useModal";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";
import { usePermissions } from "../../lib/PermissionsContext";
import { Announcement, loadAnnouncements } from "../../lib/teamBoard";
import AnnouncementModal from "./AnnouncementModal";

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
  const modal = useModal();

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
  // pattern as GuestNotesPanel's author_name resolution.
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
    modal.openModal();
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    modal.openModal();
  }

  return (
    <div>
      <PageMeta title="Team Board | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Team Board" />

      {canPost && (
        <div className="flex justify-end mb-4">
          <button
            onClick={openNew}
            className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2.5 rounded-lg transition"
          >
            New Announcement
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading announcements…</p>
      ) : announcements.length === 0 ? (
        <p className="text-sm text-gray-400">No announcements yet.</p>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <ComponentCard
              key={a.id}
              title={a.pinned ? `📌 ${a.title}` : a.title}
              desc={`${a.posted_by_name || "Unknown"} · ${formatDate(a.created_at)}`}
            >
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{a.body}</p>
              {canPost && (
                <button
                  onClick={() => openEdit(a)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mt-2"
                >
                  Edit
                </button>
              )}
            </ComponentCard>
          ))}
        </div>
      )}

      {canPost && (
        <AnnouncementModal
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          announcement={editing}
          posterId={userId}
          posterName={myName}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
