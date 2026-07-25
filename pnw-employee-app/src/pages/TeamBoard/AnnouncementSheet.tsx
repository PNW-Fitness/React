import { useState, useEffect } from "react";
import Sheet from "../../components/Sheet";
import { type Announcement, createAnnouncement, updateAnnouncement } from "../../lib/teamBoard";

interface AnnouncementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  posterId: string | null;
  posterName: string;
  onSaved: () => void;
}

export default function AnnouncementSheet({
  isOpen,
  onClose,
  announcement,
  posterId,
  posterName,
  onSaved,
}: AnnouncementSheetProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setTitle(announcement?.title ?? "");
    setBody(announcement?.body ?? "");
    setPinned(announcement?.pinned ?? false);
  }, [isOpen, announcement]);

  async function handleSave() {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are both required.");
      return;
    }
    setSaving(true);
    setError(null);

    const { error: err } = announcement
      ? await updateAnnouncement(announcement.id, { title: title.trim(), body: body.trim(), pinned })
      : await createAnnouncement({
          title: title.trim(),
          body: body.trim(),
          pinned,
          posted_by: posterId,
          posted_by_name: posterName,
        });

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <h3 className="font-bold text-navy mb-4">{announcement ? "Edit Announcement" : "New Announcement"}</h3>

      <p className="text-xs font-medium text-navy/50 mb-1.5">Title</p>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Holiday hours"
        className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy mb-4"
      />

      <p className="text-xs font-medium text-navy/50 mb-1.5">Body</p>
      <textarea
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What do you want the team to know?"
        className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy mb-4"
      />

      <label className="flex items-center gap-2 mb-4">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="w-4 h-4" />
        <span className="text-sm text-navy">Pin to top</span>
      </label>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 text-sm font-bold text-navy bg-gold px-4 py-2.5 rounded-xl disabled:opacity-50"
        >
          {saving ? "Saving…" : announcement ? "Save Changes" : "Post Announcement"}
        </button>
        <button onClick={onClose} className="text-sm text-navy/60 border border-navy/15 px-4 py-2.5 rounded-xl">
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
