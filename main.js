const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/cis485", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
});

const loginSchema = new mongoose.Schema({
    userid: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model("login", loginSchema);

const renderWithMessage = (res, view, message, isError = false) => {
    res.render(view, { message, isError });
};

app.use((req, res, next) => {
    console.log(`request made to: ${req.method} ${req.url}`);
    next();
});

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/register", (req, res) => {
    renderWithMessage(res, "register", "");
});

app.post("/register", async (req, res) => {
    try {
        const { userid, password, confirmPassword } = req.body;
        if (!userid || !password || !confirmPassword) {
            return renderWithMessage(res, "register", "All fields are required.", true);
        }

        if (password !== confirmPassword) {
            return renderWithMessage(res, "register", "Passwords do not match.", true);
        }

        const existingUser = await User.findOne({ userid }).exec();
        if (existingUser) {
            return renderWithMessage(res, "register", "ERROR: User already exists.", true);
        }

        const user = new User({ userid, password });
        await user.save();

        renderWithMessage(res, "register", "Registration successful!", false);
    } catch (error) {
        console.error("Registration failed", error);
        renderWithMessage(res, "register", "Server error. Please try again.", true);
    }
});

app.get("/login", (req, res) => {
    renderWithMessage(res, "login", "");
});

app.post("/login", async (req, res) => {
    try {
        const { userid, password } = req.body;
        if (!userid || !password) {
            return renderWithMessage(res, "login", "Both fields are required.", true);
        }

        const user = await User.findOne({ userid, password }).exec();
        if (!user) {
            return renderWithMessage(res, "login", "Invalid username or password.", true);
        }

        renderWithMessage(res, "login", "Login successful!", false);
    } catch (error) {
        console.error("Login failed", error);
        renderWithMessage(res, "login", "Server error. Please try again.", true);
    }
});

const staticViews = [
    "about",
    "products",
    "single",
    "sony",
    "samsung",
    "panasonic",
];

staticViews.forEach((viewName) => {
    app.get(`/${viewName}`, (req, res) => {
        res.render(viewName);
    });
});

app.use((req, res) => {
    res.status(404).render("index", {
        message: "Page not found.",
        isError: true,
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
});