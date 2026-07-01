import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

// Live queue of guest/classpass check-ins submitted from a guest's phone and
// awaiting staff ID verification. Realtime (not polling) keeps this in sync;
// filtering on eventType/status happens client-side rather than via a
// server-side channel filter so that an UPDATE which moves a row *out* of
// 'awaiting_id' (i.e. our own completion) is still delivered and removes it
// from any other tablet that might have the queue open.
export function usePendingCheckinsQueue() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    let channel;
    let cancelled = false;

    async function init() {
      const { data, error } = await supabase
        .from("pending_checkins")
        .select("*")
        .eq("status", "awaiting_id")
        .order("submitted_at", { ascending: true });
      if (!cancelled && !error) setQueue(data || []);

      // Unique per mount: React StrictMode's dev-mode double-invoke
      // (mount -> cleanup -> mount) can otherwise race the async
      // removeChannel() cleanup against a second .channel() call reusing
      // the same topic name, which throws "cannot add postgres_changes
      // callbacks ... after subscribe()".
      channel = supabase
        .channel(`pending_checkins_queue-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "pending_checkins" },
          (payload) => {
            setQueue((prev) => {
              if (payload.eventType === "INSERT") {
                if (payload.new.status !== "awaiting_id") return prev;
                if (prev.some((r) => r.id === payload.new.id)) return prev;
                return [...prev, payload.new].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));
              }
              if (payload.eventType === "UPDATE") {
                if (payload.new.status !== "awaiting_id") {
                  return prev.filter((r) => r.id !== payload.new.id);
                }
                return prev.map((r) => (r.id === payload.new.id ? payload.new : r));
              }
              if (payload.eventType === "DELETE") {
                return prev.filter((r) => r.id !== payload.old.id);
              }
              return prev;
            });
          }
        )
        .subscribe();
    }

    init();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Removes an entry from local state immediately after our own client
  // completes it, rather than waiting on the realtime echo of our own
  // UPDATE to round-trip back — that echo still arrives and is a harmless
  // no-op, but without this a just-finalized entry would briefly linger in
  // the list the same client is looking at.
  function removeLocally(id) {
    setQueue((prev) => prev.filter((r) => r.id !== id));
  }

  return { queue, removeLocally };
}
