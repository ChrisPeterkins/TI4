import { create } from 'zustand';
import type { GameState, GameAction, DiceRoll, ActionCardTargets, TransactionOffer, ChatMessageEvent } from '@ti4/shared';
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

  // Action Card UI state
  showActionCardPanel: boolean;
  selectedActionCard: string | null;
  actionCardTargetMode: boolean; // True when selecting targets for a card
  pendingCardPlay: {
    cardId: string;
    requiresTarget: 'player' | 'system' | 'planet' | 'unit' | null;
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

  // Action Card actions
  toggleActionCardPanel: () => void;
  selectActionCard: (cardId: string | null) => void;
  playActionCard: (cardId: string, targets?: ActionCardTargets) => void;
  discardActionCards: (cardIds: string[]) => void;
  cancelCardPlay: () => void;
  setCardTargetMode: (cardId: string, targetType: 'player' | 'system' | 'planet' | 'unit') => void;

  // Transaction UI state
  showTransactionModal: boolean;

  // Chat state
  chatMessages: ChatMessageEvent[];

  // Transaction actions
  toggleTransactionModal: () => void;
  proposeTransaction: (targetPlayerId: string, offering: TransactionOffer, requesting: TransactionOffer) => void;
  acceptTransaction: (transactionId: string) => void;
  declineTransaction: (transactionId: string) => void;

  // Chat actions
  sendChatMessage: (message: string, targetPlayerId?: string) => void;

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
  // Action Card UI state
  showActionCardPanel: false,
  selectedActionCard: null as string | null,
  actionCardTargetMode: false,
  pendingCardPlay: null as {
    cardId: string;
    requiresTarget: 'player' | 'system' | 'planet' | 'unit' | null;
  } | null,
  // Transaction UI state
  showTransactionModal: false,
  // Chat state
  chatMessages: [] as ChatMessageEvent[],
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

  // Action Card actions
  toggleActionCardPanel: () => {
    set((state) => ({ showActionCardPanel: !state.showActionCardPanel }));
  },

  selectActionCard: (cardId: string | null) => {
    set({ selectedActionCard: cardId });
  },

  playActionCard: (cardId: string, targets?: ActionCardTargets) => {
    const { sendAction } = get();
    sendAction({
      type: 'play_action_card',
      cardId,
      targets,
    } as Omit<GameAction, 'playerId' | 'timestamp'>);
    // Reset UI state
    set({
      selectedActionCard: null,
      actionCardTargetMode: false,
      pendingCardPlay: null,
    });
  },

  discardActionCards: (cardIds: string[]) => {
    const { sendAction } = get();
    sendAction({
      type: 'discard_action_cards',
      cardIds,
    } as Omit<GameAction, 'playerId' | 'timestamp'>);
  },

  cancelCardPlay: () => {
    set({
      selectedActionCard: null,
      actionCardTargetMode: false,
      pendingCardPlay: null,
    });
  },

  setCardTargetMode: (cardId: string, targetType: 'player' | 'system' | 'planet' | 'unit') => {
    set({
      actionCardTargetMode: true,
      pendingCardPlay: {
        cardId,
        requiresTarget: targetType,
      },
    });
  },

  // Transaction actions
  toggleTransactionModal: () => {
    set((state) => ({ showTransactionModal: !state.showTransactionModal }));
  },

  proposeTransaction: (targetPlayerId: string, offering: TransactionOffer, requesting: TransactionOffer) => {
    const { sendAction } = get();
    sendAction({
      type: 'propose_transaction',
      targetPlayerId,
      offering,
      requesting,
    } as Omit<GameAction, 'playerId' | 'timestamp'>);
    // Close modal after proposing
    set({ showTransactionModal: false });
  },

  acceptTransaction: (transactionId: string) => {
    const { sendAction } = get();
    sendAction({
      type: 'accept_transaction',
      transactionId,
    } as Omit<GameAction, 'playerId' | 'timestamp'>);
    set({ showTransactionModal: false });
  },

  declineTransaction: (transactionId: string) => {
    const { sendAction } = get();
    sendAction({
      type: 'decline_transaction',
      transactionId,
    } as Omit<GameAction, 'playerId' | 'timestamp'>);
    set({ showTransactionModal: false });
  },

  // Chat actions
  sendChatMessage: (message: string, targetPlayerId?: string) => {
    const { socket } = useSocketStore.getState();
    const { gameId } = get();

    if (!socket || !gameId) {
      toast.error('Cannot send message: not connected');
      return;
    }

    if (!message.trim()) {
      return;
    }

    socket.emit('chat_message', {
      gameId,
      message: message.trim(),
      targetPlayerId,
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

    // Action card events
    socket.on('action_card_played', (data: { playerId: string; cardId: string; cardName: string }) => {
      const { currentPlayerId } = get();
      if (data.playerId !== currentPlayerId) {
        toast.info(`${data.cardName} was played!`);
      }
    });

    socket.on('action_cards_drawn', (data: { playerId: string; drawnCount: number; drawnCards?: string[] }) => {
      const { currentPlayerId } = get();
      if (data.playerId === currentPlayerId && data.drawnCards) {
        toast.success(`Drew ${data.drawnCount} action card${data.drawnCount > 1 ? 's' : ''}`);
      }
    });

    socket.on('action_cards_discarded', (data: { playerId: string; discardedCount: number }) => {
      console.log('Action cards discarded:', data);
    });

    // Transaction events
    socket.on('transaction_proposed', (data: { transactionId: string; initiatorId: string; targetId: string }) => {
      const { currentPlayerId, gameState } = get();
      if (data.targetId === currentPlayerId) {
        const initiator = gameState?.players.find(p => p.id === data.initiatorId);
        toast.info(`${initiator?.name || 'A player'} proposed a trade with you!`);
      }
    });

    socket.on('transaction_accepted', (data: { transactionId: string; initiatorId: string; targetId: string }) => {
      const { currentPlayerId, gameState } = get();
      if (data.initiatorId === currentPlayerId) {
        const target = gameState?.players.find(p => p.id === data.targetId);
        toast.success(`${target?.name || 'Player'} accepted your trade!`);
      }
    });

    socket.on('transaction_declined', (data: { transactionId: string; initiatorId: string; targetId: string }) => {
      const { currentPlayerId, gameState } = get();
      if (data.initiatorId === currentPlayerId) {
        const target = gameState?.players.find(p => p.id === data.targetId);
        toast.info(`${target?.name || 'Player'} declined your trade.`);
      }
    });

    // Chat events
    socket.on('chat_message', (data: ChatMessageEvent) => {
      set((state) => ({
        chatMessages: [...state.chatMessages, data].slice(-100), // Keep last 100 messages
      }));
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
    socket.off('action_card_played');
    socket.off('action_cards_drawn');
    socket.off('action_cards_discarded');
    socket.off('transaction_proposed');
    socket.off('transaction_accepted');
    socket.off('transaction_declined');
    socket.off('chat_message');
  },

  reset: () => {
    set(initialState);
  },
}));
