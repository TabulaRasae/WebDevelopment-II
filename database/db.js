const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cis485", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo connection failed", err));

const loginSchema = new mongoose.Schema({
  userid: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, min: 1, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

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
  },
  { timestamps: true }
);

const User = mongoose.model("login", loginSchema);
const Cart = mongoose.model("cart", cartSchema);
const Product = mongoose.model("product", productSchema);

module.exports = { mongoose, User, Cart, Product };
