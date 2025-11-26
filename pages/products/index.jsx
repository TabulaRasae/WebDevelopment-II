import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import MessageBanner from "../../components/MessageBanner";
import AddToCartButton from "../../components/AddToCartButton";
import { cartCount, getCartSnapshot } from "../../lib/cart";
import connectDB from "../../lib/db";
import { fetchProducts } from "../../lib/products";
import { withSessionSsr } from "../../lib/session";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  if (!req.session?.userId) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  await connectDB();
  const [cart, products] = await Promise.all([
    getCartSnapshot(req.session.userId),
    fetchProducts(),
  ]);

  return {
    props: {
      products,
      currentUser: req.session.userId,
      cartCount: cartCount(cart),
    },
  };
});

export default function Products({ products, currentUser, cartCount: count }) {
  const router = useRouter();
  const [banner, setBanner] = useState({ message: "", isError: false });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    shortDescription: "",
    description: "",
    headline: "",
    image: "",
    specs: "",
  });
  const [quantities, setQuantities] = useState({});
  const priceLabels = useMemo(
    () =>
      products.reduce((map, product) => {
        map[product.id] = product.price.toFixed(2);
        return map;
      }, {}),
    [products]
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    setBanner({ message: "", isError: false });
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to create listing.");
      }
      setBanner({ message: "Listing created successfully.", isError: false });
      setShowForm(false);
      setForm({
        name: "",
        price: "",
        shortDescription: "",
        description: "",
        headline: "",
        image: "",
        specs: "",
      });
      router.replace(router.asPath);
    } catch (error) {
      setBanner({ message: error.message, isError: true });
      setShowForm(true);
    }
  };

  const handleQuantityChange = (id, value) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <Layout
      currentUser={currentUser}
      cartCount={count}
      title="Books | BMCC UsedBooks Store"
      hideHero
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-accent-100">
            Browse the catalog
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Available textbooks</h1>
          <p className="text-slate-600">
            Each listing is verified before it goes live. Reserve a title, pick
            it up at Fiterman Hall, and return it when you're done.
          </p>
        </div>
        <MessageBanner message={banner.message} isError={banner.isError} />

        <div className="card card-lift space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-100">
                List a textbook
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Add your own listing so classmates can pick it up.
              </h2>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Hide form" : "Add a book"}
            </button>
          </div>
          {showForm && (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
              <div className="space-y-3">
                <label className="label">
                  Title
                  <input
                    className="input mt-1"
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label className="label">
                  Price (USD)
                  <input
                    className="input mt-1"
                    type="number"
                    name="price"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </label>
                <label className="label">
                  Headline
                  <input
                    className="input mt-1"
                    type="text"
                    name="headline"
                    maxLength="140"
                    placeholder="Quick one-liner"
                    required
                    value={form.headline}
                    onChange={(e) =>
                      setForm({ ...form, headline: e.target.value })
                    }
                  />
                </label>
                <label className="label">
                  Image URL
                  <input
                    className="input mt-1"
                    type="url"
                    name="image"
                    placeholder="https://example.com/cover.jpg"
                    required
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                </label>
              </div>
              <div className="space-y-3">
                <label className="label">
                  Short description
                  <textarea
                    className="input mt-1 min-h-[64px]"
                    name="shortDescription"
                    rows="2"
                    maxLength="180"
                    required
                    value={form.shortDescription}
                    onChange={(e) =>
                      setForm({ ...form, shortDescription: e.target.value })
                    }
                  />
                </label>
                <label className="label">
                  Full description
                  <textarea
                    className="input mt-1 min-h-[96px]"
                    name="description"
                    rows="3"
                    required
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </label>
                <label className="label">
                  Specs (one per line)
                  <textarea
                    className="input mt-1 min-h-[72px]"
                    name="specs"
                    rows="3"
                    placeholder="ISBN, Edition, Condition"
                    value={form.specs}
                    onChange={(e) => setForm({ ...form, specs: e.target.value })}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="btn-primary">
                    Create listing
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {products.map((product) => {
            const qty = quantities[product.id] || 1;
            return (
              <div className="card flex h-full flex-col" key={product.id}>
                <a
                  className="relative block aspect-[3/4] overflow-hidden"
                  href={`/products/${product.id}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </a>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-accent-100">
                      ${product.price.toFixed(2)}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {product.shortDescription}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.specs.map((spec) => (
                      <span className="pill" key={spec}>
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto space-y-2">
                    <label className="label flex items-center gap-2">
                      Qty
                      <input
                        className="input w-20"
                        type="number"
                        min="1"
                        value={qty}
                        onChange={(e) =>
                          handleQuantityChange(product.id, e.target.value)
                        }
                      />
                    </label>
                    <AddToCartButton
                      productId={product.id}
                      quantity={qty}
                      redirect="/products"
                    >
                      Add to Cart - ${priceLabels[product.id]}
                    </AddToCartButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
