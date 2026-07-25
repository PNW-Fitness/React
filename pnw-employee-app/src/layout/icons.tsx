// Minimal inline icon set — kept out of a UI-kit dependency to stay lean for
// a mobile PWA bundle. Stroke-based, currentColor, sized by the parent.

type IconProps = { className?: string };

export function ScheduleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.2" />
      <path d="M3 9.5h18M8 3v3M16 3v3" strokeLinecap="round" />
    </svg>
  );
}

export function MarketplaceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M7 7h13l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.5L5.3 5.2A1 1 0 0 0 4.3 4.5H3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.1" />
      <circle cx="17" cy="20" r="1.1" />
    </svg>
  );
}

export function TimeOffIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TeamBoardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3.5" y="4.5" width="17" height="13" rx="1.8" />
      <path d="M8 21h8M12 17.5V21M7.5 9h9M7.5 12.5h6" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20c1.1-3.6 4-5.4 7.2-5.4s6.1 1.8 7.2 5.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}
