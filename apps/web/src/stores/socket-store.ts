import { create } from 'zustand';
import { getSocket, disconnectSocket, type TI4Socket } from '../lib/socket';

interface SocketState {
  socket: TI4Socket | null;
  isConnected: boolean;
  connectionError: string | null;

  connect: (token: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connectionError: null,

  connect: (token: string) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) {
      return;
    }

    const socket = getSocket(token);

    socket.on('connect', () => {
      set({ isConnected: true, connectionError: null });
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      set({ connectionError: error.message, isConnected: false });
      console.error('Socket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
    }
    disconnectSocket();
    set({ socket: null, isConnected: false });
  },
}));
