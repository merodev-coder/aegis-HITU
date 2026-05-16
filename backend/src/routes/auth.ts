import { Router, Request, Response } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import User from "../models/User";

const router = Router();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is not set.");
  }
  return secret;
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket.remoteAddress || "unknown";
    return ip;
  },
});

const buildResetPasswordEmailTemplate = (resetUrl: string, userEmail: string): string => {
  return `
  <div style="margin:0;padding:0;background:#07090d;font-family:Arial,sans-serif;color:#e5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#07090d;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0f141d;border:1px solid rgba(0,212,195,0.25);border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <h1 style="margin:0;color:#00d4c3;font-size:24px;font-weight:700;">Aegis AI</h1>
                <p style="margin:8px 0 0;color:#9fb4c0;font-size:14px;">Password Reset Request</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#d9e9ee;">
                  We received a request to reset the password for <strong style="color:#ffffff;">${userEmail}</strong>.
                </p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#d9e9ee;">
                  Click the secure button below to continue. This link is valid for <strong>1 hour</strong>.
                </p>
                <a href="${resetUrl}" style="display:inline-block;background:#00d4c3;color:#071218;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">
                  Reset Password
                </a>
                <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#9fb4c0;">
                  If the button does not work, copy and paste this URL into your browser:
                </p>
                <p style="margin:8px 0 0;font-size:12px;word-break:break-all;color:#74f0e4;">${resetUrl}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#7e8f98;">
                If you did not request this, you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
};

router.post("/register", authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (typeof email !== "string" || typeof password !== "string" || typeof fullName !== "string") {
      res.status(400).json({ error: "Invalid input types" });
      return;
    }

    const sanitizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      res.status(400).json({ error: "User already exists with that email" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email: sanitizedEmail,
      passwordHash,
      fullName: fullName.trim(),
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      getJwtSecret(),
      { expiresIn: "1d" }
    );

    res.cookie("aegis_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("[Auth Register Error]", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/login", authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Invalid input types" });
      return;
    }

    const sanitizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      getJwtSecret(),
      { expiresIn: "1d" }
    );

    res.cookie("aegis_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[Auth Login Error]", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

router.post("/forgot-password", authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    if (typeof email !== "string") {
      res.status(400).json({ error: "Invalid input type" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Generic response to avoid email enumeration
    if (!user) {
      res.status(200).json({ message: "If that email exists, a reset link has been sent." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      res.status(500).json({ error: "Email service is not configured. Missing Gmail credentials." });
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `Aegis AI Security <${gmailUser}>`,
      to: user.email,
      subject: "Aegis AI Password Reset",
      html: buildResetPasswordEmailTemplate(resetUrl, user.email),
    });

    res.status(200).json({ message: "If that email exists, a reset link has been sent." });
  } catch (error: any) {
    console.error("[Forgot Password Error]", error);
    res.status(500).json({ error: "Failed to process forgot password request" });
  }
});

router.post("/reset-password", authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: "Token and new password are required" });
      return;
    }

    if (typeof token !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Invalid input types" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: "Invalid or expired password reset token" });
      return;
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful. You can now log in." });
  } catch (error: any) {
    console.error("[Reset Password Error]", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("aegis_token", { path: "/", httpOnly: true, secure: true, sameSite: "none" });
  res.status(200).json({ message: "Logged out successfully" });
});

router.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const user = await User.findById(authReq.userId).select("-passwordHash");
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[Auth Me Error]", error);
    res.status(500).json({ error: "Failed to fetch user session" });
  }
});

router.get("/ws-token", (req: Request, res: Response) => {
  const token = req.cookies?.aegis_token;
  if (!token || typeof token !== "string") {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; role: string };
    const wsToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      getJwtSecret(),
      { expiresIn: "30s" }
    );
    res.status(200).json({ wsToken });
  } catch {
    res.status(401).json({ error: "Invalid session" });
  }
});

export default router;
