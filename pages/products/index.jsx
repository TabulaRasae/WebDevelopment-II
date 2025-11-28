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
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    edition: "",
    price: "",
    condition: "",
    authors: "",
  });
  const [quantities, setQuantities] = useState({});
  const [generating, setGenerating] = useState(false);
  const priceLabels = useMemo(
    () =>
      products.reduce((map, product) => {
        map[product.id] = product.price.toFixed(2);
        return map;
      }, {}),
    [products]
  );
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const haystack = [
        product.name,
        product.shortDescription,
        product.specs.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [products, search]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setBanner({ message: "", isError: false });
    setGenerating(true);
    const payload = {
      title: form.title.trim(),
      edition: form.edition.trim(),
      price: form.price,
      condition: form.condition.trim(),
      authors: form.authors.trim(),
    };
    try {
      const res = await fetch("/api/products/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to create listing.");
      }
      setBanner({ message: "Listing generated successfully.", isError: false });
      setShowForm(false);
      setForm({
        title: "",
        edition: "",
        price: "",
        condition: "",
        authors: "",
      });
      router.replace(router.asPath);
    } catch (error) {
      setBanner({ message: error.message, isError: true });
      setShowForm(true);
    } finally {
      setGenerating(false);
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
          <p className="text-sm font-semibold text-sky-700">
            Browse the catalog
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Available textbooks</h1>
          <p className="text-slate-600">
            Each listing is verified before it goes live. Reserve a title, pick
            it up at Fiterman Hall, and return it when you're done.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex w-full max-w-lg items-center gap-3">
              <span className="label shrink-0">Search</span>
              <input
                className="input"
                type="search"
                placeholder="Search by title, description, or specs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <span className="text-sm text-slate-600">
              Showing {filteredProducts.length} of {products.length}
            </span>
          </div>
        </div>
        <MessageBanner message={banner.message} isError={banner.isError} />

        <div className="card card-lift space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
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
            <div className="relative">
              {generating && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white/70 backdrop-blur-sm">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
                  <p className="text-sm font-semibold text-slate-800">
                    Generating listing with OpenAI…
                  </p>
                </div>
              )}
              <form
                className={`grid gap-4 md:grid-cols-2 ${generating ? "pointer-events-none blur-sm" : ""}`}
                onSubmit={handleCreate}
              >
                <div className="space-y-3">
                  <label className="label">
                    Title *
                    <input
                      className="input mt-1"
                      type="text"
                      name="title"
                      required
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Edition *
                    <input
                      className="input mt-1"
                      type="text"
                      name="edition"
                      required
                      value={form.edition}
                      onChange={(e) =>
                        setForm({ ...form, edition: e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Price (USD) *
                    <input
                      className="input mt-1"
                      type="number"
                      name="price"
                      min="0.01"
                      step="0.01"
                      required
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="space-y-3">
                  <label className="label">
                    Condition
                    <input
                      className="input mt-1"
                      type="text"
                      name="condition"
                      placeholder="e.g., Good, highlights, no tears"
                      value={form.condition}
                      onChange={(e) =>
                        setForm({ ...form, condition: e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Authors
                    <input
                      className="input mt-1"
                      type="text"
                      name="authors"
                      placeholder="Separate with commas"
                      value={form.authors}
                      onChange={(e) =>
                        setForm({ ...form, authors: e.target.value })
                      }
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button type="submit" className="btn-primary">
                      Generate listing
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
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {filteredProducts.map((product) => {
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
                    <p className="text-xs uppercase tracking-[0.2em] text-sky-700">
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
