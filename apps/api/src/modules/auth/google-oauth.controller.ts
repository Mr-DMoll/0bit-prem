import { Request, Response } from "express";
import axios from "axios";
import https from "node:https";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { AppError }    from "../../utils/appError.js";
import { AuthService } from "./auth.service.js";
import env from "../../config/env.config.js";

// Force IPv4 — WSL2 Happy Eyeballs times out on IPv6 for Google APIs
const ipv4Agent = new https.Agent({ family: 4 });

const ROLE_ROUTES: Record<string, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN:       "/admin",
  MANAGER:     "/manager",
  USER:        "/",
};

const authService = new AuthService();

const GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USER_URL  = "https://www.googleapis.com/oauth2/v2/userinfo";

function callbackUrl() {
  return `${env.API_URL}/api/v1/auth/google/callback`;
}

// ── Step 1: redirect to Google ────────────────────────────────────────────────

export function googleRedirect(req: Request, res: Response) {
  if (!env.GOOGLE_CLIENT_ID) {
    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      status: "fail", message: "Google OAuth is not configured",
    });
    return;
  }

  // "state" round-trips through Google unchanged — used to tell the staff
  // flow (invite-only, never auto-creates) apart from the customer flow
  // (open self-signup) on the shared callback, without needing a second
  // OAuth client or redirect URI registered with Google.
  const isStaffFlow = req.query.flow === "staff";

  const params = new URLSearchParams({
    client_id:     env.GOOGLE_CLIENT_ID,
    redirect_uri:  callbackUrl(),
    response_type: "code",
    scope:         "openid email profile",
    access_type:   "offline",
    prompt:        "select_account",
    ...(isStaffFlow ? { state: "staff" } : {}),
  });

  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

// ── Step 2: handle callback ────────────────────────────────────────────────────

export async function googleCallback(req: Request, res: Response) {
  const { code, error, state } = req.query as Record<string, string>;
  const isStaffFlow = state === "staff";
  // Staff has a dedicated /staff-login page with an `error` query the page reads directly.
  // Customers have no standalone login page — sign-in happens in-layout from any page via
  // AccountHeaderWidget, so failures redirect home with `authError`, which that widget reads.
  const errorRedirect = (errCode: string) =>
    isStaffFlow
      ? `${env.FRONTEND_URL}/staff-login?error=${errCode}`
      : `${env.FRONTEND_URL}/?authError=${errCode}`;

  if (error || !code) {
    return res.redirect(errorRedirect("google_denied"));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await axios.post<{ access_token: string; refresh_token?: string }>(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        code,
        client_id:     env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  callbackUrl(),
        grant_type:    "authorization_code",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, httpsAgent: ipv4Agent },
    );
    const tokens = tokenRes.data;

    // Fetch Google user profile
    const profileRes = await axios.get<{
      id:             string;
      email:          string;
      given_name?:    string;
      family_name?:   string;
      picture?:       string;
      verified_email: boolean;
    }>(GOOGLE_USER_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      httpsAgent: ipv4Agent,
    });
    const profile = profileRes.data;

    if (!profile.email) {
      return res.redirect(errorRedirect("google_no_email"));
    }

    // Upsert user: find by googleId → find by email → create
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id },
    });

    if (!user) {
      const existing = await prisma.user.findUnique({
        where: { email: profile.email.toLowerCase() },
      });

      if (existing) {
        // Staff sign-in must already be an invited ADMIN/MANAGER/SUPER_ADMIN
        // account — a customer (role USER) trying the staff path is rejected,
        // never silently promoted.
        if (isStaffFlow && existing.role === "USER") {
          return res.redirect(`${env.FRONTEND_URL}/staff-login?error=not_staff`);
        }

        // Link existing account to Google
        user = await prisma.user.update({
          where: { id: existing.id },
          data:  {
            googleId:           profile.id,
            googleRefreshToken: tokens.refresh_token ?? null,
            avatarUrl:          existing.avatarUrl || profile.picture || null,
            accountStatus:      existing.accountStatus === "PENDING" ? "ACTIVE" : existing.accountStatus,
          },
        });
      } else if (isStaffFlow) {
        // Staff accounts are never auto-created — they must already exist
        // via an admin/super-admin invite.
        return res.redirect(`${env.FRONTEND_URL}/staff-login?error=not_invited`);
      } else {
        // Brand-new user via Google — always allowed with USER role
        user = await prisma.user.create({
          data: {
            email:              profile.email.toLowerCase(),
            password:           "",
            role:               "USER",
            accountStatus:      "ACTIVE",
            firstName:          profile.given_name  ?? null,
            lastName:           profile.family_name ?? null,
            googleId:           profile.id,
            googleRefreshToken: tokens.refresh_token ?? null,
            avatarUrl:          profile.picture ?? null,
          },
        });

        await prisma.auditLog.create({
          data: { userId: user.id, action: "REGISTERED_GOOGLE" },
        });
      }
    } else {
      // Refresh token if provided
      if (tokens.refresh_token) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { googleRefreshToken: tokens.refresh_token },
        });
      }
    }

    if (user.accountStatus === "SUSPENDED") {
      return res.redirect(errorRedirect("suspended"));
    }
    if (user.accountStatus === "DELETED") {
      return res.redirect(errorRedirect("not_found"));
    }

    await prisma.user.update({
      where: { id: user.id },
      data:  { lastActiveAt: new Date() },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: "LOGIN_GOOGLE", ip: req.ip ?? null },
    });

    const jwt = authService.generateToken(user.id, user.role);
    const rolePath = ROLE_ROUTES[user.role] ?? "/";

    res.redirect(
      `${env.FRONTEND_URL}/oauth/callback?token=${jwt}&to=${encodeURIComponent(rolePath)}`
    );
  } catch (err) {
    console.error("[Google OAuth] callback error:", err);
    res.redirect(errorRedirect("oauth_failed"));
  }
}
