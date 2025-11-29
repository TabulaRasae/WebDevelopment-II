import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    headline: { type: String, required: true },
    specs: [{ type: String }],
    image: { type: String, required: true },
    images: [{ type: String }],
    ownerId: { type: String, default: null },
    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
    },
    soldAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.product || mongoose.model("product", productSchema);

export default Product;
