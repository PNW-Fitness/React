import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { PermissionsProvider, usePermissions } from "./lib/PermissionsContext";
import Login from "./pages/Login";
import AppShell from "./layout/AppShell";
import Schedule from "./pages/Schedule/Schedule";
import Marketplace from "./pages/Marketplace/Marketplace";
import TimeOff from "./pages/TimeOff/TimeOff";
import TeamBoard from "./pages/TeamBoard/TeamBoard";
import Profile from "./pages/Profile/Profile";

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-navy/60 text-sm">
      Loading…
    </div>
  );
}

// Same shape as pnw-fitness-admin-v2's PermissionRoute: hold for
// session/permissions to resolve, bounce to /login if signed out, bounce to
// the first tab this person actually has if they lack the requested one.
function Gate({ requiredPerms, children }: { requiredPerms: string[]; children: React.ReactNode }) {
  const { session, role } = useAuth();
  const { can, permissionsReady } = usePermissions();
  if (session === undefined || (session && (role === undefined || !permissionsReady))) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  if (!requiredPerms.every((p) => can(p))) {
    return <Navigate to={firstAccessibleTab(can)} replace />;
  }
  return <>{children}</>;
}

const TAB_PRIORITY = [
  { permKey: "pages.schedule", path: "/schedule" },
  { permKey: "pages.time_off", path: "/time-off" },
  { permKey: "pages.team_board", path: "/team-board" },
];

function firstAccessibleTab(can: (key: string) => boolean): string {
  const match = TAB_PRIORITY.find((t) => can(t.permKey));
  // Profile has no permission gate — every signed-in user lands somewhere.
  return match ? match.path : "/profile";
}

function DefaultRedirect() {
  const { session, role } = useAuth();
  const { can, permissionsReady } = usePermissions();
  if (session === undefined || (session && (role === undefined || !permissionsReady))) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={firstAccessibleTab(can)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route index element={<DefaultRedirect />} />
        <Route
          path="/schedule"
          element={
            <Gate requiredPerms={["pages.schedule"]}>
              <Schedule />
            </Gate>
          }
        />
        <Route
          path="/marketplace"
          element={
            <Gate requiredPerms={["pages.schedule"]}>
              <Marketplace />
            </Gate>
          }
        />
        <Route
          path="/time-off"
          element={
            <Gate requiredPerms={["pages.time_off"]}>
              <TimeOff />
            </Gate>
          }
        />
        <Route
          path="/team-board"
          element={
            <Gate requiredPerms={["pages.team_board"]}>
              <TeamBoard />
            </Gate>
          }
        />
        <Route
          path="/profile"
          element={
            <Gate requiredPerms={[]}>
              <Profile />
            </Gate>
          }
        />
      </Route>
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <Router>
          <AppRoutes />
        </Router>
      </PermissionsProvider>
    </AuthProvider>
  );
}
