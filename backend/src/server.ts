import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

import aiRoutes from "./routes/ai";
import logRoutes from "./routes/logs";
import authRoutes from "./routes/auth";
import alertRoutes from "./routes/alerts";
import scannerRoutes from "./routes/scanner";
import trainingRoutes from "./routes/training";
import overviewRoutes from "./routes/overview";
import { liveThreatInterceptor } from "./middlewares/liveThreatInterceptor";
import { requireAuth } from "./middlewares/auth";
import connectDB from "./config/db";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set.");
  process.exit(1);
}

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", false);

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(liveThreatInterceptor);

app.use("/api/auth", authRoutes);
app.use("/api/ai", requireAuth, aiRoutes);
app.use("/api/logs", requireAuth, logRoutes);
app.use("/api/alerts", requireAuth, alertRoutes);
app.use("/api/scanner", requireAuth, scannerRoutes);
app.use("/api/training", requireAuth, trainingRoutes);
app.use("/api/overview", requireAuth, overviewRoutes);

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "operational",
    service: "Aegis AI API",
    timestamp: new Date().toISOString(),
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

interface AppError extends Error {
  statusCode?: number;
}

app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  console.error(`[ERROR] ${err.message}`);
  const isProduction = process.env.NODE_ENV === "production";
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message: isProduction && statusCode === 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error",
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

app.set("io", io);

io.use((socket, next) => {
  const cookieHeader = socket.request.headers.cookie;
  if (!cookieHeader) {
    return next(new Error("Authentication required"));
  }
  try {
    const cookies = cookie.parse(cookieHeader);
    const token = cookies.aegis_token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  if (socket.data.role === "admin" || socket.data.role === "analyst") {
    socket.join("secure_alerts");
  }

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n⚡ Aegis AI Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Socket.io: Ready for connections\n`);
});

export default app;
