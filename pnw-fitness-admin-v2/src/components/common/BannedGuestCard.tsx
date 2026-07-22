import { useNavigate } from "react-router";
import Badge from "../ui/badge/Badge";
import ComponentCard from "./ComponentCard";

export interface BannedGuest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

// Replaces the normal row/card for a guest once banned — matched by name,
// email, or phone against the active search — so banned guests don't clutter
// day-to-day Leads/Guest Notes workflows but still surface if searched for.
export default function BannedGuestCard({ guest }: { guest: BannedGuest }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/banned-guests?guest=${guest.id}`)}
      className="w-full text-left"
    >
      <ComponentCard title={guest.name}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">{guest.phone || guest.email || "—"}</p>
          <Badge size="sm" color="error">
            Banned
          </Badge>
        </div>
        <p className="text-xs text-gray-400 mt-1">Click to view ban details</p>
      </ComponentCard>
    </button>
  );
}
