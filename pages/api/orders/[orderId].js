import connectDB from "../../../lib/db";
import Order from "../../../database/models/Order";
import { getUserId, withSessionRoute } from "../../../lib/session";
import { withCors } from "../../../lib/cors";

async function orderRoute(req, res) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Login required." });
  }

  const { orderId } = req.query;
  if (!orderId) {
    return res.status(400).json({ message: "Missing order id." });
  }

  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found." });

  // Admin-only for refunds in this simple flow
  const isAdmin = userId === "Admin";
  if (!isAdmin) {
    return res.status(403).json({ message: "Not authorized." });
  }

  if (req.method === "POST" && req.body?.action === "refund") {
    order.status = "refunded";
    order.refundedAt = new Date();
    await order.save();
    return res.status(200).json({ ok: true, order: order.toObject() });
  }

  return res.status(405).json({ message: "Unsupported action." });
}

export default withCors(withSessionRoute(orderRoute));
