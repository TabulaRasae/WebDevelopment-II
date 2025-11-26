import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";

const sessionPassword =
  process.env.SESSION_SECRET ||
  "portal-cart-secret-please-change-me-32chars";

export const sessionOptions = {
  password: sessionPassword,
  cookieName: "portal_cart_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export function withSessionRoute(handler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

export function withSessionSsr(handler) {
  return withIronSessionSsr(handler, sessionOptions);
}

export function getUserId(req) {
  return req.session?.userId || null;
}
