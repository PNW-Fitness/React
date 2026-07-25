import { supabase } from "./supabaseClient";
import { addDaysToDate, createShiftsBulk } from "./scheduling";

export interface ScheduleTemplate {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export interface TemplateShift {
  id: string;
  template_id: string;
  day_of_week: number;
  role_label: string;
  start_time: string;
  end_time: string;
  assigned_to: string | null;
}

interface ActionError {
  message: string;
}

export async function loadTemplates(): Promise<ScheduleTemplate[]> {
  const { data } = await supabase.from("schedule_templates").select("*").order("name");
  return data ?? [];
}

export async function loadTemplateShifts(templateId: string): Promise<TemplateShift[]> {
  const { data } = await supabase.from("schedule_template_shifts").select("*").eq("template_id", templateId);
  return data ?? [];
}

// Captures every shift in [weekStart, weekStart+6] into a new named
// template, keyed by day-of-week so it can be replayed onto any future week.
export async function saveWeekAsTemplate(
  name: string,
  shiftsInWeek: { shift_date: string; role_label: string; start_time: string; end_time: string; assigned_to: string | null }[],
  createdBy: string | null
): Promise<{ error: ActionError | null }> {
  const { data: template, error: templateErr } = await supabase
    .from("schedule_templates")
    .insert({ name, created_by: createdBy })
    .select()
    .single();
  if (templateErr || !template) return { error: templateErr ?? { message: "Failed to create template." } };

  if (shiftsInWeek.length === 0) return { error: null };

  const rows = shiftsInWeek.map((s) => ({
    template_id: template.id,
    day_of_week: new Date(`${s.shift_date}T00:00:00`).getDay(),
    role_label: s.role_label,
    start_time: s.start_time,
    end_time: s.end_time,
    assigned_to: s.assigned_to,
  }));

  const { error: shiftsErr } = await supabase.from("schedule_template_shifts").insert(rows);
  return { error: shiftsErr };
}

export async function deleteTemplate(id: string): Promise<{ error: ActionError | null }> {
  const { error } = await supabase.from("schedule_templates").delete().eq("id", id);
  return { error };
}

// Applies a template to a target Monday-anchored week, creating draft
// shifts. Skips any (date, start_time, end_time) that already exists —
// same dedup pattern as Bulk Schedule.
export async function applyTemplateToWeek(
  templateShifts: TemplateShift[],
  weekStart: string,
  existingShifts: { shift_date: string; start_time: string; end_time: string }[],
  createdBy: string | null
): Promise<{ error: ActionError | null; count: number; skipped: number }> {
  const existingKeys = new Set(
    existingShifts.map((s) => `${s.shift_date}|${s.start_time.slice(0, 5)}|${s.end_time.slice(0, 5)}`)
  );
  const rows: {
    role_label: string;
    assigned_to: string | null;
    shift_date: string;
    start_time: string;
    end_time: string;
    created_by: string | null;
  }[] = [];
  let skipped = 0;

  templateShifts.forEach((ts) => {
    // weekStart is the Monday (day_of_week 1); Sunday (0) lands 6 days later.
    const offset = ts.day_of_week === 0 ? 6 : ts.day_of_week - 1;
    const date = addDaysToDate(weekStart, offset);
    const key = `${date}|${ts.start_time.slice(0, 5)}|${ts.end_time.slice(0, 5)}`;
    if (existingKeys.has(key)) {
      skipped++;
      return;
    }
    rows.push({
      role_label: ts.role_label,
      assigned_to: ts.assigned_to,
      shift_date: date,
      start_time: ts.start_time,
      end_time: ts.end_time,
      created_by: createdBy,
    });
  });

  const { error, count } = await createShiftsBulk(rows);
  return { error, count, skipped };
}
