import { useRouter } from "next/router";
import { useState } from "react";

export default function AddToCartButton({
  productId,
  quantity = 1,
  redirect = "/cart",
  className = "btn-primary",
  children = "Add to Cart",
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", productId, quantity }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Unable to add to cart.");
      }
      if (redirect) {
        router.push(redirect);
      }
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleAdd}
      disabled={loading}
    >
      {loading ? "Adding..." : children}
    </button>
  );
}
