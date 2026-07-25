import { supabase } from "./supabaseClient";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  posted_by: string | null;
  posted_by_name: string | null;
  pinned: boolean;
  created_at: string;
}

interface ActionError {
  message: string;
}

export async function loadAnnouncements(): Promise<Announcement[]> {
  const { data } = await supabase
    .from("team_announcements")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createAnnouncement(a: {
  title: string;
  body: string;
  pinned: boolean;
  posted_by: string | null;
  posted_by_name: string | null;
}): Promise<{ error: ActionError | null }> {
  const { error } = await supabase.from("team_announcements").insert(a);
  return { error };
}

export async function updateAnnouncement(
  id: string,
  patch: Partial<Pick<Announcement, "title" | "body" | "pinned">>
): Promise<{ error: ActionError | null }> {
  const { error } = await supabase.from("team_announcements").update(patch).eq("id", id);
  return { error };
}
