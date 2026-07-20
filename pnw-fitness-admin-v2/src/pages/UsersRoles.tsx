import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import UsersTab from "../components/users-roles/UsersTab";
import RolesTab from "../components/users-roles/RolesTab";
import AddUserTab from "../components/users-roles/AddUserTab";

type TabKey = "users" | "roles" | "add";

const TABS: { key: TabKey; label: string }[] = [
  { key: "users", label: "Users" },
  { key: "roles", label: "Roles & Permissions" },
  { key: "add", label: "Add User" },
];

export default function UsersRoles() {
  const [tab, setTab] = useState<TabKey>("users");

  return (
    <div>
      <PageMeta title="Users & Roles | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Users & Roles" />

      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-brand-600 text-brand-700 dark:text-brand-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "roles" && <RolesTab />}
      {tab === "add" && <AddUserTab />}
    </div>
  );
}
