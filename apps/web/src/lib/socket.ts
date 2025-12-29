import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@ti4/shared';

export type TI4Socket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TI4Socket | null = null;

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

/**
 * Get or create the socket connection
 */
export function getSocket(token: string): TI4Socket {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SERVER_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

/**
 * Disconnect the socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
