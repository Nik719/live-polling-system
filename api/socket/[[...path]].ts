import { VercelRequest, VercelResponse } from '@vercel/node';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';

// Extend the NodeJS namespace to include our custom properties
declare global {
  namespace NodeJS {
    interface Global {
      io: Server | null;
    }
  }
}

// Initialize socket.io server if it doesn't exist
if (!global.io) {
  console.log('Initializing Socket.IO server...');
  
  const httpServer = createServer();
  
  global.io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: [
        'https://live-polling-system.vercel.app',
        'https://live-polling-system-*.vercel.app',
        'http://localhost:3000',
        'http://localhost:8080'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Handle connections
  global.io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
    
    // Forward all events to other clients
    const forwardEvent = (event: string, ...args: any[]) => {
      socket.broadcast.emit(event, ...args);
    };
    
    // Listen for events from clients
    socket.onAny(forwardEvent);
  });
  
  // Start the server on a random available port
  httpServer.listen(0, () => {
    const address = httpServer.address() as AddressInfo;
    console.log('Socket.IO server listening on port', address.port);
  });
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Return a 200 response for health checks
  res.status(200).json({ status: 'ok', connected: global.io ? true : false });
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
