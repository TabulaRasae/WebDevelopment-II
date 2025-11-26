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
      <div className="relative min-h-screen overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=80"
          alt="Library shelves filled with study books"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-sky-100/70" />
        <div className="absolute inset-0 hero-grid opacity-15" aria-hidden="true" />
        <div
          className="absolute -left-10 top-12 h-64 w-64 rounded-full bg-sky-300/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-amber-300/35 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative grid min-h-screen items-center lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden h-full lg:flex lg:items-center lg:justify-center lg:px-10 lg:pb-16 lg:pt-20">
            <div className="glass-panel max-w-2xl rounded-3xl p-8 text-slate-900 animate-soft-fade">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-100">
                {kicker}
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight lg:text-[44px]">
                {heroTitle}
              </h1>
              <p className="mt-4 text-lg text-slate-700">{heroLede}</p>
              <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur">
                  <p className="font-semibold text-slate-900">Curated by peers</p>
                  <p className="mt-1 text-slate-700/90">
                    Listings stay fresh and honest thanks to student reviewers.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur">
                  <p className="font-semibold text-slate-900">Flexible access</p>
                  <p className="mt-1 text-slate-700/90">
                    Borrow, return, or list your own copies with quick pickup slots.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center px-4 py-10 lg:justify-end lg:px-10">
            <div className="glass-panel w-full max-w-md rounded-3xl p-8 animate-soft-fade">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
