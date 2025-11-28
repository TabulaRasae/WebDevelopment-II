import Layout from "../components/Layout";
import { cartCount, getCartSnapshot } from "../lib/cart";
import { withSessionSsr } from "../lib/session";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  if (!req.session?.userId) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const cart = await getCartSnapshot(req.session.userId);

  return {
    props: {
      currentUser: req.session.userId,
      cartCount: cartCount(cart),
    },
  };
});

export default function Contact({ currentUser, cartCount: count }) {
  return (
    <Layout
      currentUser={currentUser}
      cartCount={count}
      title="Contact | BMCC UsedBooks Store"
      hideHero
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
            Contact &amp; Support
          </p>
          <h1 className="text-3xl font-bold text-slate-900">We’re here to help</h1>
          <p className="text-slate-600">
            Need to verify an ISBN, schedule a pickup, or donate your old
            textbooks? Reach out and a student volunteer will reply within one
            business day.
          </p>
          <form
            action="mailto:usedbooks@bmcc.cuny.edu"
            method="post"
            className="card card-lift space-y-4 p-6 reveal-up"
          >
            <label className="block space-y-1">
              <span className="label">Name</span>
              <input className="input" type="text" required />
            </label>
            <label className="block space-y-1">
              <span className="label">Email</span>
              <input className="input" type="email" required />
            </label>
            <label className="block space-y-1">
              <span className="label">Message</span>
              <textarea className="input min-h-[120px]" rows="4" required />
            </label>
            <button type="submit" className="btn-primary w-full">
              Send Message
            </button>
          </form>
        </div>
        <div className="card card-lift space-y-4 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Support Channels</h2>
          <ul className="space-y-2 text-slate-700">
            <li>Email: usedbooks@bmcc.cuny.edu</li>
            <li>Phone: (212) 220-8000 ext. 5555</li>
            <li>Pickup Desk: Fiterman Hall, Room F-317</li>
          </ul>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Hours</p>
            <p>Mon–Fri, 9:00 AM – 5:00 PM</p>
            <p className="mt-2 font-semibold text-slate-900">Location</p>
            <p>Fiterman Hall, Room F-317</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
