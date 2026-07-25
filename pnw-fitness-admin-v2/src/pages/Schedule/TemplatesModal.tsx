import { useState, useEffect, useCallback } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Shift, mondayOfWeek, addDaysToDate } from "../../lib/scheduling";
import {
  ScheduleTemplate,
  loadTemplates,
  loadTemplateShifts,
  saveWeekAsTemplate,
  deleteTemplate,
  applyTemplateToWeek,
} from "../../lib/scheduleTemplates";

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allShifts: Shift[];
  currentUserId: string | null;
  onApplied: () => void;
}

export default function TemplatesModal({ isOpen, onClose, allShifts, currentUserId, onApplied }: TemplatesModalProps) {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [saveWeekStart, setSaveWeekStart] = useState(mondayOfWeek(new Date()));
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<string | null>(null);

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyWeekStart, setApplyWeekStart] = useState(mondayOfWeek(new Date()));
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setTemplates(await loadTemplates());
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setSaveWeekStart(mondayOfWeek(new Date()));
    setApplyWeekStart(mondayOfWeek(new Date()));
    setTemplateName("");
    setSaveError(null);
    setSaveResult(null);
    setApplyingId(null);
    setApplyError(null);
    setApplyResult(null);
    async function init() {
      setLoading(true);
      await refresh();
      setLoading(false);
    }
    init();
  }, [isOpen, refresh]);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysToDate(saveWeekStart, i));
  const shiftsInSaveWeek = allShifts.filter((s) => weekDates.includes(s.shift_date));

  async function handleSaveTemplate() {
    if (!templateName.trim()) {
      setSaveError("Give the template a name.");
      return;
    }
    if (shiftsInSaveWeek.length === 0) {
      setSaveError("That week has no shifts to save.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const { error } = await saveWeekAsTemplate(templateName.trim(), shiftsInSaveWeek, currentUserId);
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    setSaveResult(`Saved "${templateName.trim()}" with ${shiftsInSaveWeek.length} shifts.`);
    setTemplateName("");
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteTemplate(id);
    refresh();
  }

  async function handleApply(template: ScheduleTemplate) {
    setApplying(true);
    setApplyError(null);
    setApplyResult(null);
    const templateShifts = await loadTemplateShifts(template.id);
    const { error, count, skipped } = await applyTemplateToWeek(templateShifts, applyWeekStart, allShifts, currentUserId);
    setApplying(false);
    if (error) {
      setApplyError(error.message);
      return;
    }
    setApplyResult(
      `Created ${count} draft shift${count === 1 ? "" : "s"} from "${template.name}".` +
        (skipped > 0 ? ` ${skipped} already existed and were skipped.` : "")
    );
    onApplied();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6">
      <h3 className="font-bold text-gray-800 dark:text-white/90 mb-4">Schedule Templates</h3>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-5">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Save a week as a template</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <Label>Week starting (Monday)</Label>
            <input
              type="date"
              value={saveWeekStart}
              onChange={(e) => setSaveWeekStart(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
            />
          </div>
          <div>
            <Label>Template name</Label>
            <Input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Standard Summer Week" />
          </div>
          <Button size="sm" onClick={handleSaveTemplate} disabled={saving}>
            {saving ? "Saving…" : `Save (${shiftsInSaveWeek.length} shifts)`}
          </Button>
        </div>
        {saveError && <p className="text-sm text-error-600 dark:text-error-400 mt-2">{saveError}</p>}
        {saveResult && <p className="text-sm text-success-700 dark:text-success-400 mt-2">{saveResult}</p>}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Saved templates</p>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-gray-400">No templates saved yet.</p>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-lg bg-gray-50 dark:bg-white/[0.03] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setApplyingId(applyingId === t.id ? null : t.id);
                        setApplyError(null);
                        setApplyResult(null);
                      }}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      {applyingId === t.id ? "Cancel" : "Apply to a week"}
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-xs text-error-500 hover:text-error-600">
                      Delete
                    </button>
                  </div>
                </div>
                {applyingId === t.id && (
                  <div className="flex items-end gap-3 mt-3">
                    <div>
                      <Label>Apply to week starting (Monday)</Label>
                      <input
                        type="date"
                        value={applyWeekStart}
                        onChange={(e) => setApplyWeekStart(e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
                      />
                    </div>
                    <Button size="sm" onClick={() => handleApply(t)} disabled={applying}>
                      {applying ? "Applying…" : "Apply as Drafts"}
                    </Button>
                  </div>
                )}
                {applyingId === t.id && applyError && <p className="text-sm text-error-600 dark:text-error-400 mt-2">{applyError}</p>}
                {applyingId === t.id && applyResult && (
                  <p className="text-sm text-success-700 dark:text-success-400 mt-2">{applyResult}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-5">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2.5 rounded-lg transition"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
