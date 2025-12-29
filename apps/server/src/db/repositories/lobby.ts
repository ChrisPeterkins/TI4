import { prisma, LobbyStatus } from '@ti4/database';
import type { LobbySettings, LobbyPlayer } from '@ti4/shared';

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
      expansions: settings.expansions,
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
      id: p.userId,
      name: p.user.name || 'Unknown',
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
      id: p.userId,
      name: p.user.name || 'Unknown',
      faction: p.factionId ?? undefined,
      color: p.color ?? undefined,
      ready: p.ready,
      isHost: p.isHost,
    })),
  };
}

/**
 * Add player to lobby
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

  if (lobby.players.length >= lobby.playerCount) {
    throw new Error('Lobby is full');
  }

  // Check if player is already in lobby
  const existingPlayer = lobby.players.find((p) => p.userId === userId);
  if (existingPlayer) {
    throw new Error('Already in this lobby');
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
  const lobbyPlayer = await prisma.lobbyPlayer.findUnique({
    where: {
      lobbyId_userId: { lobbyId, userId },
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

  await prisma.lobbyPlayer.update({
    where: {
      lobbyId_userId: { lobbyId, userId },
    },
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
  // Check if color is already taken
  const existingPlayer = await prisma.lobbyPlayer.findFirst({
    where: {
      lobbyId,
      color,
      NOT: { userId },
    },
  });

  if (existingPlayer) {
    throw new Error('Color already taken');
  }

  await prisma.lobbyPlayer.update({
    where: {
      lobbyId_userId: { lobbyId, userId },
    },
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
  const player = await prisma.lobbyPlayer.findUnique({
    where: {
      lobbyId_userId: { lobbyId, userId },
    },
  });

  if (!player) {
    throw new Error('Player not in lobby');
  }

  // Require faction and color to be ready
  if (ready && (!player.factionId || !player.color)) {
    throw new Error('Must select faction and color before readying up');
  }

  await prisma.lobbyPlayer.update({
    where: { id: player.id },
    data: { ready },
  });

  return getLobbyWithPlayers(lobbyId);
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
