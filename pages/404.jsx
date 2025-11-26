import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(252,211,77,0.18),transparent_30%),linear-gradient(180deg,#f7faff,#eef6ff)]">
      <div className="page-shell flex min-h-screen flex-col items-center justify-center text-center">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-100">
            404
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
          <p className="text-slate-600">
            We couldn't locate that listing inside the BMCC UsedBooks catalog.
            Return to the home page to browse available titles.
          </p>
          <Link className="btn-primary justify-center" href="/">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
