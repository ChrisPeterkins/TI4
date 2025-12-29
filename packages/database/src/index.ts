// Re-export Prisma client
export { prisma } from './client.js';

// Re-export Prisma namespace for JSON types
export { Prisma } from '@prisma/client';

// Re-export Prisma types and enums
export {
  type User,
  type Account,
  type Session,
  type Lobby,
  type LobbyPlayer,
  type Game,
  type GamePlayer,
  type GameAction,
  type GameSnapshot,
  LobbyStatus,
  GameStatus,
} from '@prisma/client';
