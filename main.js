require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { User, Cart, Product } = require("./database/db");
const publicDir = path.join(__dirname, "public");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(publicDir));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "portal-cart-secret",
    resave: false,
    saveUninitialized: false,
  })
);

const renderWithMessage = (
  res,
  view,
  message = "",
  isError = false,
  extras = {}
) => {
  res.render(view, { message, isError, ...extras });
};

const requireAuth = (req, res, next) => {
  if (req.session?.userId) {
    return next();
  }
  return res.redirect("/login");
};

const getCartForUser = async (userId) => {
  let cart = await Cart.findOne({ userId }).exec();
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

const cartTotals = (cartDoc) => {
  const subtotal = cartDoc.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = Number((subtotal * 0.07).toFixed(2));
  const grandTotal = Number((subtotal + tax).toFixed(2));
  return { subtotal, tax, grandTotal };
};

const mapProduct = (doc) => {
  if (!doc) return null;
  return {
    ...doc,
    id: doc.slug,
  };
};

const fetchProducts = async () => {
  const rows = await Product.find().sort({ name: 1 }).lean();
  return rows.map(mapProduct);
};

const fetchProductBySlug = async (slug) => {
  const doc = await Product.findOne({ slug }).lean();
  return mapProduct(doc);
};

app.use((req, res, next) => {
  console.log(`request made to: ${req.method} ${req.url}`);
  res.locals.currentUser = req.session?.userId || null;
  next();
});

app.use(async (req, res, next) => {
  if (!req.session?.userId) {
    res.locals.cartCount = 0;
    return next();
  }

  try {
    const cart = await Cart.findOne({ userId: req.session.userId }).lean();
    res.locals.cartCount = cart
      ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;
    return next();
  } catch (error) {
    return next(error);
  }
});

const renderHome = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.session.userId }).lean();
  const totals = cart
    ? cartTotals(cart)
    : { subtotal: 0, tax: 0, grandTotal: 0 };
  const featured = await Product.find().sort({ name: 1 }).limit(3).lean();
  res.render("index", {
    featuredProducts: featured.map(mapProduct),
    totals,
  });
};

app.get("/register", (req, res) => {
  if (req.session?.userId) {
    return res.redirect("/");
  }
  renderWithMessage(res, "register", "", false, { hideNav: true });
});

app.post("/register", async (req, res) => {
  try {
    const { userid, password, confirmPassword } = req.body;
    if (!userid || !password || !confirmPassword) {
      return renderWithMessage(
        res,
        "register",
        "All fields are required.",
        true,
        {
          hideNav: true,
        }
      );
    }

    if (password !== confirmPassword) {
      return renderWithMessage(
        res,
        "register",
        "Passwords do not match.",
        true,
        {
          hideNav: true,
        }
      );
    }

    const existingUser = await User.findOne({ userid }).exec();
    if (existingUser) {
      return renderWithMessage(res, "register", "User already exists.", true, {
        hideNav: true,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ userid, password: hashedPassword });
    await user.save();

    return renderWithMessage(
      res,
      "login",
      "Registration successful. Please log in.",
      false,
      {
        hideNav: true,
      }
    );
  } catch (error) {
    console.error("Registration failed", error);
    return renderWithMessage(
      res,
      "register",
      "Server error. Please try again.",
      true,
      { hideNav: true }
    );
  }
});

app.get("/login", (req, res) => {
  if (req.session?.userId) {
    return res.redirect("/");
  }
  renderWithMessage(res, "login", "", false, { hideNav: true });
});

app.post("/login", async (req, res) => {
  try {
    const { userid, password } = req.body;
    if (!userid || !password) {
      return renderWithMessage(
        res,
        "login",
        "Both fields are required.",
        true,
        {
          hideNav: true,
        }
      );
    }

    const user = await User.findOne({ userid }).exec();
    const isValid = user && (await bcrypt.compare(password, user.password));

    if (!isValid) {
      return renderWithMessage(
        res,
        "login",
        "Invalid username or password.",
        true,
        {
          hideNav: true,
        }
      );
    }

    req.session.userId = user.userid;
    await getCartForUser(user.userid);

    return res.redirect("/");
  } catch (error) {
    console.error("Login failed", error);
    return renderWithMessage(
      res,
      "login",
      "Server error. Please try again.",
      true,
      {
        hideNav: true,
      }
    );
  }
});

app.get("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.get("/", requireAuth, renderHome);
app.get("/portal", requireAuth, (req, res) => res.redirect("/"));

app.get("/products", requireAuth, async (req, res) => {
  const products = await fetchProducts();
  res.render("products", { products });
});

app.get("/products/:productId", requireAuth, async (req, res) => {
  const product = await fetchProductBySlug(req.params.productId);
  if (!product) {
    return res.status(404).render("not-found", { resource: "Product" });
  }
  return res.render("product-detail", { product });
});

app.get("/about", requireAuth, (req, res) => {
  res.render("about");
});

app.get("/contact", requireAuth, (req, res) => {
  res.render("contact");
});

app.get("/cart", requireAuth, async (req, res) => {
  const cart = await getCartForUser(req.session.userId);
  const totals = cartTotals(cart);
  res.render("cart", { cart, totals, hideHero: true });
});

app.post("/cart/add", requireAuth, async (req, res) => {
  try {
    const { productId, quantity = 1, redirect } = req.body;
    const product = await fetchProductBySlug(productId);
    if (!product) {
      return res.status(400).render("not-found", { resource: "Product" });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const cart = await getCartForUser(req.session.userId);
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
    return res.redirect(redirect || "/cart");
  } catch (error) {
    console.error("Failed to add to cart", error);
    const cart = await getCartForUser(req.session.userId);
    return res.status(500).render("cart", {
      cart,
      totals: cartTotals(cart),
      message: "Unable to update cart right now.",
      isError: true,
      hideHero: true,
    });
  }
});

app.post("/cart/remove", requireAuth, async (req, res) => {
  const { productId } = req.body;
  const cart = await getCartForUser(req.session.userId);
  cart.items = cart.items.filter((item) => item.productId !== productId);
  await cart.save();
  res.redirect("/cart");
});

app.post("/cart/update", requireAuth, async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  const cart = await getCartForUser(req.session.userId);
  const item = cart.items.find((entry) => entry.productId === productId);

  if (!item) {
    return res.redirect("/cart");
  }

  if (qty <= 0) {
    cart.items = cart.items.filter((entry) => entry.productId !== productId);
  } else {
    item.quantity = qty;
  }

  await cart.save();
  res.redirect("/cart");
});

app.post("/cart/checkout", requireAuth, async (req, res) => {
  await Cart.deleteOne({ userId: req.session.userId });
  req.session.justCheckedOut = true;
  res.redirect("/thankyou");
});

app.get("/thankyou", requireAuth, (req, res) => {
  const justCheckedOut = req.session.justCheckedOut;
  req.session.justCheckedOut = false;
  if (!justCheckedOut) {
    return res.redirect("/");
  }
  res.render("thankyou", { justCheckedOut });
});

app.use((req, res) => {
  res.status(404).render("not-found", { resource: "Page" });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
  });
}

module.exports = app;
