import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import MessageBanner from "../../components/MessageBanner";
import { cartCount, getCartSnapshot } from "../../lib/cart";
import connectDB from "../../lib/db";
import { fetchProductBySlug } from "../../lib/products";
import { withSessionSsr } from "../../lib/session";
import { storage } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { compressImage } from "../../lib/imageCompression";

export const getServerSideProps = withSessionSsr(async ({ req, params }) => {
  if (!req.session?.userId) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const slug = params.productId;
  await connectDB();
  const product = await fetchProductBySlug(slug);
  const isAvailable = product && (!product.status || product.status === "available");
  if (!product || !isAvailable) {
    return { notFound: true };
  }

  const cart = await getCartSnapshot(req.session.userId);
  const isOwner = Boolean(
    product.ownerId && product.ownerId === req.session.userId
  );
  const isAdmin = req.session.userId === "Admin";

  return {
    props: {
      product,
      isOwner,
      isAdmin,
      currentUser: req.session.userId,
      cartCount: cartCount(cart),
    },
  };
});

export default function ProductDetail({
  product,
  isOwner,
  isAdmin,
  currentUser,
  cartCount: count,
}) {
  const router = useRouter();
  const [productState, setProductState] = useState(product);
  const [message, setMessage] = useState({ text: "", isError: false });
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [navCount, setNavCount] = useState(count);
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editForm, setEditForm] = useState({
    name: productState.name,
    price: productState.price,
    shortDescription: productState.shortDescription,
    description: productState.description,
    headline: productState.headline,
    image: productState.image,
    specs: productState.specs.join("\n"),
  });
  const uniqueSpecs = useMemo(() => {
    const seen = new Set();
    return productState.specs.filter((spec) => {
      const key = (spec || "").toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [productState.specs]);

  const handleAddToCart = async (event) => {
    event.preventDefault();
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          productId: productState.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Unable to add to cart.");
      }
      setNavCount((value) => value + 1);
      setMessage({ text: "Added to cart.", isError: false });
    } catch (error) {
      setMessage({ text: error.message, isError: true });
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setMessage({ text: "", isError: false });
    let uploadedImages = [];
    if (editImageFiles.length > 5) {
      setMessage({ text: "Please upload 5 images or fewer.", isError: true });
      return;
    }
    if (editImageFiles.length) {
      try {
        uploadedImages = [];
        for (const file of editImageFiles) {
          const compressed = await compressImage(file);
          const storageRef = ref(storage, `listings/${Date.now()}-${file.name}`);
          await uploadBytes(storageRef, compressed);
          const url = await getDownloadURL(storageRef);
          uploadedImages.push(url);
        }
      } catch (error) {
        setMessage({ text: "Image upload failed. Try again.", isError: true });
        return;
      }
    }

    try {
      const res = await fetch(`/api/products/${productState.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          ...(uploadedImages.length ? { images: uploadedImages } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to update listing.");
      }
      setProductState(data.product);
      setEditForm({
        ...editForm,
        name: data.product.name,
        price: data.product.price,
        shortDescription: data.product.shortDescription,
        description: data.product.description,
        headline: data.product.headline,
        image: data.product.image,
        specs: data.product.specs.join("\n"),
      });
      setShowEdit(false);
      setMessage({ text: "Listing updated successfully.", isError: false });
    } catch (error) {
      setMessage({ text: error.message, isError: true });
      setShowEdit(true);
    }
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    try {
      const res = await fetch(`/api/products/${productState.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to delete listing.");
      }
      router.push("/products");
    } catch (error) {
      setMessage({ text: error.message, isError: true });
    }
  };

  return (
    <Layout
      currentUser={currentUser}
      cartCount={navCount}
      title={`${productState.name} | BMCC UsedBooks Store`}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              {productState.headline}
            </p>
            <h1 className="text-3xl font-bold text-slate-900">{productState.name}</h1>
          </div>
          <Link className="btn-ghost" href="/products">
            Back to products
          </Link>
        </div>
        <MessageBanner message={message.text} isError={message.isError} />

        <div className="grid gap-6 lg:grid-cols-2 stagger-children">
          <div className="card overflow-hidden">
            <img
              src={
                (productState.images && productState.images[0]) ||
                productState.image
              }
              alt={productState.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="card card-lift space-y-4 p-6">
            <div className="flex items-center justify-between">
              <span className="badge">Used textbook</span>
              <span className="text-lg font-semibold text-slate-900">${productState.price.toFixed(2)}</span>
            </div>
            <p className="text-slate-700">{productState.description}</p>
            <div className="flex flex-wrap gap-2">
              {uniqueSpecs.map((spec) => (
                <span key={spec} className="pill">
                  {spec}
                </span>
              ))}
            </div>
            <form className="space-y-3" onSubmit={handleAddToCart}>
              <button type="submit" className="btn-primary w-full">
                Add to Cart - ${productState.price.toFixed(2)}
              </button>
            </form>
          </div>
        </div>

        {(isOwner || isAdmin) && (
          <div className="card card-lift space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                  Manage listing
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Edit or delete this book</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowEdit(true)}
                  disabled={showEdit}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-ghost border-red-500/50 text-red-700 hover:bg-red-50"
                  onClick={() => setShowDelete(true)}
                >
                  Delete
                </button>
              </div>
            </div>

            {showEdit && (
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdate}>
                <div className="space-y-3">
                  <label className="label">
                    Title
                    <input
                      className="input mt-1"
                      type="text"
                      name="name"
                      required
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
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
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm({ ...editForm, price: e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Headline
                    <input
                      className="input mt-1"
                      type="text"
                      name="headline"
                      maxLength="140"
                      required
                      value={editForm.headline}
                      onChange={(e) =>
                        setEditForm({ ...editForm, headline: e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Image URL (fallback/primary)
                    <input
                      className="input mt-1"
                      type="url"
                      name="image"
                      required
                      value={editForm.image}
                      onChange={(e) =>
                        setEditForm({ ...editForm, image: e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Upload new photos (optional)
                    <input
                      className="input mt-1"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        setEditImageFiles(Array.from(e.target.files || []))
                      }
                    />
                    <p className="text-xs text-slate-500">
                      Uploading replaces images if provided; first photo becomes the cover.
                    </p>
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
                      value={editForm.shortDescription}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          shortDescription: e.target.value,
                        })
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
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="label">
                    Specs (one per line)
                    <textarea
                      className="input mt-1 min-h-[72px]"
                      name="specs"
                      rows="3"
                      value={editForm.specs}
                      onChange={(e) =>
                        setEditForm({ ...editForm, specs: e.target.value })
                      }
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className="btn-primary">
                      Save changes
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setShowEdit(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {showDelete && (
              <form
                className="rounded-2xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700"
                onSubmit={handleDelete}
              >
                <p className="font-semibold">Delete this listing?</p>
                <p className="mt-1">
                  This will remove the book and clear it from any carts. This
                  action cannot be undone.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost border-red-500/50 text-red-700 hover:bg-red-50"
                    onClick={() => setShowDelete(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary bg-red-600 hover:bg-red-500"
                  >
                    Yes, delete it
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
