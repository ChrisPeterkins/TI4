import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '@ti4/database';

interface JWTPayload {
  id: string;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    user: {
      id: string;
      email: string | null;
      name: string | null;
    };
  };
}

/**
 * Socket.io authentication middleware
 * Validates JWT token from handshake and attaches user data to socket
 */
export async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      // Allow unauthenticated connections in development for testing
      if (config.isDevelopment) {
        console.log('Socket connected without auth (dev mode)');
        socket.data.userId = 'anonymous';
        socket.data.user = { id: 'anonymous', email: null, name: 'Anonymous' };
        return next();
      }
      return next(new Error('Authentication required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.nextAuthSecret) as JWTPayload;

    if (!decoded.id) {
      return next(new Error('Invalid token: missing user ID'));
    }

    // Optionally verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user data to socket
    socket.data.userId = user.id;
    socket.data.user = user;

    console.log(`Socket authenticated: ${user.email || user.id}`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Token expired'));
    }
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
}

/**
 * Get user ID from authenticated socket
 */
export function getUserId(socket: Socket): string {
  return (socket as AuthenticatedSocket).data.userId;
}

/**
 * Get user data from authenticated socket
 */
export function getUser(socket: Socket): AuthenticatedSocket['data']['user'] {
  return (socket as AuthenticatedSocket).data.user;
}
