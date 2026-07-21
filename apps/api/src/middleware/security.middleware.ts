import rateLimit from "express-rate-limit";
import { HttpStatus } from "@repo/types";

const isProduction = process.env.NODE_ENV === "production";

// Brute-force protection for /login, /register, and the Google OAuth routes —
// 20 attempts per 15 minutes per IP in production. Relaxed (effectively off)
// outside production so repeated manual testing doesn't get locked out —
// this is environment-driven on purpose, so there's nothing to remember to
// re-tighten before launch.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 1000,
  message: { status: "fail", message: "Too many attempts from this IP, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global API protection — 1000 requests per hour per IP
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Too many requests from this IP, please try again in an hour." },
});
