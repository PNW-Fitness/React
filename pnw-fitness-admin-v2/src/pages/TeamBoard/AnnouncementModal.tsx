import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import { Announcement, createAnnouncement, updateAnnouncement } from "../../lib/teamBoard";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  posterId: string | null;
  posterName: string;
  onSaved: () => void;
}

export default function AnnouncementModal({
  isOpen,
  onClose,
  announcement,
  posterId,
  posterName,
  onSaved,
}: AnnouncementModalProps) {
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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <h3 className="font-bold text-gray-800 dark:text-white/90 mb-4">
        {announcement ? "Edit Announcement" : "New Announcement"}
      </h3>

      <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Holiday hours" />
        </div>

        <div>
          <Label>Body</Label>
          <TextArea rows={5} value={body} onChange={setBody} placeholder="What do you want the team to know?" />
        </div>

        <Checkbox label="Pin to top" checked={pinned} onChange={setPinned} />

        {error && (
          <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : announcement ? "Save Changes" : "Post Announcement"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2.5 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
