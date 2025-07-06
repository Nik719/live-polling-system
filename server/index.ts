import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { handleDemo } from "./routes/demo";
import { initializeSocket } from "./socket";

export function createApp() {
  const app = express();
  const httpServer = createServer(app);

  // Initialize Socket.IO with CORS for Vercel
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://*.vercel.app", "https://localhost:3000"]
          : ["http://localhost:8080", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
  });

  // Initialize polling system
  const pollManager = initializeSocket(io);

  // Middleware
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://*.vercel.app", "https://localhost:3000"]
          : ["http://localhost:8080", "http://localhost:3000"],
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Live Polling System API v1.0" });
  });

  app.get("/api/demo", handleDemo);

  // Health check for Vercel
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // Store io instance for potential use in routes
  app.set("io", io);

  return { app, httpServer, io };
}

// For Vercel serverless deployment
export default createApp;
