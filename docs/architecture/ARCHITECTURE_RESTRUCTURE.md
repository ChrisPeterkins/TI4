# TI4 Architecture Restructuring Plan

## Critical Issue
The game engine is currently in `client/src/game/` but for a server-authoritative multiplayer game, ALL game logic must be on the server to prevent cheating and ensure consistency.

## Current Problems

### 1. Client-side Game Logic (MUST MOVE TO SERVER)
These directories are currently in `client/src/game/` but should be in `server/src/game/`:
- **engine/** - Core game state management
- **phases/** - Game phase logic  
- **actions/** - Action validation and execution
- **validation/** - All game rule validation
- **combat/** - Combat resolution (cannot trust client)
- **movement/** - Movement validation and pathfinding
- **exploration/** - Card draws and exploration logic
- **leaders/** - Leader abilities and effects
- **mechs/** - Mech deployment and abilities
- **factions/** - Faction abilities and special rules
- **objectives/** - Objective scoring and validation
- **politics/** - Voting and agenda resolution
- **trade/** - Trade validation and transactions
- **relics/** - Relic effects and management

### 2. Incorrectly Placed Components

#### Should be SERVER-SIDE:
```
server/src/game/
├── engine/           # Core game engine (from client/src/game/engine/)
├── phases/           # Phase management (from client/src/game/phases/)
├── actions/          # Action handlers (from client/src/game/actions/)
├── validation/       # Rule validation (from client/src/game/validation/)
├── combat/           # Combat engine (from client/src/game/combat/)
├── movement/         # Movement logic (from client/src/game/movement/)
├── exploration/      # Exploration logic (from client/src/game/exploration/)
├── leaders/          # Leader logic (from client/src/game/leaders/)
├── mechs/            # Mech logic (from client/src/game/mechs/)
├── factions/         # Faction logic (from client/src/game/factions/)
├── objectives/       # Objective logic (from client/src/game/objectives/)
├── politics/         # Politics logic (from client/src/game/politics/)
├── trade/            # Trade logic (from client/src/game/trade/)
├── relics/           # Relic logic (from client/src/game/relics/)
├── boardgame-io/     # Boardgame.io config (from client/src/game/boardgame-io/)
├── map/              # Map generation (NEW - should be server-side)
│   ├── MapGenerator.ts
│   ├── MapBalancer.ts
│   ├── MapPresets.ts
│   └── MapValidator.ts
└── state/            # Game state management (NEW)
    ├── GameState.ts
    ├── PlayerState.ts
    └── BoardState.ts
```

#### Should be CLIENT-SIDE (UI only):
```
client/src/
├── game-client/      # Client-side game interface (renamed from game/)
│   ├── BoardgameIOClient.ts  # Client connection to server
│   ├── GameStateSync.ts      # Syncs with server state
│   └── ClientPrediction.ts   # Optional optimistic updates
├── visualizers/      # Visual representation only
│   ├── CombatVisualizer.ts   # Shows combat (no logic)
│   ├── MovementVisualizer.ts # Shows movement paths
│   └── EffectVisualizer.ts   # Shows card effects
└── components/       # All UI components (already correct)
```

### 3. Data Location Issues

Currently we have `server/src/data/` which is correct, but we need to ensure:
- **Server data** - Full game data, hidden information
- **Client data** - Only public information sent via API

## Proposed Architecture

### Server (Authoritative)
```
server/
├── src/
│   ├── game/         # ALL game logic
│   │   ├── engine/   # Core engine
│   │   ├── rules/    # Rule implementations
│   │   ├── systems/  # Game systems (combat, trade, etc.)
│   │   └── boardgame-io/  # Game definition
│   ├── data/         # Complete game data
│   ├── api/          # REST endpoints
│   ├── services/     # Business logic
│   └── validators/   # Input validation
```

### Client (Presentation Only)
```
client/
├── src/
│   ├── game-client/  # Client-side connection
│   ├── components/   # UI components
│   ├── three/        # 3D rendering
│   ├── services/     # API services
│   └── store/        # UI state only
```

### Shared (Types & Constants)
```
shared/
├── types/           # TypeScript interfaces
├── constants/       # Game constants
└── protocols/       # Communication protocols
```

## Migration Steps

### Phase 1: Move Game Logic to Server
1. Move `client/src/game/` → `server/src/game/`
2. Update imports in moved files
3. Remove client-side game logic folders

### Phase 2: Setup Boardgame.io Properly
1. Configure game definition in `server/src/game/boardgame-io/`
2. Setup server with Boardgame.io
3. Create client connection in `client/src/game-client/`

### Phase 3: Create Client Interface
1. Build `BoardgameIOClient.ts` for server connection
2. Implement `GameStateSync.ts` for state updates
3. Create visualizers for game events

### Phase 4: Update Components
1. Update all components to use server state
2. Remove any game logic from components
3. Ensure components only handle presentation

## Benefits of Correct Architecture

1. **Security** - No cheating possible, server validates everything
2. **Consistency** - Single source of truth for game state
3. **Scalability** - Server can handle multiple games
4. **Spectator Mode** - Easy to implement observers
5. **Replays** - Server can record and replay games
6. **Tournament Support** - Server controls all game rules

## Components That Are Correctly Placed

### Client (Correct):
- `/components` - UI components ✓
- `/three` - 3D rendering ✓
- `/hooks` - React hooks ✓
- `/services/api` - API client ✓
- `/store` - UI state ✓

### Server (Correct):
- `/data` - Game data ✓
- `/api` - REST endpoints ✓
- `/services` - Services ✓
- `/db` - Database ✓
- `/tournament` - Tournament system ✓

## Action Items

1. **Immediate**: Move all game logic from client to server
2. **Next**: Setup proper Boardgame.io integration
3. **Then**: Create thin client that only visualizes
4. **Finally**: Test multiplayer with server authority

## Red Flags in Current Structure

1. ❌ Combat engine in client - allows damage calculation cheating
2. ❌ Movement validation in client - allows illegal moves
3. ❌ Objective scoring in client - allows score manipulation
4. ❌ Trade system in client - allows item duplication
5. ❌ Card effects in client - allows effect manipulation

## Correct Flow

```
User Input → Client → Server Validation → Game Logic (Server) → State Update → Broadcast to Clients → UI Update
```

NOT:
```
User Input → Client Logic → State Update → Maybe Tell Server
```

This restructuring is CRITICAL for a functioning multiplayer game!