import { create } from 'zustand';
import type {
  LobbySettings,
  LobbyPlayer,
  LobbyUpdatedEvent,
  ErrorEvent,
  MiltyDraftState,
  MiltyDraftPick,
  DraftPlayerInfo,
} from '@ti4/shared';
import { useSocketStore } from './socket-store';

interface LobbyState {
  // Current lobby
  lobbyId: string | null;
  code: string | null;
  settings: LobbySettings | null;
  players: LobbyPlayer[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Game starting
  isGameStarting: boolean;
  gameId: string | null;
  countdown: number | null;

  // Milty Draft
  draftState: MiltyDraftState | null;
  lastPick: MiltyDraftPick | null;
  draftPlayerMapping: Record<string, DraftPlayerInfo> | null;  // draftPlayerId -> player info
  draftPlayerAssignments: {
    playerId: string;
    faction: string;
    sliceId: number;
    speakerPosition: number;
  }[] | null;

  // Actions
  createLobby: (settings: LobbySettings) => Promise<void>;
  joinLobby: (codeOrId: string) => Promise<void>;
  leaveLobby: () => void;
  selectFaction: (factionId: string) => void;
  selectColor: (color: string) => void;
  readyUp: (ready: boolean) => void;
  updateSettings: (settings: Partial<LobbySettings>) => void;
  startGame: () => Promise<void>;

  // Bot management (host only)
  addBot: (botName?: string, factionId?: string, color?: string) => void;
  removeBot: (seatIndex: number) => void;
  updateBot: (seatIndex: number, updates: { botName?: string; factionId?: string; color?: string }) => void;

  // Milty Draft actions
  startDraft: () => Promise<void>;
  makeDraftPick: (pickType: 'faction' | 'slice' | 'speaker', value: string | number) => Promise<void>;

  // Internal
  setupListeners: () => void;
  cleanupListeners: () => void;
  reset: () => void;
}

const initialState = {
  lobbyId: null,
  code: null,
  settings: null,
  players: [],
  isLoading: false,
  error: null,
  isGameStarting: false,
  gameId: null,
  countdown: null,
  draftState: null,
  lastPick: null,
  draftPlayerMapping: null,
  draftPlayerAssignments: null,
};

export const useLobbyStore = create<LobbyState>((set, get) => ({
  ...initialState,

  createLobby: async (settings: LobbySettings) => {
    const { socket } = useSocketStore.getState();
    if (!socket) {
      set({ error: 'Not connected to server' });
      return;
    }

    set({ isLoading: true, error: null });

    return new Promise<void>((resolve, reject) => {
      socket.emit(
        'create_lobby',
        { hostId: '', hostName: '', settings },
        (response) => {
          if ('code' in response && typeof response.code === 'string' && response.code.length === 6) {
            // Success response (LobbyCreatedEvent)
            const lobby = response as { lobbyId: string; code: string; settings: LobbySettings; players: LobbyPlayer[] };
            set({
              lobbyId: lobby.lobbyId,
              code: lobby.code,
              settings: lobby.settings,
              players: lobby.players,
              isLoading: false,
            });
            get().setupListeners();
            resolve();
          } else {
            // Error response
            const error = response as ErrorEvent;
            set({ error: error.message, isLoading: false });
            reject(new Error(error.message));
          }
        }
      );
    });
  },

  joinLobby: async (codeOrId: string) => {
    const { socket } = useSocketStore.getState();
    if (!socket) {
      set({ error: 'Not connected to server' });
      return;
    }

    set({ isLoading: true, error: null });

    return new Promise<void>((resolve, reject) => {
      // Determine if this is a code or ID based on length
      const payload = codeOrId.length === 6
        ? { code: codeOrId }
        : { lobbyId: codeOrId };

      socket.emit('join_lobby', payload, (response) => {
        if ('players' in response) {
          // Success response
          const lobby = response as LobbyUpdatedEvent;
          set({
            lobbyId: lobby.lobbyId,
            code: lobby.code,
            settings: lobby.settings,
            players: lobby.players,
            isLoading: false,
          });
          get().setupListeners();
          resolve();
        } else {
          // Error response
          const error = response as ErrorEvent;
          set({ error: error.message, isLoading: false });
          reject(new Error(error.message));
        }
      });
    });
  },

  leaveLobby: () => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (socket && lobbyId) {
      socket.emit('leave_lobby', { lobbyId });
    }

    get().cleanupListeners();
    get().reset();
  },

  selectFaction: (factionId: string) => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (socket && lobbyId) {
      socket.emit('select_faction', { lobbyId, factionId });
    }
  },

  selectColor: (color: string) => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (socket && lobbyId) {
      socket.emit('select_color', { lobbyId, color });
    }
  },

  readyUp: (ready: boolean) => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (socket && lobbyId) {
      socket.emit('ready_up', { lobbyId, ready });
    }
  },

  updateSettings: (settings: Partial<LobbySettings>) => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (socket && lobbyId) {
      socket.emit('update_settings', { lobbyId, settings });
    }
  },

  startGame: async () => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (!socket || !lobbyId) {
      set({ error: 'Not in a lobby' });
      return;
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit('start_game', { lobbyId }, (response) => {
        if ('gameId' in response && !('code' in response && response.code !== undefined)) {
          // Success
          resolve();
        } else {
          // Error
          const error = response as ErrorEvent;
          set({ error: error.message });
          reject(new Error(error.message));
        }
      });
    });
  },

  addBot: (botName?: string, factionId?: string, color?: string) => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (socket && lobbyId) {
      socket.emit('add_bot', { lobbyId, botName, factionId, color });
    }
  },

  removeBot: (seatIndex: number) => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (socket && lobbyId) {
      socket.emit('remove_bot', { lobbyId, seatIndex });
    }
  },

  updateBot: (seatIndex: number, updates: { botName?: string; factionId?: string; color?: string }) => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (socket && lobbyId) {
      socket.emit('update_bot', { lobbyId, seatIndex, ...updates });
    }
  },

  startDraft: async () => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (!socket || !lobbyId) {
      set({ error: 'Not in a lobby' });
      return;
    }

    set({ isLoading: true, error: null });

    return new Promise<void>((resolve, reject) => {
      socket.emit('start_draft', { lobbyId }, (response) => {
        if ('draftState' in response) {
          set({
            draftState: response.draftState,
            draftPlayerMapping: response.playerMapping,
            isLoading: false,
          });
          resolve();
        } else {
          const error = response as ErrorEvent;
          set({ error: error.message, isLoading: false });
          reject(new Error(error.message));
        }
      });
    });
  },

  makeDraftPick: async (pickType: 'faction' | 'slice' | 'speaker', value: string | number) => {
    const { socket } = useSocketStore.getState();
    const { lobbyId } = get();

    if (!socket || !lobbyId) {
      set({ error: 'Not in a lobby' });
      return;
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit('make_draft_pick', { lobbyId, pickType, value }, (response) => {
        if ('draftState' in response) {
          set({
            draftState: response.draftState,
            lastPick: response.lastPick,
            draftPlayerMapping: response.playerMapping,
          });
          resolve();
        } else {
          const error = response as ErrorEvent;
          set({ error: error.message });
          reject(new Error(error.message));
        }
      });
    });
  },

  setupListeners: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    socket.on('lobby_updated', (data) => {
      set({
        settings: data.settings,
        players: data.players,
      });
    });

    socket.on('player_ready', (data) => {
      set((state) => ({
        players: state.players.map((p) =>
          p.id === data.playerId ? { ...p, ready: data.ready } : p
        ),
      }));
    });

    socket.on('game_starting', (data) => {
      set({
        isGameStarting: true,
        gameId: data.gameId,
        countdown: data.countdown,
      });
    });

    // Milty Draft events
    socket.on('draft_started', (data) => {
      set({
        draftState: data.draftState,
        draftPlayerMapping: data.playerMapping,
      });
    });

    socket.on('draft_updated', (data) => {
      set({
        draftState: data.draftState,
        lastPick: data.lastPick,
        draftPlayerMapping: data.playerMapping,
      });
    });

    socket.on('draft_complete', (data) => {
      set({
        draftPlayerAssignments: data.playerAssignments,
      });
    });

    socket.on('error', (error) => {
      set({ error: error.message });
    });
  },

  cleanupListeners: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    socket.off('lobby_updated');
    socket.off('player_ready');
    socket.off('game_starting');
    socket.off('draft_started');
    socket.off('draft_updated');
    socket.off('draft_complete');
  },

  reset: () => {
    set(initialState);
  },
}));
