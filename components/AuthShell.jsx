import Head from "next/head";

export default function AuthShell({
  title,
  kicker,
  heroTitle,
  heroLede,
  children,
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.16),transparent_30%),linear-gradient(180deg,#f7faff,#eef6ff)]">
        <div className="grid min-h-screen lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative hidden overflow-hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-900 via-sky-800 to-slate-900" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.25),transparent_45%)] opacity-70" />
            <div className="absolute inset-0 hero-grid opacity-10" aria-hidden="true" />
            <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />
            <div className="absolute -right-10 bottom-12 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="relative flex h-full items-center justify-center px-16 py-16">
              <div className="max-w-2xl space-y-8 text-center text-white animate-soft-fade">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
                  {kicker}
                </p>
                <h1 className="text-4xl font-bold leading-tight lg:text-[44px]">
                  {heroTitle}
                </h1>
                <p className="text-lg text-slate-100/90 max-w-2xl mx-auto">{heroLede}</p>
                <div className="grid gap-3 text-sm text-slate-100/90 sm:grid-cols-2 mx-auto max-w-xl">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                    <p className="font-semibold text-white">Curated by peers</p>
                    <p className="mt-1">
                      Listings stay fresh and honest thanks to student reviewers.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                    <p className="font-semibold text-white">Flexible access</p>
                    <p className="mt-1">
                      Borrow, return, or list your own copies with quick pickup slots.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center px-6 py-12 lg:justify-start lg:px-16 lg:pt-24">
            <div className="w-full max-w-md space-y-8 animate-soft-fade">
              <div className="glass-panel w-full rounded-3xl p-8 animate-soft-fade">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
