import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import BannedGuestsTable from "../components/banned-guests/BannedGuestsTable";

export default function BannedGuests() {
  return (
    <div>
      <PageMeta title="Banned Guests | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Banned Guests" />
      <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
        Viewable by everyone; approving, denying, applying, or lifting a ban requires the Bans permission.
      </p>
      <BannedGuestsTable />
    </div>
  );
}
