import { prisma, LobbyStatus } from '@ti4/database';
import type { LobbySettings, LobbyPlayer, PlayerColor } from '@ti4/shared';
import { factions } from '@ti4/game-data';

// All available player colors
const ALL_COLORS: PlayerColor[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange', 'pink', 'black'];

/**
 * Generate a random 6-character lobby code
 */
function generateLobbyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new lobby
 */
export async function createLobby(
  hostId: string,
  settings: LobbySettings
): Promise<{
  id: string;
  code: string;
  settings: LobbySettings;
  players: LobbyPlayer[];
}> {
  // Ensure 'base' expansion is always included (required for base game factions)
  const expansions = settings.expansions.includes('base')
    ? settings.expansions
    : ['base', ...settings.expansions];

  // Generate unique code
  let code = generateLobbyCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.lobby.findUnique({ where: { code } });
    if (!existing) break;
    code = generateLobbyCode();
    attempts++;
  }

  // Get host user info
  const host = await prisma.user.findUnique({
    where: { id: hostId },
    select: { id: true, name: true, email: true },
  });

  if (!host) {
    throw new Error('Host user not found');
  }

  const lobby = await prisma.lobby.create({
    data: {
      code,
      hostId,
      playerCount: settings.playerCount,
      victoryPoints: settings.victoryPoints,
      expansions, // Use the corrected expansions array with 'base' always included
      mapPreset: settings.mapPreset,
      miltyDraft: settings.miltyDraft,
      privateGame: settings.privateGame,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      players: {
        create: {
          userId: hostId,
          isHost: true,
          seatIndex: 0,
        },
      },
    },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  return {
    id: lobby.id,
    code: lobby.code,
    settings: {
      playerCount: lobby.playerCount,
      victoryPoints: lobby.victoryPoints as 10 | 12 | 14,
      expansions: lobby.expansions,
      mapPreset: lobby.mapPreset ?? undefined,
      miltyDraft: lobby.miltyDraft,
      privateGame: lobby.privateGame,
    },
    players: lobby.players.map((p) => ({
      id: p.id, // Use actual Prisma record ID for database operations
      name: p.user!.name || 'Unknown',
      faction: p.factionId ?? undefined,
      color: p.color ?? undefined,
      ready: p.ready,
      isHost: p.isHost,
    })),
  };
}

/**
 * Find lobby by ID or code
 */
export async function findLobby(idOrCode: string) {
  return prisma.lobby.findFirst({
    where: {
      OR: [{ id: idOrCode }, { code: idOrCode }],
      status: LobbyStatus.WAITING,
    },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { seatIndex: 'asc' },
      },
    },
  });
}

/**
 * Get lobby with players
 */
export async function getLobbyWithPlayers(lobbyId: string) {
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { seatIndex: 'asc' },
      },
    },
  });

  if (!lobby) return null;

  return {
    id: lobby.id,
    code: lobby.code,
    hostId: lobby.hostId,
    status: lobby.status,
    settings: {
      playerCount: lobby.playerCount,
      victoryPoints: lobby.victoryPoints as 10 | 12 | 14,
      expansions: lobby.expansions,
      mapPreset: lobby.mapPreset ?? undefined,
      miltyDraft: lobby.miltyDraft,
      privateGame: lobby.privateGame,
    },
    players: lobby.players.map((p) => ({
      id: p.id, // Use actual Prisma record ID for database operations
      name: p.isBot ? (p.botName || `Bot ${(p.seatIndex ?? 0) + 1}`) : (p.user?.name || 'Unknown'),
      faction: p.factionId ?? undefined,
      color: p.color ?? undefined,
      ready: p.ready,
      isHost: p.isHost,
      isBot: p.isBot,
      seatIndex: p.seatIndex ?? undefined,
    })),
  };
}

/**
 * Add player to lobby (or reconnect if already in lobby)
 */
export async function addPlayerToLobby(lobbyId: string, userId: string) {
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: { players: true },
  });

  if (!lobby) {
    throw new Error('Lobby not found');
  }

  if (lobby.status !== LobbyStatus.WAITING) {
    throw new Error('Lobby is not accepting players');
  }

  // Check if player is already in lobby - allow reconnection
  const existingPlayer = lobby.players.find((p) => p.userId === userId);
  if (existingPlayer) {
    // Player is reconnecting - just return current lobby state
    return getLobbyWithPlayers(lobbyId);
  }

  if (lobby.players.length >= lobby.playerCount) {
    throw new Error('Lobby is full');
  }

  // Find next available seat
  const usedSeats = new Set(lobby.players.map((p) => p.seatIndex));
  let seatIndex = 0;
  while (usedSeats.has(seatIndex)) {
    seatIndex++;
  }

  await prisma.lobbyPlayer.create({
    data: {
      lobbyId,
      userId,
      seatIndex,
    },
  });

  return getLobbyWithPlayers(lobbyId);
}

/**
 * Remove player from lobby
 */
export async function removePlayerFromLobby(lobbyId: string, userId: string) {
  const lobbyPlayer = await prisma.lobbyPlayer.findFirst({
    where: {
      lobbyId,
      userId,
      isBot: false,
    },
  });

  if (!lobbyPlayer) {
    return null;
  }

  // If host leaves, close the lobby
  if (lobbyPlayer.isHost) {
    await prisma.lobby.update({
      where: { id: lobbyId },
      data: { status: LobbyStatus.CLOSED },
    });
    return null;
  }

  await prisma.lobbyPlayer.delete({
    where: { id: lobbyPlayer.id },
  });

  return getLobbyWithPlayers(lobbyId);
}

/**
 * Update player faction selection
 */
export async function selectFaction(
  lobbyId: string,
  userId: string,
  factionId: string
) {
  // Check if faction is already taken
  const existingPlayer = await prisma.lobbyPlayer.findFirst({
    where: {
      lobbyId,
      factionId,
      NOT: { userId },
    },
  });

  if (existingPlayer) {
    throw new Error('Faction already taken');
  }

  const player = await prisma.lobbyPlayer.findFirst({
    where: { lobbyId, userId, isBot: false },
  });

  if (!player) {
    throw new Error('Player not in lobby');
  }

  await prisma.lobbyPlayer.update({
    where: { id: player.id },
    data: {
      factionId,
      ready: false, // Reset ready when changing faction
    },
  });

  return getLobbyWithPlayers(lobbyId);
}

/**
 * Update player color selection
 */
export async function selectColor(
  lobbyId: string,
  userId: string,
  color: string
) {
  const player = await prisma.lobbyPlayer.findFirst({
    where: { lobbyId, userId, isBot: false },
  });

  if (!player) {
    throw new Error('Player not in lobby');
  }

  // Check if color is already taken
  const existingPlayer = await prisma.lobbyPlayer.findFirst({
    where: {
      lobbyId,
      color,
      NOT: { id: player.id },
    },
  });

  if (existingPlayer) {
    throw new Error('Color already taken');
  }

  await prisma.lobbyPlayer.update({
    where: { id: player.id },
    data: {
      color,
      ready: false, // Reset ready when changing color
    },
  });

  return getLobbyWithPlayers(lobbyId);
}

/**
 * Update player ready status
 */
export async function setPlayerReady(
  lobbyId: string,
  userId: string,
  ready: boolean
) {
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
  });

  if (!lobby) {
    throw new Error('Lobby not found');
  }

  const player = await prisma.lobbyPlayer.findFirst({
    where: { lobbyId, userId, isBot: false },
  });

  if (!player) {
    throw new Error('Player not in lobby');
  }

  // For Milty Draft, only require color to be ready
  // For normal games, require both faction and color
  if (ready) {
    if (lobby.miltyDraft) {
      if (!player.color) {
        throw new Error('Must select color before readying up');
      }
    } else {
      if (!player.factionId || !player.color) {
        throw new Error('Must select faction and color before readying up');
      }
    }
  }

  await prisma.lobbyPlayer.update({
    where: { id: player.id },
    data: { ready },
  });

  return getLobbyWithPlayers(lobbyId);
}

/**
 * Update player faction directly (used by Milty Draft)
 */
export async function updatePlayerFaction(
  lobbyId: string,
  playerId: string,
  factionId: string
) {
  // Find player by either userId or as a bot
  const player = await prisma.lobbyPlayer.findFirst({
    where: {
      lobbyId,
      OR: [
        { userId: playerId },
        { id: playerId },
      ],
    },
  });

  if (!player) {
    throw new Error('Player not in lobby');
  }

  await prisma.lobbyPlayer.update({
    where: { id: player.id },
    data: { factionId },
  });
}

/**
 * Update lobby settings (host only)
 */
export async function updateLobbySettings(
  lobbyId: string,
  hostId: string,
  settings: Partial<LobbySettings>
) {
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
  });

  if (!lobby) {
    throw new Error('Lobby not found');
  }

  if (lobby.hostId !== hostId) {
    throw new Error('Only the host can update settings');
  }

  await prisma.lobby.update({
    where: { id: lobbyId },
    data: {
      playerCount: settings.playerCount,
      victoryPoints: settings.victoryPoints,
      expansions: settings.expansions,
      mapPreset: settings.mapPreset,
      miltyDraft: settings.miltyDraft,
      privateGame: settings.privateGame,
    },
  });

  // Reset all ready states when settings change
  await prisma.lobbyPlayer.updateMany({
    where: { lobbyId },
    data: { ready: false },
  });

  return getLobbyWithPlayers(lobbyId);
}

/**
 * Check if lobby can start
 */
export async function canStartGame(lobbyId: string, hostId: string) {
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: { players: true },
  });

  if (!lobby) {
    return { canStart: false, reason: 'Lobby not found' };
  }

  if (lobby.hostId !== hostId) {
    return { canStart: false, reason: 'Only the host can start the game' };
  }

  if (lobby.players.length < 3) {
    return { canStart: false, reason: 'Need at least 3 players' };
  }

  const allReady = lobby.players.every((p) => p.ready);
  if (!allReady) {
    return { canStart: false, reason: 'Not all players are ready' };
  }

  return { canStart: true };
}

/**
 * Start the game - update lobby status
 */
export async function startLobbyGame(lobbyId: string) {
  await prisma.lobby.update({
    where: { id: lobbyId },
    data: { status: LobbyStatus.STARTING },
  });

  return getLobbyWithPlayers(lobbyId);
}

/**
 * Get available factions for a lobby (not already taken)
 */
function getAvailableFactions(lobby: { expansions: string[]; players: { factionId: string | null }[] }): string[] {
  const takenFactions = new Set(lobby.players.map((p) => p.factionId).filter(Boolean));

  // Get all factions that match the lobby's expansions
  const allFactions = Object.values(factions);
  const availableFactions = allFactions
    .filter((f) => lobby.expansions.includes(f.expansion))
    .map((f) => f.id)
    .filter((id) => !takenFactions.has(id));

  return availableFactions;
}

/**
 * Get available colors for a lobby (not already taken)
 */
function getAvailableColors(lobby: { players: { color: string | null }[] }): PlayerColor[] {
  const takenColors = new Set(lobby.players.map((p) => p.color).filter(Boolean));
  return ALL_COLORS.filter((c) => !takenColors.has(c));
}

/**
 * Pick a random element from an array
 */
function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Add a bot to the lobby (auto-assigns faction and color if not provided)
 * Note: For Milty Draft lobbies, faction is NOT auto-assigned (bots participate in draft)
 */
export async function addBotToLobby(
  lobbyId: string,
  botName: string,
  factionId?: string,
  color?: string
) {
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: { players: true },
  });

  if (!lobby) {
    throw new Error('Lobby not found');
  }

  if (lobby.status !== LobbyStatus.WAITING) {
    throw new Error('Lobby is not accepting players');
  }

  if (lobby.players.length >= lobby.playerCount) {
    throw new Error('Lobby is full');
  }

  // Find next available seat
  const usedSeats = new Set(lobby.players.map((p) => p.seatIndex));
  let seatIndex = 0;
  while (usedSeats.has(seatIndex)) {
    seatIndex++;
  }

  // For Milty Draft lobbies, don't auto-assign faction - bots will participate in the draft
  // For non-Milty lobbies, auto-assign faction if not provided
  let assignedFaction: string | undefined = factionId;
  if (!lobby.miltyDraft && !factionId) {
    const availableFactions = getAvailableFactions(lobby);
    assignedFaction = pickRandom(availableFactions);
  }

  // Auto-assign color if not provided (always needed regardless of draft mode)
  const availableColors = getAvailableColors(lobby);
  const assignedColor = color ?? pickRandom(availableColors);

  await prisma.lobbyPlayer.create({
    data: {
      lobbyId,
      isBot: true,
      botName,
      factionId: assignedFaction,
      color: assignedColor,
      ready: true, // Bots are always ready
      seatIndex,
    },
  });

  return getLobbyWithPlayers(lobbyId);
}

/**
 * Remove a bot from the lobby
 */
export async function removeBotFromLobby(lobbyId: string, seatIndex: number) {
  const lobbyPlayer = await prisma.lobbyPlayer.findFirst({
    where: {
      lobbyId,
      seatIndex,
      isBot: true,
    },
  });

  if (!lobbyPlayer) {
    throw new Error('Bot not found at this seat');
  }

  await prisma.lobbyPlayer.delete({
    where: { id: lobbyPlayer.id },
  });

  return getLobbyWithPlayers(lobbyId);
}

/**
 * Update bot settings
 */
export async function updateBot(
  lobbyId: string,
  seatIndex: number,
  updates: { factionId?: string; color?: string; botName?: string }
) {
  const lobbyPlayer = await prisma.lobbyPlayer.findFirst({
    where: {
      lobbyId,
      seatIndex,
      isBot: true,
    },
  });

  if (!lobbyPlayer) {
    throw new Error('Bot not found at this seat');
  }

  // Check if faction is already taken
  if (updates.factionId) {
    const existingPlayer = await prisma.lobbyPlayer.findFirst({
      where: {
        lobbyId,
        factionId: updates.factionId,
        NOT: { id: lobbyPlayer.id },
      },
    });

    if (existingPlayer) {
      throw new Error('Faction already taken');
    }
  }

  // Check if color is already taken
  if (updates.color) {
    const existingPlayer = await prisma.lobbyPlayer.findFirst({
      where: {
        lobbyId,
        color: updates.color,
        NOT: { id: lobbyPlayer.id },
      },
    });

    if (existingPlayer) {
      throw new Error('Color already taken');
    }
  }

  await prisma.lobbyPlayer.update({
    where: { id: lobbyPlayer.id },
    data: updates,
  });

  return getLobbyWithPlayers(lobbyId);
}

/**
 * Get all public lobbies waiting for players
 */
export async function getPublicLobbies() {
  const lobbies = await prisma.lobby.findMany({
    where: {
      status: LobbyStatus.WAITING,
      privateGame: false,
      expiresAt: { gt: new Date() },
    },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      host: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return lobbies.map((lobby) => ({
    id: lobby.id,
    code: lobby.code,
    hostName: lobby.host.name || 'Unknown',
    playerCount: lobby.players.length,
    maxPlayers: lobby.playerCount,
    settings: {
      playerCount: lobby.playerCount,
      victoryPoints: lobby.victoryPoints as 10 | 12 | 14,
      expansions: lobby.expansions,
      miltyDraft: lobby.miltyDraft,
    },
  }));
}

/**
 * Get lobbies where a user is a player
 */
export async function getLobbiesForUser(userId: string) {
  const lobbyPlayers = await prisma.lobbyPlayer.findMany({
    where: {
      userId,
      isBot: false,
    },
    include: {
      lobby: {
        include: {
          host: { select: { name: true } },
          players: true,
        },
      },
    },
  });

  return lobbyPlayers
    .filter((lp) => lp.lobby.status === LobbyStatus.WAITING)
    .map((lp) => ({
      id: lp.lobby.id,
      code: lp.lobby.code,
      hostName: lp.lobby.host.name || 'Unknown',
      playerCount: lp.lobby.players.length,
      maxPlayers: lp.lobby.playerCount,
      isHost: lp.isHost,
      settings: {
        playerCount: lp.lobby.playerCount,
        victoryPoints: lp.lobby.victoryPoints as 10 | 12 | 14,
        expansions: lp.lobby.expansions,
        miltyDraft: lp.lobby.miltyDraft,
      },
    }));
}
