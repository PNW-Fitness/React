import { Outlet, NavLink } from "react-router";
import NotificationBell from "./NotificationBell";
import EnablePushBanner from "./EnablePushBanner";
import { ScheduleIcon, MarketplaceIcon, TimeOffIcon, TeamBoardIcon, ProfileIcon } from "./icons";

const TABS = [
  { to: "/schedule", label: "Schedule", Icon: ScheduleIcon },
  { to: "/marketplace", label: "Marketplace", Icon: MarketplaceIcon },
  { to: "/time-off", label: "Time Off", Icon: TimeOffIcon },
  { to: "/team-board", label: "Team", Icon: TeamBoardIcon },
  { to: "/profile", label: "Profile", Icon: ProfileIcon },
];

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="sticky top-0 z-20 bg-navy text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <span className="font-bold tracking-wide text-sm">
          PNW <span className="text-gold">FITNESS</span>
        </span>
        <NotificationBell />
      </header>

      <main className="flex-1 pb-20 overflow-y-auto">
        <EnablePushBanner />
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-black/5 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {TABS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  isActive ? "text-navy" : "text-navy/40"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? "text-gold" : ""}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
