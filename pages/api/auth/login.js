import bcrypt from "bcryptjs";
import connectDB from "../../../lib/db";
import { getCartForUser } from "../../../lib/cart";
import { withSessionRoute } from "../../../lib/session";
import User from "../../../database/models/User";

async function loginRoute(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userid, password } = req.body || {};

  if (!userid || !password) {
    return res.status(400).json({ message: "Both fields are required." });
  }

  await connectDB();
  const user = await User.findOne({ userid }).exec();
  const isValid = user && (await bcrypt.compare(password, user.password));

  if (!isValid) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  req.session.userId = user.userid;
  await req.session.save();
  await getCartForUser(user.userid);

  return res.status(200).json({ ok: true, userId: user.userid });
}

export default withSessionRoute(loginRoute);
