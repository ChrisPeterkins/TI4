import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@ti4/shared';
import { config } from './config/index.js';
import { authenticateSocket, getUser } from './middleware/auth.js';
import { registerLobbyHandlers, getPublicLobbies } from './socket/handlers/lobby.js';
import { registerGameHandlers } from './socket/handlers/game.js';
import * as lobbyRepo from './db/repositories/lobby.js';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Express Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Public lobbies endpoint
app.get('/api/lobbies', async (_req, res) => {
  try {
    const lobbies = await getPublicLobbies();
    res.json(lobbies);
  } catch (error) {
    console.error('Error fetching lobbies:', error);
    res.status(500).json({ error: 'Failed to fetch lobbies' });
  }
});

// User's lobbies endpoint (userId passed from authenticated Next.js app)
app.get('/api/lobbies/my', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const lobbies = await lobbyRepo.getLobbiesForUser(userId);
    res.json(lobbies);
  } catch (error) {
    console.error('Error fetching user lobbies:', error);
    res.status(500).json({ error: 'Failed to fetch user lobbies' });
  }
});

// Socket.io authentication middleware
io.use(authenticateSocket);

// Socket.io connection handling
io.on('connection', (socket) => {
  const user = getUser(socket);
  console.log(`Client connected: ${socket.id} (${user.email || user.id})`);

  // Register handlers
  registerLobbyHandlers(io, socket);
  registerGameHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(config.port, () => {
  console.log(`TI4 Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Client URL: ${config.clientUrl}`);
});

export { app, io, httpServer };
