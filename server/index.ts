import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { handleDemo } from "./routes/demo";
import { initializeSocket } from "./socket";

// Increase the HTTP server timeout for WebSocket connections
const KEEP_ALIVE_TIMEOUT = 120000; // 2 minutes

export function createApp() {
  const app = express();
  const httpServer = createServer(app);
  
  // Configure server timeouts for WebSocket support
  httpServer.keepAliveTimeout = KEEP_ALIVE_TIMEOUT;
  httpServer.headersTimeout = KEEP_ALIVE_TIMEOUT + 1000;

  // Initialize Socket.IO with flexible CORS settings
  const io = new SocketIOServer(httpServer, {
    cors: {
      // Allow all origins in development, check origin in production
      origin: (origin, callback) => {
        // In development, allow all origins for easier testing
        if (process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        
        // In production, check against the request origin
        if (!origin || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
          return callback(null, true);
        }
        
        // Reject all other origins
        callback(new Error('Not allowed by CORS'));
      },
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    // Enable both WebSocket and HTTP long-polling
    transports: ["websocket", "polling"],
    // Use the standard Socket.IO path
    path: "/socket.io/",
    // Don't serve the client files (they're served by Vite)
    serveClient: false
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
