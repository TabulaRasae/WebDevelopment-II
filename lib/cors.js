const normalizeOrigin = (value = "") => {
  if (!value) return "";
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
};

const envOrigins = (process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const vercelOrigin = normalizeOrigin(
  process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL
);

const localhostOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].map(normalizeOrigin);

const allowedOrigins = Array.from(
  new Set([...envOrigins, vercelOrigin, ...localhostOrigins].filter(Boolean))
);

export const getAllowedOrigin = (originHeader = "") => {
  const origin = normalizeOrigin(originHeader);
  if (!origin) return "";
  const match = allowedOrigins.find(
    (allowed) => allowed.toLowerCase() === origin.toLowerCase()
  );
  return match || "";
};

export const withCors =
  (handler, { allowCredentials = true } = {}) =>
  async (req, res) => {
    const originHeader = req.headers.origin || "";
    const allowedOrigin = getAllowedOrigin(originHeader);
    const allowHeaders =
      req.headers["access-control-request-headers"] ||
      "Content-Type, Authorization";

    if (allowedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      res.setHeader("Vary", "Origin");
      res.setHeader(
        "Access-Control-Allow-Credentials",
        allowCredentials ? "true" : "false"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
      );
      res.setHeader("Access-Control-Allow-Headers", allowHeaders);
    }

    if (req.method === "OPTIONS") {
      return res.status(allowedOrigin ? 200 : 403).end();
    }

    if (originHeader && !allowedOrigin) {
      return res.status(403).json({ message: "Origin not allowed." });
    }

    return handler(req, res);
  };

