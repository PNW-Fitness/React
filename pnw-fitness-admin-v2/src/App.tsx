import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Leads from "./pages/Leads";
import GuestNotes from "./pages/GuestNotes";
import VendorLog from "./pages/VendorLog";
import ActivityLog from "./pages/ActivityLog";
import UsersRoles from "./pages/UsersRoles";
import { supabase } from "./lib/supabaseClient";
import { useAuth } from "./lib/AuthContext";
import { usePermissions } from "./lib/PermissionsContext";

const INACTIVITY_MS = 30 * 60 * 1000;

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading…
    </div>
  );
}

// Same fixed priority order as pnw-fitness-admin/src/App.jsx (minus the
// out-of-scope Staff page): first page the user has access to wins.
const REDIRECT_PRIORITY = [
  { permKey: "pages.leads", path: "/leads" },
  { permKey: "pages.guest_notes", path: "/guest-notes" },
  { permKey: "pages.vendor_log", path: "/vendor-log" },
  { permKey: "pages.activity_log", path: "/activity" },
  { permKey: "pages.users_roles", path: "/users-roles" },
];

function firstAccessiblePath(can: (key: string) => boolean): string | null {
  const match = REDIRECT_PRIORITY.find((r) => can(r.permKey));
  return match ? match.path : null;
}

// Ported from pnw-fitness-admin/src/App.jsx.
export function NoAccess() {
  const { session } = useAuth();
  const { can, permissionsReady } = usePermissions();

  if (!session) return <Navigate to="/login" replace />;

  // Permissions still loading — hold here rather than showing the error screen.
  if (!permissionsReady) return <Loading />;

  // Landed here due to a race condition: permissions are now ready and the
  // user has access somewhere, so route them there.
  const firstPath = firstAccessiblePath(can);
  if (firstPath) return <Navigate to={firstPath} replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <p className="font-medium text-gray-700 dark:text-gray-300">
          No pages are assigned to your account.
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Contact an admin to assign you an RBAC role.
        </p>
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-brand-500 hover:underline"
          >
            Retry
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-400 hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// Sends signed-in users to their first accessible page.
export function DefaultRedirect() {
  const { session, role } = useAuth();
  const { can, permissionsReady } = usePermissions();
  if (session === undefined || (session && (role === undefined || !permissionsReady)))
    return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={firstAccessiblePath(can) ?? "/no-access"} replace />;
}

// Gate for permission-based pages. Redirects to first accessible page if denied.
export function PermissionRoute({
  requiredPerms,
  children,
}: {
  requiredPerms: string[];
  children: React.ReactNode;
}) {
  const { session, role } = useAuth();
  const { can, permissionsReady } = usePermissions();
  if (session === undefined || (session && (role === undefined || !permissionsReady)))
    return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  if (!requiredPerms.every((p) => can(p))) {
    return <Navigate to={firstAccessiblePath(can) ?? "/no-access"} replace />;
  }
  return children;
}

export default function App() {
  const { session } = useAuth();

  // Inactivity timeout — signs the user out after 30 minutes of no interaction.
  useEffect(() => {
    if (!session) return;

    let timer: ReturnType<typeof setTimeout>;

    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.replace("/login?timeout=1");
      }, INACTIVITY_MS);
    }

    const EVENTS = ["mousemove", "keydown", "click", "touchstart"];
    EVENTS.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [session]);

  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />

            {/* PNW Fitness operational pages */}
            <Route
              path="/leads"
              element={
                <PermissionRoute requiredPerms={["pages.leads"]}>
                  <Leads />
                </PermissionRoute>
              }
            />
            <Route
              path="/guest-notes"
              element={
                <PermissionRoute requiredPerms={["pages.guest_notes"]}>
                  <GuestNotes />
                </PermissionRoute>
              }
            />
            <Route
              path="/vendor-log"
              element={
                <PermissionRoute requiredPerms={["pages.vendor_log"]}>
                  <VendorLog />
                </PermissionRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <PermissionRoute requiredPerms={["pages.activity_log"]}>
                  <ActivityLog />
                </PermissionRoute>
              }
            />
            <Route
              path="/users-roles"
              element={
                <PermissionRoute requiredPerms={["pages.users_roles"]}>
                  <UsersRoles />
                </PermissionRoute>
              }
            />
          </Route>

          {/* Auth Layout */}
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/no-access" element={<NoAccess />} />

          {/* Fallback Route — matches pnw-fitness-admin's catch-all: send
              signed-in users to their first accessible page rather than a
              generic 404 (NotFound stays available/imported, just unrouted). */}
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </Router>
    </>
  );
}
