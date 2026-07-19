import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { HttpStatus, Role, AccountStatus } from "@repo/types";
import env from "../config/env.config.js";
import { prisma } from "@repo/database";

interface JwtPayload {
  userId: string;
  role: Role;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const currentUser = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!currentUser) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? "none" : "lax",
        path: "/",
      });
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User no longer exists" });
    }

    if (currentUser.accountStatus === AccountStatus.SUSPENDED) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: "Your account has been suspended" });
    }

    if (currentUser.accountStatus === AccountStatus.DELETED) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User no longer exists" });
    }

    req.user = {
      userId: currentUser.id,
      role:   currentUser.role as Role,
      email:  currentUser.email,
    };

    next();
  } catch {
    return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Invalid or expired session" });
  }
};

// Populates req.user if a valid session exists, but never rejects the
// request — for public routes that still need to know "is this visitor
// logged in" (e.g. gating a locked track) without requiring login to browse.
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) return next();

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const currentUser = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (currentUser && currentUser.accountStatus !== AccountStatus.SUSPENDED && currentUser.accountStatus !== AccountStatus.DELETED) {
      req.user = {
        userId: currentUser.id,
        role:   currentUser.role as Role,
        email:  currentUser.email,
      };
    }
  } catch {
    // Invalid/expired token on a public route — proceed as anonymous.
  }
  next();
};

export const restrictTo = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      return res.status(HttpStatus.FORBIDDEN).json({
        status: "fail",
        message: "Insufficient permissions for this operation",
      });
    }
    next();
  };
};