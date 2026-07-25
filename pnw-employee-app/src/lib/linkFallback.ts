// Routes this app actually has — anything else (e.g. a Lead Manager's
// /leads/... link, out of scope here per the Phase 6 addendum) falls back
// to the home tab instead of a broken route. Shared between the in-app
// notification bell and the service worker's notificationclick handler,
// since both need to resolve the same push/notification payload link.
const KNOWN_PREFIXES = ["/schedule", "/marketplace", "/time-off", "/team-board", "/profile"];

export function resolveNotificationLink(link: string | null | undefined): string {
  if (link && KNOWN_PREFIXES.some((p) => link.startsWith(p))) return link;
  return "/schedule";
}
