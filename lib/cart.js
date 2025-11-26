import connectDB from "./db";
import Cart from "../database/models/Cart";

const toIso = (value) => (value ? new Date(value).toISOString() : undefined);

export const cartTotals = (cartDoc) => {
  const items = cartDoc?.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = Number((subtotal * 0.07).toFixed(2));
  const grandTotal = Number((subtotal + tax).toFixed(2));
  return { subtotal, tax, grandTotal };
};

export const cartCount = (cartDoc) =>
  (cartDoc?.items || []).reduce((sum, item) => sum + item.quantity, 0);

export const serializeCart = (cartDoc) => {
  if (!cartDoc) return { userId: null, items: [] };
  const items = (cartDoc.items || []).map((item) => ({
    ...item,
    _id: item._id?.toString ? item._id.toString() : item._id,
  }));
  return {
    ...cartDoc,
    _id: cartDoc._id?.toString ? cartDoc._id.toString() : cartDoc._id,
    createdAt: toIso(cartDoc.createdAt),
    updatedAt: toIso(cartDoc.updatedAt),
    items,
  };
};

export const getCartForUser = async (userId) => {
  await connectDB();
  let cart = await Cart.findOne({ userId }).exec();
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

export const getCartSnapshot = async (userId) => {
  await connectDB();
  const cart = await Cart.findOne({ userId }).lean();
  return serializeCart(cart || { userId, items: [] });
};
