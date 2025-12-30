import { create } from 'zustand';
import type { GameState, GameAction, DiceRoll } from '@ti4/shared';
import { useSocketStore } from './socket-store';
import { toast } from './toast-store';

interface GameStore {
  // Game state
  gameId: string | null;
  gameState: GameState | null;
  currentPlayerId: string | null; // The player ID for the current user in this game

  // Combat state
  pendingDiceRolls: {
    attackerRolls: DiceRoll[];
    defenderRolls: DiceRoll[];
  } | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Connection state
  isConnected: boolean;

  // Actions
  joinGame: (gameId: string) => void;
  leaveGame: () => void;
  sendAction: (action: Omit<GameAction, 'playerId' | 'timestamp'>) => void;
  requestState: () => void;

  // Internal
  setGameState: (state: GameState) => void;
  setCurrentPlayerId: (playerId: string) => void;
  setupListeners: () => void;
  cleanupListeners: () => void;
  reset: () => void;
}

const initialState = {
  gameId: null,
  gameState: null,
  currentPlayerId: null as string | null,
  pendingDiceRolls: null as {
    attackerRolls: DiceRoll[];
    defenderRolls: DiceRoll[];
  } | null,
  isLoading: false,
  error: null,
  isConnected: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  joinGame: (gameId: string) => {
    const { socket } = useSocketStore.getState();
    if (!socket) {
      toast.error('Not connected to server');
      return;
    }

    set({ isLoading: true, error: null, gameId });

    socket.emit('join_game', {
      gameId,
      playerId: '', // Will be filled by server
      token: '' // Already authenticated via socket
    });

    get().setupListeners();
  },

  leaveGame: () => {
    const { socket } = useSocketStore.getState();
    const { gameId } = get();

    if (socket && gameId) {
      socket.emit('leave_game', { gameId });
    }

    get().cleanupListeners();
    get().reset();
  },

  sendAction: (actionData) => {
    const { socket } = useSocketStore.getState();
    const { gameId, gameState, currentPlayerId } = get();

    if (!socket || !gameId || !gameState) {
      toast.error('Cannot send action: not in game');
      return;
    }

    if (!currentPlayerId) {
      toast.error('Cannot send action: player ID not set');
      return;
    }

    const action: GameAction = {
      ...actionData,
      playerId: currentPlayerId,
      timestamp: Date.now(),
    } as GameAction;

    socket.emit('game_action', { gameId, action });
  },

  requestState: () => {
    const { socket } = useSocketStore.getState();
    const { gameId, gameState } = get();

    if (!socket || !gameId) return;

    socket.emit('request_state', {
      gameId,
      fromVersion: gameState?.version
    });
  },

  setGameState: (state: GameState) => {
    set({
      gameState: state,
      isLoading: false,
      isConnected: true,
    });
  },

  setCurrentPlayerId: (playerId: string) => {
    set({ currentPlayerId: playerId });
  },

  setupListeners: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    socket.on('joined_game', (data) => {
      if (data.success && data.gameState && data.playerId) {
        get().setCurrentPlayerId(data.playerId);
        get().setGameState(data.gameState);
      } else if (data.error) {
        toast.error(data.error);
        set({ isLoading: false });
      }
    });

    socket.on('game_state', (data) => {
      get().setGameState(data.state);
    });

    socket.on('action_result', (data) => {
      if (!data.result.success) {
        toast.error(data.result.error || 'Action failed');
      }
    });

    socket.on('player_joined', (data) => {
      console.log('Player joined:', data.playerId);
    });

    socket.on('player_left', (data) => {
      console.log('Player left:', data.playerId);
    });

    socket.on('player_reconnected', (data) => {
      console.log('Player reconnected:', data.playerId);
    });

    // Combat events
    socket.on('dice_rolled', (data: { attackerRolls?: DiceRoll[]; defenderRolls?: DiceRoll[]; rolls?: DiceRoll[] }) => {
      console.log('Dice rolled:', data);
      set({
        pendingDiceRolls: {
          attackerRolls: data.attackerRolls || [],
          defenderRolls: data.defenderRolls || [],
        },
      });
    });

    socket.on('combat_started', (data) => {
      console.log('Combat started:', data);
      toast.info('Space combat initiated!');
    });

    socket.on('combat_updated', (data) => {
      console.log('Combat updated:', data);
    });

    socket.on('combat_ended', (data) => {
      console.log('Combat ended:', data);
      set({ pendingDiceRolls: null });
      if (data.winnerId) {
        toast.success('Combat complete!');
      } else {
        toast.info('Combat ended in a draw!');
      }
    });

    socket.on('error', (error) => {
      toast.error(error.message);
      set({ isLoading: false });
    });
  },

  cleanupListeners: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    socket.off('joined_game');
    socket.off('game_state');
    socket.off('action_result');
    socket.off('player_joined');
    socket.off('player_left');
    socket.off('player_reconnected');
    socket.off('dice_rolled');
    socket.off('combat_started');
    socket.off('combat_updated');
    socket.off('combat_ended');
  },

  reset: () => {
    set(initialState);
  },
}));
