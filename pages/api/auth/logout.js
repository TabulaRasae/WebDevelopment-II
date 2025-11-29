import { withSessionRoute } from "../../../lib/session";
import { withCors } from "../../../lib/cors";

async function logoutRoute(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  req.session.destroy();
  return res.status(200).json({ ok: true });
}

export default withCors(withSessionRoute(logoutRoute));
