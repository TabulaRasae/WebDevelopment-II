import Link from "next/link";
import AddToCartButton from "./AddToCartButton";

export default function ProductCard({ product, redirectOnAdd = "/cart" }) {
  return (
    <div className="card card-lift reveal-up flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 badge">Used textbook</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {product.shortDescription}
          </p>
        </div>
        <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
          <span>${product.price.toFixed(2)}</span>
          <Link
            className="text-accent-100 underline decoration-accent-500"
            href={`/products/${product.id}`}
          >
            Details
          </Link>
        </div>
        <AddToCartButton
          productId={product.id}
          quantity={1}
          redirect={redirectOnAdd}
        />
      </div>
    </div>
  );
}
