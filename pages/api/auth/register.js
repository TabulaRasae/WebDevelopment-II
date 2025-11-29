import bcrypt from "bcryptjs";
import connectDB from "../../../lib/db";
import { withSessionRoute } from "../../../lib/session";
import User from "../../../database/models/User";
import { withCors } from "../../../lib/cors";

async function registerRoute(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userid, password, confirmPassword } = req.body || {};

  if (!userid || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  await connectDB();
  const existingUser = await User.findOne({ userid }).lean();
  if (existingUser) {
    return res.status(409).json({ message: "User already exists." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ userid, password: hashedPassword });

  return res.status(200).json({
    ok: true,
    message: "Registration successful. Please log in.",
  });
}

export default withCors(withSessionRoute(registerRoute));
