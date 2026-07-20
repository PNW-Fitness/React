import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import VendorLogTable from "../components/tables/VendorLog/VendorLogTable";

export default function VendorLog() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageMeta title="Vendor Log | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Vendor Log" />
      <VendorLogTable />
    </div>
  );
}
