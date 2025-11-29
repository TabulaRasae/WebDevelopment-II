import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import MessageBanner from "../../components/MessageBanner";
import AddToCartButton from "../../components/AddToCartButton";
import { cartCount, getCartSnapshot } from "../../lib/cart";
import connectDB from "../../lib/db";
import { fetchProducts } from "../../lib/products";
import { withSessionSsr } from "../../lib/session";
import { compressImage } from "../../lib/imageCompression";
import { uploadImagesToSupabase, deleteSupabaseImages } from "../../lib/supabaseStorage";

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
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
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
    setUploadingImages(true);
    if (imageFiles.length > 5) {
      setBanner({ message: "Please upload 5 images or fewer.", isError: true });
      setGenerating(false);
      setUploadingImages(false);
      return;
    }
    let uploadedImages = [];
    if (imageFiles.length) {
      try {
        const compressedFiles = [];
        for (const file of imageFiles) {
          const compressed = await compressImage(file, { maxBytes: 380 * 1024 });
          compressedFiles.push(compressed);
        }
        const uploads = await uploadImagesToSupabase(compressedFiles);
        uploadedImages = uploads.map((item) => item.url);
      } catch (error) {
        setBanner({
          message: `Image upload failed: ${error?.message || "Unknown error"}`,
          isError: true,
        });
        setGenerating(false);
        setUploadingImages(false);
        return;
      }
    }
    setUploadingImages(false);
    const payload = {
      title: form.title.trim(),
      edition: form.edition.trim(),
      price: form.price,
      condition: form.condition.trim(),
      authors: form.authors.trim(),
      images: uploadedImages,
    };
    try {
      const res = await fetch("/api/products/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (uploadedImages.length) {
          deleteSupabaseImages(uploadedImages).catch(() => {});
        }
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
      setImageFiles([]);
      router.replace(router.asPath);
    } catch (error) {
      setBanner({ message: error.message, isError: true });
      setShowForm(true);
    } finally {
      setGenerating(false);
    }
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
                    {uploadingImages ? "Uploading photos…" : "Generating listing with OpenAI…"}
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
                    Edition
                    <input
                      className="input mt-1"
                      type="text"
                      name="edition"
                      placeholder="e.g., 3rd, 2021 printing (optional)"
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
                  <label className="label">
                    Photos (optional)
                    <div className="mt-1 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3 shadow-inner">
                      <input
                        className="sr-only"
                        id="create-photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                      />
                      <label
                        htmlFor="create-photo-upload"
                        className="btn-ghost w-full max-w-xs justify-center rounded-full border border-dashed border-sky-300 bg-white text-sky-700 hover:border-sky-400 hover:bg-sky-50"
                      >
                        Add files
                      </label>
                      {imageFiles.length > 0 && (
                        <span className="text-xs font-semibold text-slate-700">
                          {imageFiles.length} selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Upload multiple images; first image becomes the cover. If none are uploaded, a cover will be generated.
                    </p>
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
            return (
              <div className="card flex h-full flex-col" key={product.id}>
                <a
                  className="relative block aspect-[5/7] max-h-80 overflow-hidden bg-slate-100"
                  href={`/products/${product.id}`}
                >
                  <img
                    src={
                      Array.isArray(product.images) && product.images.length
                        ? product.images[0]
                        : product.image
                    }
                    alt={product.name}
                    className="h-full w-full object-contain p-3 transition duration-300 hover:scale-105"
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
                    <AddToCartButton
                      productId={product.id}
                      redirect="/products"
                      className="btn-primary w-full justify-center"
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
