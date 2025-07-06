import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

// Simple Express server for development (without Socket.IO)
// Socket.IO will be added in production or when specifically needed
export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Live Polling System API v1.0 - Dev Mode" });
  });

  app.get("/api/demo", handleDemo);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      mode: "development",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  return app;
}
