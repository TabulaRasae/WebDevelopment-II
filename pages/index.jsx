import Link from "next/link";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import { cartCount, cartTotals, getCartSnapshot } from "../lib/cart";
import connectDB from "../lib/db";
import { mapProduct } from "../lib/products";
import { withSessionSsr } from "../lib/session";
import Product from "../database/models/Product";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  if (!req.session?.userId) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  await connectDB();
  const [cart, featuredDocs] = await Promise.all([
    getCartSnapshot(req.session.userId),
    Product.find().sort({ name: 1 }).limit(3).lean(),
  ]);

  return {
    props: {
      currentUser: req.session.userId,
      totals: cartTotals(cart),
      cartCount: cartCount(cart),
      featuredProducts: featuredDocs.map(mapProduct),
    },
  };
});

export default function Home({
  currentUser,
  totals,
  cartCount: count,
  featuredProducts,
}) {
  return (
    <Layout
      currentUser={currentUser}
      cartCount={count}
      title="BMCC UsedBooks Portal"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-sky-700">
            Welcome back, {currentUser}
          </p>
          <h2 className="text-3xl font-bold text-slate-900">Your textbook dashboard</h2>
          <p className="text-slate-700">
            New arrivals, quick cart snapshot, and support from the Student
            Activities Book Committee—all in one place.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 stagger-children">
          <div className="card card-lift space-y-3 p-5 reveal-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Cart snapshot</h3>
              <span className="badge">Synced</span>
            </div>
            <div className="space-y-1 text-sm text-slate-700">
              <p>Subtotal: ${totals.subtotal.toFixed(2)}</p>
              <p>Estimated tax: ${totals.tax.toFixed(2)}</p>
              <p className="font-semibold text-slate-900">
                Grand total: ${totals.grandTotal.toFixed(2)}
              </p>
            </div>
            <Link className="btn-primary w-full justify-center" href="/cart">
              View cart
            </Link>
          </div>
          <div className="card card-lift space-y-3 p-5 reveal-up">
            <h3 className="text-lg font-semibold text-slate-900">Need assistance?</h3>
            <p className="text-sm text-slate-700">
              The Student Activities Book Committee can help verify ISBNs,
              coordinate on-campus meetups, or answer questions about selling
              your own books.
            </p>
            <Link className="btn-ghost w-full justify-center" href="/contact">
              Contact us
            </Link>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Featured textbooks</h3>
            <Link className="text-sm text-sky-700" href="/products">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                redirectOnAdd="/"
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
