import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { SOURCE_LABELS } from "../../lib/sourceLabels";
import { STATUS_OPTIONS, STATUS_LABELS, VISIT_REASONS, SELECT_CLS } from "../../lib/leadsHelpers";

interface Trainer {
  user_id: string;
  display_name: string | null;
  email: string;
}

interface LeadsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterSource: string;
  onFilterSourceChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterVisitReason: string;
  onFilterVisitReasonChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  canAssign: boolean;
  filterAssigned: string;
  onFilterAssignedChange: (value: string) => void;
  trainers: Trainer[];
  canMarkTest: boolean;
  hideTest: boolean;
  onHideTestChange: (value: boolean) => void;
  anyFilter: boolean;
  onClearFilters: () => void;
}

export default function LeadsFilterBar({
  search,
  onSearchChange,
  filterSource,
  onFilterSourceChange,
  filterStatus,
  onFilterStatusChange,
  filterVisitReason,
  onFilterVisitReasonChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  canAssign,
  filterAssigned,
  onFilterAssignedChange,
  trainers,
  canMarkTest,
  hideTest,
  onHideTestChange,
  anyFilter,
  onClearFilters,
}: LeadsFilterBarProps) {
  return (
    <>
      {/* Search */}
      <div className="relative mb-3">
        <Input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-8"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Source</label>
          <select value={filterSource} onChange={(e) => onFilterSourceChange(e.target.value)} className={SELECT_CLS}>
            <option value="all">All</option>
            {Object.entries(SOURCE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
          <select value={filterStatus} onChange={(e) => onFilterStatusChange(e.target.value)} className={SELECT_CLS}>
            <option value="all">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Visit reason</label>
          <select
            value={filterVisitReason}
            onChange={(e) => onFilterVisitReasonChange(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="all">All</option>
            {VISIT_REASONS.map((vr) => (
              <option key={vr} value={vr}>
                {vr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={SELECT_CLS}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
          <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className={SELECT_CLS} />
        </div>

        {/* Trainer filter — only shown to admin and fitness_manager */}
        {canAssign && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Trainer</label>
            <select
              value={filterAssigned}
              onChange={(e) => onFilterAssignedChange(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="all">All</option>
              <option value="unassigned">Unassigned</option>
              {trainers.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.display_name || t.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {canMarkTest && (
          <Checkbox
            label="Show test entries"
            checked={!hideTest}
            onChange={(checked) => onHideTestChange(!checked)}
          />
        )}

        {anyFilter && (
          <button
            onClick={onClearFilters}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 transition"
          >
            Clear all
          </button>
        )}
      </div>
    </>
  );
}
