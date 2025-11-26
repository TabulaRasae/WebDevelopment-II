import connectDB from "../../../lib/db";
import {
  createProduct,
  fetchProducts,
  parseSpecs,
} from "../../../lib/products";
import { getUserId, withSessionRoute } from "../../../lib/session";

async function productsRoute(req, res) {
  if (req.method === "GET") {
    await connectDB();
    const products = await fetchProducts();
    return res.status(200).json({ products });
  }

  if (req.method === "POST") {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Login required." });
    }

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
        message: "All fields are required to create a listing.",
      });
    }

    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      return res.status(400).json({
        message: "Price must be a positive number.",
      });
    }

    const product = await createProduct({
      name: name.trim(),
      price: priceNumber,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      headline: headline.trim(),
      image: image.trim(),
      specs: parseSpecs(specs),
      ownerId: userId,
    });

    return res.status(200).json({ ok: true, product });
  }

  return res.status(405).json({ message: "Method not allowed" });
}

export default withSessionRoute(productsRoute);
