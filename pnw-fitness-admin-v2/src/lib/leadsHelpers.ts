export interface LeadDetails {
  visit_reason?: string;
  interests?: string;
  how_heard?: string;
  zip_code?: string;
  plan?: string;
  date?: string;
  time?: string;
  group?: string;
  notes?: string;
  type?: string;
  contact_method?: string;
  membership_status?: string;
  goals?: string;
  fitness_level?: string;
  availability?: string;
  medical_notes?: string;
  mailing_address?: string;
  course?: string;
  questions?: string;
  [key: string]: string | undefined;
}

export interface Lead {
  id: string;
  source: string;
  name: string;
  email: string | null;
  phone: string | null;
  details: LeadDetails | null;
  status: string;
  assigned_to: string | null;
  visit_count: number;
  first_seen: string | null;
  last_seen: string | null;
  is_test: boolean;
  created_at: string;
  lead_notes?: { id: string }[];
}

export const SOURCE_COLORS: Record<string, string> = {
  join: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  tour: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  booking: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400",
  training_assessment: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  nasm_partnership: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  checkin_app: "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400",
  classpass: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
};

export const STATUS_OPTIONS = ["new", "contacted", "converted", "not_interested", "closed"] as const;

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  not_interested: "Not interested",
  closed: "Closed",
};

export function statusCls(status: string) {
  if (status === "new") return "bg-blue-light-50 text-blue-light-700 border-blue-light-200 dark:bg-blue-light-500/15 dark:text-blue-light-400 dark:border-blue-light-500/30";
  if (status === "contacted") return "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/15 dark:text-orange-400 dark:border-warning-500/30";
  if (status === "converted") return "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/15 dark:text-success-400 dark:border-success-500/30";
  if (status === "not_interested") return "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/15 dark:text-error-400 dark:border-error-500/30";
  return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-gray-700";
}

// details.interests is stored as a comma-separated string from the kiosk app.
export function getPriorityColor(lead: Lead): string | null {
  const vr = lead.details?.visit_reason || "";
  const ints = lead.details?.interests || "";
  if (vr === "Interested in membership") return "#E74C3C";
  if (ints.includes("Personal Training")) return "#E67E22";
  if (vr === "ClassPass" || vr === "Event/Promotion") return "#F1C40F";
  return null;
}

export const PRIORITY_LEGEND = [
  { color: "#E74C3C", label: "Interested in membership" },
  { color: "#E67E22", label: "Personal Training interest" },
  { color: "#F1C40F", label: "ClassPass / Event" },
];

// These must match the exact strings stored in details->>visit_reason by the kiosk.
export const VISIT_REASONS = [
  "Interested in membership",
  "Day/week pass workout",
  "Staff Guest",
  "Event/Promotion",
  "ClassPass",
];

export function summaryLine(source: string, details: LeadDetails | null, visitCount: number): string | null {
  if (!details && source !== "checkin_app" && source !== "classpass") return null;
  switch (source) {
    case "join":
      return details?.plan ? `Plan: ${details.plan}` : null;
    case "tour":
      return [details?.date, details?.time, details?.group].filter(Boolean).join(" · ") || null;
    case "booking":
      return [details?.type, details?.date, details?.time].filter(Boolean).join(" · ") || null;
    case "training_assessment":
      return [details?.membership_status, details?.fitness_level].filter(Boolean).join(" · ") || null;
    case "nasm_partnership":
      return details?.course || null;
    case "checkin_app":
    case "classpass": {
      const parts = [details?.visit_reason, visitCount > 1 ? `${visitCount} visits` : null].filter(Boolean);
      return parts.join(" · ") || null;
    }
    default:
      return null;
  }
}

export const DETAIL_FIELD_LABELS: Record<string, string> = {
  plan: "Plan", date: "Date", time: "Time", group: "Group size", notes: "Notes",
  type: "Booking type", contact_method: "Preferred contact",
  membership_status: "Membership status", goals: "Goals",
  fitness_level: "Fitness level", availability: "Availability",
  medical_notes: "Medical / joint notes", mailing_address: "Mailing address",
  course: "Course", questions: "Questions",
  visit_reason: "Visit reason", interests: "Interests",
  how_heard: "How heard", zip_code: "Zip code",
};

export const DETAIL_ORDER: Record<string, string[]> = {
  join: ["plan"],
  tour: ["date", "time", "group", "notes"],
  booking: ["type", "date", "time", "notes"],
  training_assessment: ["contact_method", "membership_status", "goals", "fitness_level", "availability", "medical_notes"],
  nasm_partnership: ["mailing_address", "course", "questions"],
  checkin_app: ["visit_reason", "interests", "how_heard", "zip_code"],
  classpass: ["visit_reason", "zip_code"],
};

export function detailRows(source: string, details: LeadDetails | null): [string, string][] {
  if (!details) return [];
  const order = DETAIL_ORDER[source] ?? Object.keys(details);
  return order
    .map((k): [string, string | undefined] => [DETAIL_FIELD_LABELS[k] ?? k, details[k]])
    .filter((entry): entry is [string, string] => Boolean(entry[1]));
}

export const PAGE_SIZE = 25;

export const SELECT_CLS =
  "text-sm border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white/90 rounded-lg px-2 py-1.5 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:focus:border-brand-800";
