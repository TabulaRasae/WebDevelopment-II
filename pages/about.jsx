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

export default function About({ currentUser, cartCount: count }) {
  return (
    <Layout
      currentUser={currentUser}
      cartCount={count}
      title="About BMCC UsedBooks Store"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
            Student-led program
          </p>
          <h1 className="text-3xl font-bold text-slate-900">About the program</h1>
          <p className="text-slate-600">
            BMCC UsedBooks Store keeps course materials in circulation and out of
            landfills. We verify every ISBN, log transactions, and host weekly swap
            events so you can buy or sell textbooks without leaving campus.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 stagger-children">
          {[
            {
              name: "Maya Patel",
              role: "Program Coordinator",
              copy:
                "Maya schedules donation drives and keeps our listing guidelines up to date so every buyer knows exactly what they're getting.",
              image:
                "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
            },
            {
              name: "Luis Romero",
              role: "Quality Lead",
              copy:
                "Luis inspects donated books, checks for missing pages, and labels every copy with an honest condition rating.",
              image:
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
            },
            {
              name: "Serena Wong",
              role: "Logistics & Pickup",
              copy:
                "Serena coordinates lockers and on-campus pickup appointments so transactions are quick, safe, and accessible.",
              image:
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80",
            },
          ].map((member) => (
            <div key={member.name} className="card card-lift overflow-hidden">
              <img
                src={member.image}
                alt={member.name}
                className="h-44 w-full object-cover"
              />
              <div className="space-y-2 p-4">
                <h3 className="text-lg font-semibold text-slate-900">{member.name}</h3>
                <p className="text-sm text-sky-700">{member.role}</p>
                <p className="text-sm text-slate-600">{member.copy}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-600">
          All proceeds fund emergency textbook grants for BMCC students. Thanks for
          helping us keep the cycle going.
        </p>
      </div>
    </Layout>
  );
}
