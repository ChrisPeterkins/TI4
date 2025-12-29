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

// Socket.io authentication middleware
io.use(authenticateSocket);

// Socket.io connection handling
io.on('connection', (socket) => {
  const user = getUser(socket);
  console.log(`Client connected: ${socket.id} (${user.email || user.id})`);

  // Register lobby handlers
  registerLobbyHandlers(io, socket);

  // ========== GAME EVENTS ==========
  // TODO: Move to separate game handler file

  socket.on('join_game', (data) => {
    console.log(`User joining game ${data.gameId}`);
    socket.join(`game:${data.gameId}`);
    // TODO: Validate user is part of this game
    // TODO: Send current game state
  });

  socket.on('leave_game', (data) => {
    console.log(`Player leaving game ${data.gameId}`);
    socket.leave(`game:${data.gameId}`);
  });

  socket.on('game_action', (data) => {
    console.log(`Game action:`, data.action.type);
    // TODO: Validate user can take this action
    // TODO: Process action through GameMachine
    // TODO: Broadcast state update
  });

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
