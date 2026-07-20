import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ActivityLogTable from "../components/tables/ActivityLog/ActivityLogTable";

export default function ActivityLog() {
  return (
    <div>
      <PageMeta title="Activity Log | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Activity Log" />
      <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
        Most recent 100 sign-in events.
      </p>
      <ActivityLogTable />
    </div>
  );
}
