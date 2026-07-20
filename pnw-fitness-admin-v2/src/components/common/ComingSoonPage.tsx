import PageBreadcrumb from "./PageBreadCrumb";
import PageMeta from "./PageMeta";

// Placeholder for a page whose route/permission gating is wired up in Phase 2
// but whose real content is built in Phase 3.
export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div>
      <PageMeta title={`${title} | PNW Fitness Admin`} description="" />
      <PageBreadcrumb pageTitle={title} />
      <div className="min-h-[400px] rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px] text-center">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Route and permission gating are wired up — the real page content
            for {title} is built in Phase 3.
          </p>
        </div>
      </div>
    </div>
  );
}
