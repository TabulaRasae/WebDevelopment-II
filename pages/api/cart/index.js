import connectDB from "../../../lib/db";
import { cartTotals, getCartForUser, getCartSnapshot } from "../../../lib/cart";
import { fetchProductBySlug } from "../../../lib/products";
import { getUserId, withSessionRoute } from "../../../lib/session";
import Cart from "../../../database/models/Cart";
import Order from "../../../database/models/Order";
import Product from "../../../database/models/Product";
import { withCors } from "../../../lib/cors";

async function cartRoute(req, res) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Login required." });
  }

  if (req.method === "GET") {
    await connectDB();
    const cart = await getCartSnapshot(userId);
    return res.status(200).json({ cart, totals: cartTotals(cart) });
  }

  const action = req.body?.action;

  if (req.method === "POST" && action === "add") {
    const { productId, quantity = 1 } = req.body || {};
    if (!productId) {
      return res.status(400).json({ message: "Missing product id." });
    }
    const product = await fetchProductBySlug(productId);
    const isAvailable =
      product && (!product.status || product.status === "available");
    if (!product || !isAvailable) {
      return res.status(404).json({ message: "Product not available." });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const cart = await getCartForUser(userId);
    const existing = cart.items.find((item) => item.productId === productId);

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity: qty,
      });
    }

    await cart.save();
    return res.status(200).json({
      ok: true,
      cart: cart.toObject(),
      totals: cartTotals(cart),
    });
  }

  if (req.method === "POST" && action === "update") {
    const { productId, quantity } = req.body || {};
    if (!productId) {
      return res.status(400).json({ message: "Missing product id." });
    }

    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const cart = await getCartForUser(userId);
    const item = cart.items.find((entry) => entry.productId === productId);

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart." });
    }

    if (qty <= 0) {
      cart.items = cart.items.filter((entry) => entry.productId !== productId);
    } else {
      item.quantity = qty;
    }

    await cart.save();
    return res.status(200).json({
      ok: true,
      cart: cart.toObject(),
      totals: cartTotals(cart),
    });
  }

  if (req.method === "POST" && action === "remove") {
    const { productId } = req.body || {};
    if (!productId) {
      return res.status(400).json({ message: "Missing product id." });
    }

    const cart = await getCartForUser(userId);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    await cart.save();

    return res.status(200).json({
      ok: true,
      cart: cart.toObject(),
      totals: cartTotals(cart),
    });
  }

  if (req.method === "POST" && action === "checkout") {
    await connectDB();
    const cart = await getCartForUser(userId);
    if (!cart.items.length) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const totals = cartTotals(cart);
    const order = await Order.create({
      userId,
      items: cart.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.grandTotal,
      status: "paid",
    });

    // Mark purchased listings as sold so they disappear from catalog
    const productIds = cart.items.map((item) => item.productId);
    await Product.updateMany(
      { slug: { $in: productIds } },
      { $set: { status: "sold", soldAt: new Date() } }
    );
    // Remove sold items from all carts
    await Cart.updateMany({}, { $pull: { items: { productId: { $in: productIds } } } });

    cart.items = [];
    await cart.save();

    req.session.justCheckedOut = true;
    await req.session.save();
    return res.status(200).json({ ok: true, orderId: order._id?.toString() });
  }

  return res.status(405).json({ message: "Unsupported action." });
}

export default withCors(withSessionRoute(cartRoute));
