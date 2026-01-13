import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

// Mock dependencies before imports
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    JsonWebTokenError: class JsonWebTokenError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'JsonWebTokenError';
      }
    },
    TokenExpiredError: class TokenExpiredError extends Error {
      expiredAt: Date;
      constructor(message: string, expiredAt: Date) {
        super(message);
        this.name = 'TokenExpiredError';
        this.expiredAt = expiredAt;
      }
    },
  },
}));

vi.mock('../../config/index.js', () => ({
  config: {
    isDevelopment: false,
    nextAuthSecret: 'test-secret',
  },
}));

vi.mock('@ti4/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { authenticateSocket, getUserId, getUser, type AuthenticatedSocket } from '../auth.js';
import { config } from '../../config/index.js';
import { prisma } from '@ti4/database';

// Helper to create mock socket
function createMockSocket(authToken?: string): Socket & { data: Record<string, unknown> } {
  return {
    id: 'socket-123',
    handshake: {
      auth: {
        token: authToken,
      },
      headers: {},
      query: {},
      address: '127.0.0.1',
      secure: false,
      time: new Date().toISOString(),
      issued: Date.now(),
      url: '/',
      xdomain: false,
    },
    data: {},
  } as unknown as Socket & { data: Record<string, unknown> };
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset config to production mode by default
    (config as { isDevelopment: boolean }).isDevelopment = false;
  });

  describe('authenticateSocket', () => {
    describe('when no token is provided', () => {
      it('should return error in production mode', async () => {
        const socket = createMockSocket();
        const next = vi.fn();

        await authenticateSocket(socket, next);

        expect(next).toHaveBeenCalledWith(new Error('Authentication required'));
      });

      it('should allow anonymous connection in development mode', async () => {
        (config as { isDevelopment: boolean }).isDevelopment = true;
        const socket = createMockSocket();
        const next = vi.fn();

        await authenticateSocket(socket, next);

        expect(next).toHaveBeenCalledWith();
        expect(socket.data.userId).toBe('anonymous');
        expect(socket.data.user).toEqual({
          id: 'anonymous',
          email: null,
          name: 'Anonymous',
        });
      });
    });

    describe('when token is provided', () => {
      it('should authenticate valid token and attach user data', async () => {
        const socket = createMockSocket('valid-token');
        const next = vi.fn();

        vi.mocked(jwt.verify).mockReturnValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        } as unknown as jwt.JwtPayload);

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        } as any);

        await authenticateSocket(socket, next);

        expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          select: { id: true, email: true, name: true },
        });
        expect(next).toHaveBeenCalledWith();
        expect(socket.data.userId).toBe('user-123');
        expect(socket.data.user).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        });
      });

      it('should return error for token without user ID', async () => {
        const socket = createMockSocket('token-without-id');
        const next = vi.fn();

        vi.mocked(jwt.verify).mockReturnValue({
          email: 'test@example.com',
          // Missing id field
        } as unknown as jwt.JwtPayload);

        await authenticateSocket(socket, next);

        expect(next).toHaveBeenCalledWith(new Error('Invalid token: missing user ID'));
      });

      it('should return error when user not found in database', async () => {
        const socket = createMockSocket('valid-token');
        const next = vi.fn();

        vi.mocked(jwt.verify).mockReturnValue({
          id: 'nonexistent-user',
        } as unknown as jwt.JwtPayload);

        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        await authenticateSocket(socket, next);

        expect(next).toHaveBeenCalledWith(new Error('User not found'));
      });
    });

    describe('token validation errors', () => {
      it('should return error for invalid/malformed token', async () => {
        const socket = createMockSocket('malformed-token');
        const next = vi.fn();

        vi.mocked(jwt.verify).mockImplementation(() => {
          throw new jwt.JsonWebTokenError('jwt malformed');
        });

        await authenticateSocket(socket, next);

        expect(next).toHaveBeenCalledWith(new Error('Invalid token'));
      });

      it('should return error for expired token', async () => {
        const socket = createMockSocket('expired-token');
        const next = vi.fn();

        vi.mocked(jwt.verify).mockImplementation(() => {
          throw new jwt.TokenExpiredError('jwt expired', new Date());
        });

        await authenticateSocket(socket, next);

        expect(next).toHaveBeenCalledWith(new Error('Token expired'));
      });

      it('should return generic error for unexpected errors', async () => {
        const socket = createMockSocket('valid-token');
        const next = vi.fn();

        vi.mocked(jwt.verify).mockReturnValue({
          id: 'user-123',
        } as unknown as jwt.JwtPayload);

        vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database connection failed'));

        await authenticateSocket(socket, next);

        expect(next).toHaveBeenCalledWith(new Error('Authentication failed'));
      });
    });

    describe('edge cases', () => {
      it('should handle user with null email and name', async () => {
        const socket = createMockSocket('valid-token');
        const next = vi.fn();

        vi.mocked(jwt.verify).mockReturnValue({
          id: 'user-123',
        } as unknown as jwt.JwtPayload);

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: 'user-123',
          email: null,
          name: null,
        } as any);

        await authenticateSocket(socket, next);

        expect(next).toHaveBeenCalledWith();
        expect(socket.data.user).toEqual({
          id: 'user-123',
          email: null,
          name: null,
        });
      });

      it('should handle empty string token as no token', async () => {
        const socket = createMockSocket('');
        const next = vi.fn();

        await authenticateSocket(socket, next);

        // Empty string is falsy, so should be treated as no token
        expect(next).toHaveBeenCalledWith(new Error('Authentication required'));
      });
    });
  });

  describe('getUserId', () => {
    it('should return userId from socket data', () => {
      const socket = createMockSocket();
      socket.data.userId = 'user-456';

      const userId = getUserId(socket);

      expect(userId).toBe('user-456');
    });

    it('should return undefined if userId not set', () => {
      const socket = createMockSocket();

      const userId = getUserId(socket);

      expect(userId).toBeUndefined();
    });
  });

  describe('getUser', () => {
    it('should return user object from socket data', () => {
      const socket = createMockSocket();
      socket.data.user = {
        id: 'user-789',
        email: 'user@example.com',
        name: 'Test User',
      };

      const user = getUser(socket);

      expect(user).toEqual({
        id: 'user-789',
        email: 'user@example.com',
        name: 'Test User',
      });
    });

    it('should return undefined if user not set', () => {
      const socket = createMockSocket();

      const user = getUser(socket);

      expect(user).toBeUndefined();
    });

    it('should return user with partial data', () => {
      const socket = createMockSocket();
      socket.data.user = {
        id: 'user-anon',
        email: null,
        name: 'Anonymous',
      };

      const user = getUser(socket);

      expect(user).toEqual({
        id: 'user-anon',
        email: null,
        name: 'Anonymous',
      });
    });
  });
});
