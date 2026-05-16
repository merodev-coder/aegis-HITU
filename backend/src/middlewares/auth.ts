import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is not set.");
  }
  return secret;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.aegis_token;
  if (!token || typeof token !== "string") {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      role: string;
    };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.userRole || !allowedRoles.includes(authReq.userRole)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
};
