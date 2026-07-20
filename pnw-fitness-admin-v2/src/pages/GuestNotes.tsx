import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import GuestNotesPanel from "../components/guest-notes/GuestNotesPanel";

export default function GuestNotes() {
  return (
    <div className="max-w-2xl mx-auto">
      <PageMeta title="Guest Notes | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Guest Notes" />
      <GuestNotesPanel />
    </div>
  );
}
