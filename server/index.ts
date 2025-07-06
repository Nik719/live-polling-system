import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { handleDemo } from "./routes/demo";
import { initializeSocket } from "./socket";

export function createApp() {
  const app = express();
  const httpServer = createServer(app);

  // CORS configuration
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [
        'https://live-polling-system.vercel.app',
        'https://live-polling-system-*.vercel.app',
        'http://localhost:8080',
        'http://localhost:3000',
        'http://localhost:3001'
      ];
      
      if (!origin || allowedOrigins.some(allowed => 
        origin === allowed || 
        origin.endsWith('.vercel.app') ||
        (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'))
      )) {
        callback(null, true);
      } else {
        console.log('Blocked CORS for origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };

  // Initialize Socket.IO with CORS
  const io = new SocketIOServer(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: false
  });
  
  // Handle WebSocket connection errors
  io.engine.on('connection_error', (err) => {
    console.error('WebSocket connection error:', err);
  });

  // Initialize polling system
  const pollManager = initializeSocket(io);

  // Apply CORS middleware for HTTP requests
  app.use(cors(corsOptions));
  
  // Handle preflight requests
  app.options('*', cors(corsOptions));
  
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Log all incoming requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

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
