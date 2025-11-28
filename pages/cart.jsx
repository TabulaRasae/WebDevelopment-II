import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import MessageBanner from "../components/MessageBanner";
import { cartCount, cartTotals, getCartSnapshot } from "../lib/cart";
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
      cart,
      totals: cartTotals(cart),
      currentUser: req.session.userId,
      cartCount: cartCount(cart),
    },
  };
});

export default function Cart({
  cart,
  totals,
  currentUser,
  cartCount: count,
}) {
  const router = useRouter();
  const [cartState, setCartState] = useState(cart);
  const [totalsState, setTotalsState] = useState(totals);
  const [banner, setBanner] = useState({ message: "", isError: false });
  const [navCount, setNavCount] = useState(count);

  useEffect(() => {
    const newCount = (cartState.items || []).reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    setNavCount(newCount);
  }, [cartState]);

  const handleUpdate = async (productId, quantity) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to update cart.");
      }
      setCartState(data.cart);
      setTotalsState(data.totals);
      setBanner({ message: "Cart updated.", isError: false });
    } catch (error) {
      setBanner({ message: error.message, isError: true });
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to remove item.");
      }
      setCartState(data.cart);
      setTotalsState(data.totals);
      setBanner({ message: "Item removed.", isError: false });
    } catch (error) {
      setBanner({ message: error.message, isError: true });
    }
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Checkout failed.");
      }
      router.push("/thankyou");
    } catch (error) {
      setBanner({ message: error.message, isError: true });
    }
  };

  return (
    <Layout
      currentUser={currentUser}
      cartCount={navCount}
      hideHero
      title="Your Cart | BMCC UsedBooks Store"
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
            Shopping cart
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Your items</h1>
        </div>
        <MessageBanner message={banner.message} isError={banner.isError} />
        {cartState.items.length === 0 ? (
          <p className="text-slate-600">
            Your cart is empty. Browse the{" "}
            <Link href="/products" className="text-sky-700 underline">
              catalog
            </Link>{" "}
            to add items.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-3 stagger-children">
              {cartState.items.map((item) => (
                <div
                  key={item.productId}
                  className="card card-lift flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-lg font-semibold text-slate-900 leading-tight line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-slate-600">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const qty = e.target.quantity.value;
                        handleUpdate(item.productId, qty);
                      }}
                    >
                      <input type="hidden" name="productId" value={item.productId} />
                      <input
                        className="input w-24"
                        type="number"
                        name="quantity"
                        min="0"
                        defaultValue={item.quantity}
                      />
                      <button type="submit" className="btn-ghost">
                        Update
                      </button>
                    </form>
                    <p className="font-semibold text-slate-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      type="button"
                      className="btn-ghost border-red-500/50 text-red-700 hover:bg-red-50"
                      onClick={() => handleRemove(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="card card-lift flex h-full flex-col space-y-3 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
              <div className="space-y-1 text-sm text-slate-700">
                <p>Subtotal: ${totalsState.subtotal.toFixed(2)}</p>
                <p>Tax: ${totalsState.tax.toFixed(2)}</p>
                <p className="font-semibold text-slate-900">
                  Grand Total: ${totalsState.grandTotal.toFixed(2)}
                </p>
              </div>
              <form onSubmit={handleCheckout}>
                <button type="submit" className="btn-primary mt-auto w-full">
                  Checkout
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
