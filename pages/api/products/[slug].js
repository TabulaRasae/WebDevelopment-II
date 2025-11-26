import connectDB from "../../../lib/db";
import {
  deleteProduct,
  fetchProductBySlug,
  parseSpecs,
  updateProduct,
} from "../../../lib/products";
import { getUserId, withSessionRoute } from "../../../lib/session";

async function productRoute(req, res) {
  const { slug } = req.query;

  if (!slug || Array.isArray(slug)) {
    return res.status(400).json({ message: "Missing slug." });
  }

  if (req.method === "GET") {
    await connectDB();
    const product = await fetchProductBySlug(slug);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    return res.status(200).json({ product });
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Login required." });
  }

  await connectDB();
  const product = await fetchProductBySlug(slug);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const isOwner = product.ownerId && product.ownerId === userId;
  const isAdmin = userId === "Admin";

  if (!isOwner && !isAdmin) {
    return res
      .status(403)
      .json({ message: "You can only modify listings you created." });
  }

  if (req.method === "PUT") {
    const {
      name,
      price,
      shortDescription,
      description,
      headline,
      image,
      specs,
    } = req.body || {};

    if (
      !name ||
      !price ||
      !shortDescription ||
      !description ||
      !headline ||
      !image
    ) {
      return res.status(400).json({
        message: "All fields are required to update this listing.",
      });
    }

    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      return res.status(400).json({
        message: "Price must be a positive number.",
      });
    }

    const updated = await updateProduct(slug, {
      name: name.trim(),
      price: priceNumber,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      headline: headline.trim(),
      image: image.trim(),
      specs: parseSpecs(specs),
    });

    return res.status(200).json({ ok: true, product: updated });
  }

  if (req.method === "DELETE") {
    await deleteProduct(slug);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ message: "Method not allowed" });
}

export default withSessionRoute(productRoute);
