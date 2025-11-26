import connectDB from "./db";
import Product from "../database/models/Product";
import Cart from "../database/models/Cart";

export const mapProduct = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    _id: obj._id?.toString ? obj._id.toString() : obj._id,
    id: obj.slug,
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : undefined,
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : undefined,
  };
};

export const parseSpecs = (value = "") =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export const slugify = (text) => {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `book-${Date.now()}`
  );
};

export const uniqueSlugForName = async (name) => {
  await connectDB();
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Product.exists({ slug })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
};

export const fetchProducts = async () => {
  await connectDB();
  const rows = await Product.find().sort({ name: 1 }).lean();
  return rows.map(mapProduct);
};

export const fetchProductBySlug = async (slug) => {
  await connectDB();
  const doc = await Product.findOne({ slug }).lean();
  return mapProduct(doc);
};

export const createProduct = async (payload) => {
  await connectDB();
  const slug = await uniqueSlugForName(payload.name);
  const doc = await Product.create({
    ...payload,
    slug,
  });
  return mapProduct(doc);
};

export const updateProduct = async (slug, update) => {
  await connectDB();
  const updated = await Product.findOneAndUpdate(
    { slug },
    { $set: update },
    { new: true, lean: true }
  );
  return mapProduct(updated);
};

export const deleteProduct = async (slug) => {
  await connectDB();
  await Product.deleteOne({ slug });
  await Cart.updateMany({}, { $pull: { items: { productId: slug } } });
};
