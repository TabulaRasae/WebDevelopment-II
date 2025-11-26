import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";

const Hero = () => (
  <section className="relative min-h-[560px] overflow-hidden rounded-[32px] shadow-card md:min-h-[680px]">
    <img
      src="https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&w=1600&q=80"
      alt="Stack of open textbooks"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/70 to-sky-100/70" />
    <div className="absolute inset-0 hero-grid opacity-25" aria-hidden="true" />
    <div
      className="absolute -left-12 bottom-6 h-60 w-60 rounded-full bg-sky-300/40 blur-3xl"
      aria-hidden="true"
    />
    <div
      className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-amber-300/35 blur-3xl"
      aria-hidden="true"
    />
    <div className="relative flex min-h-[560px] items-center md:min-h-[680px]">
      <div className="page-shell">
        <div className="glass-panel max-w-3xl rounded-3xl p-8 md:p-10 animate-soft-fade">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-100">
            Campus verified · Always in rotation
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
            Borrow, swap, and save on every textbook.
          </h1>
          <p className="mt-4 text-lg text-slate-700">
            Reserve peer-reviewed copies, track pickups, and keep your study fuel flowing
            with a marketplace built just for BMCC students.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/products">
              Browse catalog
            </Link>
            <Link className="btn-ghost" href="/about">
              How it works
            </Link>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-3 stagger-children">
            {[
              { title: "Same-week pickups", copy: "Reserve now, grab at Fiterman Hall." },
              { title: "Verified ISBNs", copy: "Every listing inspected by volunteers." },
              { title: "Wallet friendly", copy: "Keep rentals moving and budgets safe." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 backdrop-blur-md animate-soft-fade"
              >
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-slate-700">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="mt-12 border-t border-slate-200 bg-white/70 backdrop-blur">
    <div className="page-shell flex flex-col gap-2 py-8 text-sm text-slate-600">
      <p>
        &copy; {new Date().getFullYear()} BMCC UsedBooks Store · Managed by the
        Student Activities Book Committee.
      </p>
      <p className="flex gap-2">
        <Link href="/contact">Contact support</Link>
        <span aria-hidden="true">·</span>
        <Link href="/about">About the program</Link>
      </p>
    </div>
  </footer>
);

export default function Layout({
  children,
  currentUser,
  cartCount = 0,
  hideHero = false,
  hideNav = false,
  title = "BMCC UsedBooks Portal",
}) {
  const [navOpen, setNavOpen] = useState(false);
  const badge = useMemo(
    () => (cartCount && cartCount > 0 ? ` (${cartCount})` : " (0)"),
    [cartCount]
  );

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_18%,rgba(56,189,248,0.26),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(252,211,77,0.2),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(99,102,241,0.18),transparent_38%),linear-gradient(180deg,#f7faff,#eef6ff)] text-slate-900">
        {!hideNav && (
          <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xl">
            <div className="page-shell flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="text-lg font-bold text-slate-900 hover:text-sky-700"
                >
                  BMCC UsedBooks Store
                </Link>
                <span className="hidden rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-slate-800 sm:inline-flex">
                  Signed in as {currentUser || "Guest"}
                </span>
              </div>
              <nav className="flex items-center gap-3">
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-900 lg:hidden"
                  aria-label="Toggle navigation"
                  type="button"
                  onClick={() => setNavOpen((open) => !open)}
                >
                  <span className="sr-only">Menu</span>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <div
                  className={`${
                    navOpen ? "flex" : "hidden"
                  } absolute left-0 right-0 top-[76px] z-20 flex-col gap-2 border-b border-slate-200 bg-white px-4 py-4 shadow-card backdrop-blur-lg lg:static lg:flex lg:flex-row lg:items-center lg:gap-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
                >
                  <Link className="btn-ghost" href="/" title="Home">
                    Home
                  </Link>
                  <Link className="btn-ghost" href="/products" title="Products">
                    Books
                  </Link>
                  <Link className="btn-ghost" href="/about" title="About">
                    About
                  </Link>
                  <Link className="btn-ghost" href="/contact" title="Contact">
                    Contact
                  </Link>
                  <Link className="btn-primary" href="/cart" title="Cart">
                    Cart{badge}
                  </Link>
                  <form
                    method="post"
                    action="/api/auth/logout"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.href = "/login";
                    }}
                  >
                    <button type="submit" className="btn-ghost" title="Log off">
                      Logoff
                    </button>
                  </form>
                </div>
              </nav>
            </div>
          </header>
        )}
        <main className="page-shell space-y-10 pt-8">
          {!hideNav && !hideHero && <Hero />}
          <div>{children}</div>
        </main>
        {!hideNav && <Footer />}
      </div>
    </>
  );
}
