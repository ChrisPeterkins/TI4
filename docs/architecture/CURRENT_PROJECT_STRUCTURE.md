# TI4 Web App - Current Project Structure (Updated)

## Overview
This document reflects the ACTUAL current structure after architectural restructuring to ensure proper server-authoritative game design.

## Key Architectural Decisions
- **Server-Authoritative**: ALL game logic lives on the server
- **Client as View**: Client only handles presentation and user input
- **Shared Types**: TypeScript interfaces shared between client/server
- **Data Security**: Complete game data on server, filtered data sent to clients

## Current Directory Structure

```
ti4-web-app/
├── .github/
│   ├── workflows/
│   └── ISSUE_TEMPLATE/
│
├── client/                            # Frontend (Presentation Layer Only)
│   ├── public/
│   │   ├── assets/
│   │   │   ├── factions/
│   │   │   │   ├── base/             # 18 base game factions
│   │   │   │   └── pok/              # 7 PoK factions
│   │   │   ├── cards/
│   │   │   │   ├── action/
│   │   │   │   ├── agenda/
│   │   │   │   ├── exploration/
│   │   │   │   ├── objective/
│   │   │   │   ├── promissory/
│   │   │   │   ├── relic/
│   │   │   │   ├── secret/
│   │   │   │   └── strategy/
│   │   │   ├── leaders/
│   │   │   ├── tokens/
│   │   │   ├── units/
│   │   │   ├── planets/
│   │   │   ├── systems/
│   │   │   ├── tiles/
│   │   │   └── icons/
│   │   ├── models/                   # 3D models for Three.js
│   │   │   ├── ships/
│   │   │   ├── structures/
│   │   │   ├── ground/
│   │   │   ├── board/
│   │   │   └── effects/
│   │   ├── fonts/
│   │   ├── sounds/
│   │   ├── locales/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── game-client/              # ✅ Client-Server Connection
│   │   │   ├── BoardgameIOClient.ts
│   │   │   └── GameStateSync.ts
│   │   │
│   │   ├── visualizers/              # ✅ Visual Effects Only (No Logic)
│   │   │   └── .gitkeep
│   │   │
│   │   ├── components/               # ✅ UI Components
│   │   │   ├── board/
│   │   │   ├── units/
│   │   │   ├── lobby/
│   │   │   ├── map/                  # Map display only
│   │   │   ├── player/
│   │   │   ├── ui/
│   │   │   ├── communication/
│   │   │   ├── cards/
│   │   │   ├── combat/               # Combat UI only
│   │   │   ├── trade/                # Trade UI only
│   │   │   ├── politics/             # Politics UI only
│   │   │   ├── companion/
│   │   │   ├── spectator/
│   │   │   ├── tutorial/
│   │   │   ├── tournament/
│   │   │   ├── admin/
│   │   │   └── shared/
│   │   │
│   │   ├── three/                    # ✅ 3D Rendering
│   │   │   ├── scene/
│   │   │   ├── geometry/
│   │   │   ├── animations/
│   │   │   ├── materials/
│   │   │   ├── loaders/
│   │   │   ├── performance/
│   │   │   └── effects/
│   │   │
│   │   ├── hooks/                    # ✅ React Hooks
│   │   │   ├── game/
│   │   │   ├── ui/
│   │   │   ├── features/
│   │   │   └── utils/
│   │   │
│   │   ├── services/                 # ✅ Client Services
│   │   │   ├── api/
│   │   │   │   └── gameDataService.ts
│   │   │   ├── websocket/
│   │   │   ├── webrtc/
│   │   │   ├── storage/
│   │   │   ├── audio/
│   │   │   ├── notifications/
│   │   │   └── analytics/
│   │   │
│   │   ├── store/                    # ✅ UI State Only
│   │   │   ├── slices/
│   │   │   └── middleware/
│   │   │
│   │   ├── types/                    # ✅ Client Types
│   │   │   ├── game/
│   │   │   └── api/
│   │   │
│   │   ├── utils/                    # ✅ Client Utilities
│   │   │   ├── gameLogic/            # Display helpers only
│   │   │   ├── math/
│   │   │   ├── validation/           # Input validation only
│   │   │   ├── helpers/
│   │   │   ├── accessibility/
│   │   │   ├── localization/
│   │   │   └── performance/
│   │   │
│   │   ├── workers/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── tests/
│   ├── .storybook/
│   ├── cypress/
│   └── package.json
│
├── server/                            # Backend (Game Logic & Authority)
│   ├── src/
│   │   ├── game/                     # ⭐ ALL GAME LOGIC (Moved from Client)
│   │   │   ├── engine/               # Core game engine
│   │   │   ├── phases/               # Game phases
│   │   │   ├── actions/              # Action handlers
│   │   │   ├── validation/           # Rule validation
│   │   │   ├── combat/               # Combat resolution
│   │   │   ├── movement/             # Movement logic
│   │   │   ├── exploration/          # Exploration mechanics
│   │   │   ├── leaders/              # Leader abilities
│   │   │   ├── mechs/                # Mech logic
│   │   │   ├── factions/             # Faction abilities
│   │   │   ├── objectives/           # Objective scoring
│   │   │   ├── politics/             # Voting system
│   │   │   ├── trade/                # Trade validation
│   │   │   ├── relics/               # Relic management
│   │   │   ├── map/                  # Map generation
│   │   │   ├── boardgame-io/         # Boardgame.io setup
│   │   │   ├── state/                # State management
│   │   │   ├── rules/                # Rule definitions
│   │   │   ├── systems/              # Game systems
│   │   │   └── TI4Game.ts           # Main game definition
│   │   │
│   │   ├── data/                     # ✅ Complete Game Data
│   │   │   ├── factions/
│   │   │   │   ├── base/
│   │   │   │   └── pok/
│   │   │   ├── cards/
│   │   │   │   ├── action/
│   │   │   │   ├── agenda/
│   │   │   │   ├── exploration/
│   │   │   │   ├── objective/
│   │   │   │   ├── promissory/
│   │   │   │   ├── relic/
│   │   │   │   ├── secret/
│   │   │   │   └── strategy/
│   │   │   ├── technologies/
│   │   │   │   ├── basic/
│   │   │   │   ├── faction/
│   │   │   │   └── unit-upgrades/
│   │   │   ├── leaders/
│   │   │   ├── tiles/
│   │   │   ├── units/
│   │   │   ├── rules/
│   │   │   ├── combat-modifiers/
│   │   │   └── map-templates/
│   │   │
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   └── gameData.ts      # Data API endpoints
│   │   │   ├── middleware/
│   │   │   └── controllers/
│   │   │
│   │   ├── services/
│   │   ├── lobby/
│   │   ├── tournament/
│   │   ├── webrtc/
│   │   ├── chat/
│   │   ├── db/
│   │   ├── admin/
│   │   ├── ai/
│   │   ├── jobs/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── tests/
│   └── package.json
│
├── shared/                            # Shared Between Client & Server
│   ├── src/
│   │   ├── types/                    # TypeScript interfaces
│   │   │   ├── cards.ts
│   │   │   ├── data.ts
│   │   │   ├── factions.ts
│   │   │   ├── index.ts
│   │   │   ├── leaders.ts
│   │   │   ├── technologies.ts
│   │   │   └── tiles.ts
│   │   ├── constants/
│   │   ├── utils/
│   │   └── index.ts
│   └── package.json
│
├── scripts/
│   ├── extraction/                   # Data extraction scripts
│   ├── generation/
│   ├── deployment/
│   ├── setup/
│   ├── maintenance/
│   ├── create-project-structure.sh
│   └── restructure-architecture.sh
│
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE_RESTRUCTURE.md
│   │   ├── CURRENT_PROJECT_STRUCTURE.md (this file)
│   │   ├── ti4-complete-project-structure.md
│   │   └── ti4-complete-tech-spec.md
│   ├── development/
│   │   ├── MIGRATION_FIXES_SUMMARY.md
│   │   ├── test-architecture.md
│   │   └── ti4-implementation-plan.md
│   ├── api/
│   ├── game-rules/
│   ├── extraction/
│   ├── deployment/
│   └── user-guide/
│
├── docker/
├── nginx/
├── monitoring/
├── config/
├── sources/                          # External repositories (git ignored)
│   ├── ti4/
│   ├── ti4calc/
│   ├── ti4_web_new/
│   ├── TI4_map_generator_bot/
│   ├── TwilightImperiumUltimate/
│   └── von-grid/
│
├── .vscode/
├── .husky/
├── node_modules/
├── package.json
├── lerna.json
└── README.md
```

## Architecture Highlights

### ✅ Correct: Server-Side Game Logic
All game logic is now on the server where it belongs:
- `server/src/game/` - Complete game engine
- `server/src/data/` - Full game data
- Server validates ALL actions
- Server manages game state
- Server handles hidden information

### ✅ Correct: Client as Presentation Layer
Client only handles UI and visualization:
- `client/src/components/` - UI components
- `client/src/three/` - 3D rendering
- `client/src/game-client/` - Server connection
- `client/src/visualizers/` - Visual effects

### ✅ Correct: Shared Types
- `shared/src/types/` - TypeScript interfaces used by both

## Data Flow

```
1. User Input (Client)
   ↓
2. Send to Server (WebSocket/API)
   ↓
3. Server Validation
   ↓
4. Game Logic Execution (Server)
   ↓
5. State Update (Server)
   ↓
6. Broadcast to Clients
   ↓
7. UI Update (Client)
```

## Security Benefits

1. **No Client-Side Game Logic** - Prevents cheating
2. **Server Validation** - All moves validated
3. **Hidden Information** - Stays on server
4. **Consistent State** - Single source of truth

## Development Status

### Completed
- ✅ Project structure created
- ✅ Game logic moved to server
- ✅ Data migration to server
- ✅ TypeScript shared types
- ✅ API endpoints created

### In Progress
- 🔧 Boardgame.io integration
- 🔧 Client-server connection
- 🔧 Game engine implementation

### TODO
- ⏳ Implement game rules
- ⏳ Create UI components
- ⏳ Setup WebSocket communication
- ⏳ Add 3D visualization
- ⏳ Implement multiplayer

## File Counts
- **Total Directories**: 371
- **Server Game Directories**: 20
- **Client Component Directories**: 16
- **.gitkeep Files**: 195

## Next Steps

1. Implement `BoardgameIOClient.ts`
2. Setup Boardgame.io server
3. Create game moves and phases
4. Build UI components
5. Test multiplayer functionality

This structure now properly implements a server-authoritative multiplayer game architecture!