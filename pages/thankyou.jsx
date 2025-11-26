import Layout from "../components/Layout";
import { withSessionSsr } from "../lib/session";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  if (!req.session?.userId) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const justCheckedOut = req.session.justCheckedOut;
  req.session.justCheckedOut = false;
  await req.session.save();

  if (!justCheckedOut) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return {
    props: {
      currentUser: req.session.userId,
    },
  };
});

export default function ThankYou({ currentUser }) {
  return (
    <Layout
      currentUser={currentUser}
      cartCount={0}
      hideHero
      title="Thank You | BMCC UsedBooks Store"
    >
      <div className="card card-lift space-y-3 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-100">
          Order confirmed
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Thank you for supporting the exchange!</h1>
        <p className="text-slate-600">
          Your checkout is confirmed and a pickup email is on the way. Swing by
          Fiterman Hall to grab your books.
        </p>
      </div>
    </Layout>
  );
}
