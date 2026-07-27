import { Server } from 'socket.io';

let io;

export function initSocket(server) {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    'https://dine-flow-ai-vsy9.vercel.app',
    'https://dineflow-backend-tt3y.onrender.com',
    'http://localhost:3000'
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(null, true); // Fallback for production
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('⚡ Client connected to Socket:', socket.id);

    socket.on('join:room', (room) => {
      socket.join(room);
      console.log(`📌 Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    console.warn('⚠️ Socket.io accessed before initialization!');
    return null; // Prevents app crash if socket call happens early
  }
  return io;
}