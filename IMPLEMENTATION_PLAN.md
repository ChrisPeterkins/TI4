# Twilight Imperium 4th Edition - Online Multiplayer Implementation Plan

## Project Overview

**Goal:** Build an online multiplayer implementation of Twilight Imperium 4th Edition as a practice simulator with exact rule implementation.

**Type:** Hobby project

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Next.js + TypeScript |
| Backend | Node.js + Express/Fastify |
| Database | PostgreSQL (game state, users) |
| Cache/Sessions | Redis |
| Realtime | Socket.io (WebSockets) |
| Hosting | Vercel/Railway + managed Postgres |

---

## Game Content Scope

### Phase 1: Base Game (17 Factions)
1. The Arborec
2. The Barony of Letnev
3. The Clan of Saar
4. The Embers of Muaat
5. The Emirates of Hacan
6. The Federation of Sol
7. The Ghosts of Creuss
8. The L1Z1X Mindnet
9. The Mentak Coalition
10. The Naalu Collective
11. The Nekro Virus
12. Sardakk N'orr
13. The Universities of Jol-Nar
14. The Winnu
15. The Xxcha Kingdom
16. The Yin Brotherhood
17. The Yssaril Tribes

### Phase 2: Prophecy of Kings (+7 Factions, Total: 24)
1. The Argent Flight
2. The Empyrean
3. The Mahact Gene-Sorcerers
4. The Naaz-Rokha Alliance
5. The Nomad
6. The Titans of Ul
7. The Vuil'Raith Cabal

**Additional PoK Content:**
- 8-player support (2 new player colors)
- 40 new system/hyperlane tiles
- Exploration mechanic (planet/frontier exploration cards)
- Mechs (new unit type, faction-specific)
- Leaders (Agent, Commander, Hero per faction)
- Legendary planets & relics

### Phase 3: Codex Updates (+1 Faction, Total: 25)
- The Council Keleres (Codex III)
- Omega card versions (Codex I)
- Alliance mode - 2v2v2 teams (Codex II)
- Additional relics (Codex II)
- Balance updates (Codex IV)

### Phase 4: Thunder's Edge (+5 Factions, Total: 30)
1. Last Bastion
2. The Ral Nel Consortium
3. The Deepwrought Scholarate
4. The Crimson Rebellion
5. The Firmament

**Additional Thunder's Edge Content:**
- Technology Breakthroughs
- The Fracture (external tile region)
- 20 Galactic Events
- Twilight's Fall game mode

---

## Core Game Systems

### 1. Turn Structure / Game Flow

```
Game Round:
├── Strategy Phase
│   └── Players select strategy cards (in speaker order)
├── Action Phase
│   └── Players take turns (in initiative order) until all pass
│       ├── Tactical Action
│       ├── Strategic Action
│       ├── Component Action
│       └── Pass
├── Status Phase
│   ├── Score objectives
│   ├── Reveal objectives
│   ├── Draw action cards
│   ├── Remove command tokens
│   ├── Gain/redistribute command tokens
│   └── Ready cards
└── Agenda Phase (after Mecatol Rex taken)
    ├── Reveal agenda
    ├── Vote
    ├── Resolve outcome
    └── Repeat for second agenda
```

### 2. Map / Board System

**Hex Grid:**
- 51 system tiles (base game)
- Tile types: Blue (planets), Red (anomalies/empty), Green (home systems)
- Adjacency calculations for movement
- Wormhole connections (alpha, beta, gamma, delta)

**Anomalies:**
- Asteroid fields
- Nebulae
- Gravity rifts
- Supernovas
- Hyperlanes (PoK)

**Planets:**
- Resources (yellow) - for production
- Influence (blue) - for voting/command tokens
- Traits: Cultural, Hazardous, Industrial
- Tech specialties: Red, Blue, Green, Yellow
- Legendary planets (PoK)

### 3. Unit System

**Ship Units:**
| Unit | Cost | Combat | Move | Capacity | Notes |
|------|------|--------|------|----------|-------|
| Fighter | 0.5 | 9 | - | - | Requires capacity |
| Destroyer | 1 | 9 | 2 | - | Anti-Fighter Barrage |
| Carrier | 3 | 9 | 1 | 4 | |
| Cruiser | 2 | 7 | 2 | - | |
| Dreadnought | 4 | 5 | 1 | 1 | Sustain Damage, Bombardment |
| War Sun | 12 | 3×3 | 2 | 6 | Sustain Damage, Bombardment |
| Flagship | Varies | Varies | Varies | Varies | Faction-specific |

**Ground Units:**
| Unit | Cost | Combat | Notes |
|------|------|--------|-------|
| Infantry | 0.5 | 8 | |
| Mech | 2 | 6 | Sustain Damage, faction abilities (PoK) |

**Structures:**
| Unit | Cost | Notes |
|------|------|-------|
| PDS | 2 | Space Cannon, Planetary Shield |
| Space Dock | - | Production |

**Unit Abilities:**
- Sustain Damage
- Bombardment
- Space Cannon (Offense/Defense)
- Anti-Fighter Barrage
- Planetary Shield
- Production

### 4. Technology System

**Four Color Trees:**
- Blue (Propulsion): Movement, fleet logistics
- Red (Warfare): Combat bonuses
- Green (Biotic): Resources, infantry
- Yellow (Cybernetic): Production, economy

**Prerequisite System:**
- Technologies require X technologies of specific colors
- Tech specialties on planets can substitute
- Unit upgrades have no color (don't count as prerequisites)

**Base Game Technologies (24):**

*Blue:*
- Antimass Deflectors (0)
- Gravity Drive (1B)
- Fleet Logistics (1B)
- Light/Wave Deflector (3B)
- Dark Energy Tap (1B) - PoK

*Red:*
- Plasma Scoring (0)
- Magen Defense Grid (1R)
- Duranium Armor (2R)
- Assault Cannon (3R)

*Green:*
- Neural Motivator (0)
- Dacxive Animators (1G)
- Hyper Metabolism (2G)
- X-89 Bacterial Weapon (3G)
- Psychoarchaeology (0) - PoK
- Bio-Stims (1G) - PoK

*Yellow:*
- Sarween Tools (0)
- Graviton Laser System (1Y)
- Transit Diodes (2Y)
- Integrated Economy (3Y)
- Scanlink Drone Network (0) - PoK
- AI Development Algorithm (0) - PoK

*Unit Upgrades:*
- Carrier II
- Cruiser II
- Destroyer II
- Dreadnought II
- Fighter II
- Infantry II
- PDS II
- Space Dock II
- War Sun (requires 3R1Y)

### 5. Strategy Cards (8)

| # | Card | Primary Ability | Secondary Ability |
|---|------|-----------------|-------------------|
| 1 | Leadership | Gain 3 command tokens, spend influence for more | Spend influence for command tokens |
| 2 | Diplomacy | Claim planet, others can't activate your systems | Refresh planets |
| 3 | Politics | Draw action cards, become speaker, look at agendas | Draw 2 action cards |
| 4 | Construction | Place PDS/Space Dock | Place 1 PDS or Space Dock |
| 5 | Trade | Refresh commodities, replenish others | Refresh commodities |
| 6 | Warfare | Remove command token, redistribute fleet | Produce units |
| 7 | Technology | Research tech (may spend resources for 2nd) | Research tech (pay 4 resources) |
| 8 | Imperial | Score objective or draw secret, gain VP if on Mecatol | Draw 1 secret objective |

### 6. Combat System

**Space Combat Flow:**
1. Anti-Fighter Barrage (AFB)
2. Announce retreat (optional)
3. Combat round:
   - Roll dice for each ship
   - Hit on combat value or higher
   - Assign hits
4. Repeat until one side eliminated or retreated

**Ground Combat Flow:**
1. Bombardment (before landing)
2. Commit ground forces
3. Space Cannon Defense
4. Combat rounds (same as space combat)
5. Control planet when opponent eliminated

**Special Combat Abilities:**
- Sustain Damage: Cancel one hit, unit becomes damaged
- Bombardment: Roll against ground forces from orbit
- Space Cannon: Roll against ships in/adjacent systems
- Planetary Shield: Cancels bombardment
- Anti-Fighter Barrage: Pre-combat rolls against fighters

### 7. Card Systems

**Action Cards (80+):**
- Various effects with timing windows
- "Play after...", "When...", "At the start of..."
- Sabotage can cancel action cards
- Hand limit of 7

**Agenda Cards (50+):**
- Laws: Permanent effects
- Directives: One-time effects
- For/Against or Elect outcomes

**Objective Cards:**
- Public Stage I (1 VP): Revealed rounds 1-5
- Public Stage II (2 VP): Revealed rounds 4+
- Secret (1 VP): Personal objectives, max 3

**Promissory Notes (5 per player + faction-specific):**
- Support for the Throne
- Trade Agreement
- Ceasefire
- Political Secret
- Alliance (PoK)
- Faction-specific promissory

### 8. Resource Management

**Command Tokens:**
- Tactics Pool: Activate systems
- Fleet Pool: Fleet supply limit
- Strategy Pool: Secondary abilities

**Economy:**
- Resources: Spent on units, technologies
- Influence: Spent on command tokens, voting
- Trade Goods: Wild resource/influence
- Commodities: Tradeable, become trade goods when given away

### 9. Political / Agenda System

**Voting:**
- Spend influence from planets
- Riders (action cards) can add VP conditions
- Elect: Choose player/planet/outcome
- For/Against: Binary vote

**Agenda Types:**
- Laws: Ongoing effects
- Directives: Immediate resolution

### 10. Victory Conditions

- First to 10 VP wins (immediate)
- Sources of VP:
  - Public objectives (1-2 VP each)
  - Secret objectives (1 VP each)
  - Imperial strategy card on Mecatol (1 VP)
  - Custodians token (1 VP)
  - Some agenda outcomes
  - Support for the Throne promissory notes

---

## Data Models

### Core Entities

```typescript
// User & Authentication
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  stats: UserStats;
}

// Game Lobby
interface GameLobby {
  id: string;
  name: string;
  hostId: string;
  players: LobbyPlayer[];
  settings: GameSettings;
  status: 'waiting' | 'drafting' | 'in_progress' | 'completed';
  createdAt: Date;
}

// Full Game State
interface GameState {
  id: string;
  round: number;
  phase: 'strategy' | 'action' | 'status' | 'agenda';
  activePlayerId: string;
  speakerId: string;
  players: PlayerState[];
  map: MapState;
  strategyCards: StrategyCardState[];
  objectives: ObjectiveState;
  agendas: AgendaState;
  actionCardDeck: string[];
  actionCardDiscard: string[];
  laws: Law[];
  custodiansTaken: boolean;
  winner: string | null;
}

// Player State
interface PlayerState {
  id: string;
  oderId: string;
  faction: Faction;
  color: PlayerColor;
  commandTokens: {
    tactics: number;
    fleet: number;
    strategy: number;
  };
  tradeGoods: number;
  commodities: number;
  maxCommodities: number;
  technologies: string[];
  actionCards: string[];
  secretObjectives: string[];
  scoredObjectives: string[];
  promissoryNotes: PromissoryNote[];
  planets: PlanetState[];
  units: UnitState[];
  strategyCard: string | null;
  passed: boolean;
  score: number;
}

// Map State
interface MapState {
  tiles: MapTile[];
  adjacencies: Map<string, string[]>;
}

interface MapTile {
  id: string;
  position: HexPosition;
  systemId: string;
  planets: Planet[];
  anomaly: AnomalyType | null;
  wormhole: WormholeType | null;
  units: UnitState[];
  controlledBy: string | null;
}

// Unit State
interface UnitState {
  id: string;
  type: UnitType;
  ownerId: string;
  location: UnitLocation;
  damaged: boolean;
  upgraded: boolean;
}

// Combat Instance
interface CombatInstance {
  type: 'space' | 'ground';
  systemId: string;
  planetId?: string;
  attackerId: string;
  defenderId: string;
  phase: CombatPhase;
  attackerUnits: UnitState[];
  defenderUnits: UnitState[];
  roundNumber: number;
}
```

### Static Game Data

```typescript
// Faction Definition
interface FactionData {
  id: string;
  name: string;
  abilities: FactionAbility[];
  startingUnits: StartingUnit[];
  startingTech: string[];
  homeSystem: string;
  commodities: number;
  promissoryNote: PromissoryNoteData;
  flagship: FlagshipData;
  mech?: MechData; // PoK
  leaders?: LeaderData; // PoK
  factionTech: TechnologyData[];
}

// Technology Definition
interface TechnologyData {
  id: string;
  name: string;
  type: 'blue' | 'red' | 'green' | 'yellow' | 'unit_upgrade';
  prerequisites: TechPrerequisite[];
  effect: string;
  unitUpgrade?: UnitUpgradeData;
}

// Card Definitions
interface ActionCardData {
  id: string;
  name: string;
  timing: ActionCardTiming;
  effect: string;
  flavor: string;
}

interface AgendaCardData {
  id: string;
  name: string;
  type: 'law' | 'directive';
  electionType: 'for_against' | 'elect_player' | 'elect_planet' | 'elect_other';
  effect: string;
}

interface ObjectiveCardData {
  id: string;
  name: string;
  type: 'stage1' | 'stage2' | 'secret';
  points: number;
  requirement: string;
  timing: 'status' | 'action' | 'agenda';
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Lobby UI │ │ Game     │ │ Hex Map  │ │ Player HUD    │   │
│  │          │ │ Controls │ │ Renderer │ │               │   │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Cards    │ │ Combat   │ │ Tech     │ │ Chat/Trade    │   │
│  │ Display  │ │ Resolver │ │ Tree     │ │ Negotiation   │   │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                     WebSocket + REST API
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                         │
│  ┌───────────────────┐ ┌───────────────────────────────┐    │
│  │ API Routes        │ │ WebSocket Manager             │    │
│  │ - Auth            │ │ - Connection handling         │    │
│  │ - Lobbies         │ │ - Room management             │    │
│  │ - Game Actions    │ │ - State broadcasting          │    │
│  └───────────────────┘ └───────────────────────────────┘    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Game Engine                         │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │  │
│  │  │ State       │ │ Rules       │ │ Action          │  │  │
│  │  │ Manager     │ │ Validator   │ │ Processor       │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘  │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │  │
│  │  │ Combat      │ │ Phase       │ │ Ability         │  │  │
│  │  │ Resolver    │ │ Controller  │ │ Handler         │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────┐ ┌───────────────────────────────┐    │
│  │ Persistence Layer │ │ Static Data Loader            │    │
│  └───────────────────┘ └───────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
       PostgreSQL          Redis           JSON Files
       (Games, Users)    (Sessions,       (Factions, Tech,
                          Cache)           Cards, etc.)
```

---

## Implementation Phases

### Phase 1: Foundation (Estimated Effort: Medium)
- [ ] Project scaffolding (Next.js, Node.js, TypeScript)
- [ ] Database schema design and setup (PostgreSQL)
- [ ] User authentication (register, login, sessions)
- [ ] Game lobby system (create, join, leave, ready up)
- [ ] Basic real-time infrastructure (Socket.io)
- [ ] Static game data loading (JSON files for factions, tech, etc.)
- [ ] Hex map renderer (read-only display)

### Phase 2: Core Game Loop (Estimated Effort: High)
- [ ] Game state machine (phases, turns, rounds)
- [ ] Speaker mechanics
- [ ] Strategy phase (card selection, initiative order)
- [ ] Basic action phase structure
- [ ] Pass mechanism
- [ ] Command token management
- [ ] Status phase (basic flow)

### Phase 3: Tactical Actions (Estimated Effort: High)
- [ ] System activation (place command token)
- [ ] Movement rules and validation
- [ ] Fleet supply enforcement
- [ ] Capacity and transport
- [ ] Wormhole traversal
- [ ] Anomaly effects

### Phase 4: Combat (Estimated Effort: High)
- [ ] Space combat resolution
- [ ] Hit assignment
- [ ] Sustain damage
- [ ] Retreat mechanics
- [ ] Anti-Fighter Barrage
- [ ] Ground combat / invasion
- [ ] Bombardment
- [ ] Space Cannon (offense and defense)
- [ ] Planetary Shield

### Phase 5: Production (Estimated Effort: Medium)
- [ ] Space Dock production
- [ ] Production limits
- [ ] Unit costs and payment
- [ ] Fighter/Infantry half-cost handling

### Phase 6: Technology (Estimated Effort: Medium)
- [ ] Technology research action
- [ ] Prerequisite validation
- [ ] Technology specialties
- [ ] Unit upgrade technologies
- [ ] Technology effects implementation

### Phase 7: Strategy Cards (Estimated Effort: High)
- [ ] Primary abilities (all 8 cards)
- [ ] Secondary abilities (all 8 cards)
- [ ] Timing and resolution

### Phase 8: Cards (Estimated Effort: High)
- [ ] Action card deck management
- [ ] Action card timing windows
- [ ] Action card effects
- [ ] Sabotage mechanics
- [ ] Promissory note trading
- [ ] Promissory note effects

### Phase 9: Politics & Agenda (Estimated Effort: High)
- [ ] Agenda phase trigger (after Mecatol Rex)
- [ ] Custodians token
- [ ] Agenda card reveal
- [ ] Voting system (influence spending)
- [ ] Riders
- [ ] Outcome resolution
- [ ] Law persistence

### Phase 10: Objectives & Victory (Estimated Effort: Medium)
- [ ] Public objective reveal schedule
- [ ] Secret objective draw/scoring
- [ ] Objective requirement checking
- [ ] Victory point tracking
- [ ] Win condition detection
- [ ] Imperial strategy card VP

### Phase 11: Factions - Base Game (Estimated Effort: Very High)
- [ ] Faction ability framework
- [ ] Implement all 17 base faction abilities
- [ ] Faction-specific units (flagships)
- [ ] Faction technologies
- [ ] Faction promissory notes

### Phase 12: Polish & UX (Estimated Effort: Medium)
- [ ] Trade/negotiation UI
- [ ] Chat system
- [ ] Game log/history
- [ ] Undo system (where appropriate)
- [ ] Reconnection handling
- [ ] Spectator mode
- [ ] Game replays

### Phase 13: Prophecy of Kings (Estimated Effort: Very High)
- [ ] 7 new factions
- [ ] Exploration mechanic
- [ ] Relic system
- [ ] Mech units
- [ ] Leaders (Agent, Commander, Hero)
- [ ] Legendary planets
- [ ] New tiles and hyperlanes
- [ ] 8-player support

### Phase 14: Codex & Thunder's Edge (Estimated Effort: High)
- [ ] Council Keleres faction
- [ ] Alliance mode
- [ ] Omega card updates
- [ ] Thunder's Edge factions
- [ ] Galactic Events
- [ ] The Fracture
- [ ] Twilight's Fall mode

---

## Key Technical Challenges

1. **State Complexity**: TI4 game state is massive; need efficient serialization and delta updates
2. **Rules Engine**: Hundreds of edge cases, ability interactions, timing windows
3. **Realtime Sync**: 6-8 players need consistent game state with low latency
4. **Timing Windows**: Action cards can interrupt at many points; need interrupt stack
5. **Undo/Reconnect**: Players disconnect; need robust state recovery
6. **Hex Map Rendering**: Custom canvas/SVG for performance with many units
7. **Faction Abilities**: Each faction modifies rules differently; need flexible ability system

---

## Missing Components Identified (Review Additions)

### 11. Game Setup System (COMPREHENSIVE)

---

#### 11.1 Setup Methods

**A. Standard Setup (Rulebook)**
1. Randomly determine speaker
2. Players choose factions (conflicts resolved by speaker)
3. Deal system tiles by player count
4. Build galaxy by alternating tile placement
5. Place home systems

**B. Milty Draft (Competitive Standard)**
- Balanced pre-game drafting system
- Players draft: Faction + Map Slice + Table Position (including speaker)
- Boustrophedon (snake) draft order

**C. Custom Galaxy**
- Host pre-builds map
- Players draft only factions

---

#### 11.2 System Tile Data

**Tile Categories:**
| Back Color | Contents | Count (Base) | Count (PoK) |
|------------|----------|--------------|-------------|
| Green | Home Systems | 17 | 24 |
| Blue | Planet Systems | 32 | 41+ |
| Red | Anomalies/Empty/Wormholes | 12 | 20+ |

**Base Game Blue Tiles (19-38):**
```
Tile  Planets              Res  Inf  Traits         Tech Spec
───────────────────────────────────────────────────────────────
19    Wellon               1    2    Industrial     Yellow
20    Vefut II             2    2    Hazardous      -
21    Thibah               1    1    Industrial     Blue
22    Tar'mann             1    1    Industrial     Green
23    Saudor               2    2    Industrial     -
24    Mehar Xull           1    3    Hazardous      Red
25    Quann                2    1    Cultural       - (Beta WH)
26    Lodor                3    1    Cultural       - (Alpha WH)
27    New Albion/Starpoint 1+3  1+1  Ind/Haz        Green
28    Tequ'ran/Torkan      2+0  0+3  Haz/Cultural   -
29    Qucen'n/Rarron       1+2  2+2  Cultural/Cult  -
30    Mellon/Zohbat        0+3  2+3  Cultural/Cult  -
31    Lazar/Sakulag        1+3  0+4  Ind/Haz        -
32    Dal Bootha/Xxehan    2+1  0+3  Cultural/Cult  -
33    Corneeq/Resculon     1+2  2+0  Cultural/Cult  -
34    Centauri/Gral        1+1  3+1  Cultural/Ind   -
35    Bereg/Lirta IV       3+2  1+3  Haz/Haz        -
36    Arnor/Lor            2+1  1+2  -/-            -
37    Arinam/Meer          1+0  2+4  Ind/Cult       Red
38    Abyz/Fria            3+2  0+0  Haz/Haz        -
```

**Base Game Red Tiles (39-50):**
```
Tile  Type              Special
───────────────────────────────
39    Alpha Wormhole    Empty + A wormhole
40    Beta Wormhole     Empty + B wormhole
41    Gravity Rift      Anomaly - risky movement
42    Nebula            Anomaly - combat modifier
43    Supernova         Anomaly - impassable
44    Asteroid Field    Anomaly - blocks non-special movement
45    Asteroid Field    Anomaly (2nd copy)
46-50 Empty Space       Blank tiles (5 total)
```

**PoK Additions (59-82+):**
- Additional planet tiles
- Gamma wormhole tiles
- Legendary planet tiles (Primor, Mallice, Hope's End, etc.)
- Frontier tokens (for exploration)
- Hyperlane tiles

---

#### 11.3 Tile Tier System (for Milty Draft)

**Optimal Value Calculation:**
```typescript
function calculateOptimalValue(resources: number, influence: number): number {
  if (resources === influence) {
    return resources; // Split value
  }
  return Math.max(resources, influence);
}

function calculateSystemValue(planets: Planet[]): number {
  return planets.reduce((sum, p) => sum + calculateOptimalValue(p.resources, p.influence), 0);
}
```

**Tier Assignments (Base Game Blue Tiles):**
| Tier | Criteria | Example Tiles |
|------|----------|---------------|
| High (A) | Optimal Value 6+ | 35 (Bereg/Lirta), 31 (Lazar/Sakulag), 38 (Abyz/Fria) |
| Medium (B) | Optimal Value 4-5 | 29, 30, 34, 37 |
| Low (C) | Optimal Value 1-3 | 19, 20, 21, 22, 23, 24, 25, 26 |

**Slice Composition Rules:**
- Each slice gets: 1 High + 1 Medium + 1 Low + 2 Red tiles
- Minimum resource threshold per slice
- Minimum influence threshold per slice
- No two same-type wormholes in one slice
- No adjacent anomalies in one slice

---

#### 11.4 Milty Draft Algorithm

**Step 1: Generate Slices**
```typescript
interface Slice {
  id: number;
  tiles: SystemTile[];
  totalResources: number;
  totalInfluence: number;
  optimalValue: number;
  wormholes: WormholeType[];
  anomalies: AnomalyType[];
  techSpecialties: TechColor[];
  hasLegendary: boolean;
}

function generateSlices(playerCount: number, options: SliceOptions): Slice[] {
  const slices: Slice[] = [];
  const blueTiles = shuffleTilesByTier(getBlueTiles());
  const redTiles = shuffle(getRedTiles());

  for (let i = 0; i < playerCount; i++) {
    let slice: Slice;
    let attempts = 0;

    do {
      slice = {
        id: i,
        tiles: [
          drawFromTier(blueTiles, 'high'),
          drawFromTier(blueTiles, 'medium'),
          drawFromTier(blueTiles, 'low'),
          redTiles.pop(),
          redTiles.pop()
        ],
        // ... calculate totals
      };
      attempts++;
    } while (!validateSlice(slice, options) && attempts < MAX_ATTEMPTS);

    slices.push(slice);
  }

  return balanceSlices(slices, options);
}

function validateSlice(slice: Slice, options: SliceOptions): boolean {
  // Check minimum thresholds
  if (slice.totalResources < options.minResources) return false;
  if (slice.totalInfluence < options.minInfluence) return false;
  if (slice.optimalValue < options.minOptimal) return false;
  if (slice.optimalValue > options.maxOptimal) return false;

  // Check wormhole constraint
  const wormholeCounts = countBy(slice.wormholes);
  if (Object.values(wormholeCounts).some(c => c > 1)) return false;

  // Check anomaly adjacency (handled during placement)
  return true;
}
```

**Step 2: Draft Order**
```typescript
type DraftPick = 'faction' | 'slice' | 'position';

interface DraftState {
  round: number;
  currentPicker: number;
  order: number[]; // Player indices
  picks: Map<number, { faction?: string; slice?: number; position?: number }>;
  availableFactions: string[];
  availableSlices: number[];
  availablePositions: number[]; // Includes speaker (position 0)
}

function getDraftOrder(playerCount: number): number[][] {
  const firstRound = shuffle(range(playerCount));
  const secondRound = [...firstRound].reverse();
  const thirdRound = [...firstRound];
  return [firstRound, secondRound, thirdRound];
}

// Each round, player picks ONE of: faction, slice, or position
// Must have all three by end of round 3
```

**Step 3: Map Assembly**
```typescript
interface MapPosition {
  ring: number;      // 0 = Mecatol, 1-3 = rings outward
  index: number;     // Position within ring
  sliceOwner?: number; // Which player's slice this belongs to
}

function assembleMap(slices: Slice[], positions: number[]): GameMap {
  const map = new HexMap();

  // Place Mecatol Rex at center
  map.place(MECATOL_REX, { ring: 0, index: 0 });

  // Place home systems based on position draft
  positions.forEach((playerId, posIndex) => {
    const homePos = getHomeSystemPosition(posIndex, positions.length);
    map.place(getHomeSystem(playerId), homePos);
  });

  // Place slice tiles
  slices.forEach((slice, sliceIndex) => {
    const slicePositions = getSlicePositions(sliceIndex, positions.length);
    slice.tiles.forEach((tile, tileIndex) => {
      map.place(tile, slicePositions[tileIndex]);
    });
  });

  return map;
}
```

---

#### 11.5 Slice Positions (6-Player Example)

```
                    [R2-0]
              [R2-5]      [R2-1]
        [R3-5]                  [R3-1]
  [HS-5]      [R1-5]      [R1-0]      [HS-0]
        [R3-4]      [MR]        [R3-0]
  [HS-4]      [R1-4]      [R1-1]      [HS-1]
        [R3-3]                  [R3-2]
              [R2-4]      [R2-2]
                    [R2-3]
        [HS-3]              [HS-2]

Legend:
- MR = Mecatol Rex (center)
- HS-X = Home System for player X
- R1-X = Ring 1 position X (inner ring, closest to Mecatol)
- R2-X = Ring 2 position X (middle ring)
- R3-X = Ring 3 position X (outer ring, adjacent to home systems)

Slice Ownership (6 players):
- Player 0's slice: R1-0, R2-0, R2-1, R3-0, R3-1
- Player 1's slice: R1-1, R2-1, R2-2, R3-1, R3-2
- etc.

Note: R2 positions are "equidistant" tiles, shared between adjacent slices
```

---

#### 11.6 Home System Placement

**Per-Player-Count Configurations:**
| Players | Home System Positions | Galaxy Rings |
|---------|----------------------|--------------|
| 3 | 0, 2, 4 (every other) | 2 |
| 4 | 0, 1, 3, 4 | 2 |
| 5 | Uses hyperlanes | 3 |
| 6 | 0, 1, 2, 3, 4, 5 | 3 |
| 7 | Uses hyperlanes | 3 |
| 8 | Uses hyperlanes | 3 |

---

#### 11.7 Faction Selection

**Faction Pool:**
- Base Game: 17 factions
- With PoK: 24 factions
- With Codex III: 25 factions
- With Thunder's Edge: 30 factions

**Draft Methods:**

**A. Milty Draft (integrated)**
- Factions are part of 3-way draft with slice and position

**B. Blind Pick**
- Each player secretly selects from available factions
- Conflicts resolved by speaker choice or random

**C. Ban/Pick Draft**
- Players take turns banning factions
- Then pick in snake order

**D. Pool Draft**
- Random pool of N+2 factions dealt to each player
- Players select one, pass remainder

---

#### 11.8 Setup Data Requirements

**Static Data Files Needed:**

```
/data
├── tiles/
│   ├── base-game-tiles.json      # Tiles 1-50
│   ├── pok-tiles.json            # Tiles 51-82+
│   └── hyperlanes.json           # Hyperlane configurations
├── factions/
│   ├── base-game-factions.json   # 17 factions
│   ├── pok-factions.json         # 7 factions
│   └── ...
├── maps/
│   ├── preset-3p.json
│   ├── preset-4p.json
│   ├── preset-5p-hyperlane.json
│   ├── preset-6p.json
│   ├── preset-7p-hyperlane.json
│   └── preset-8p-hyperlane.json
└── draft/
    └── tile-tiers.json           # Tier assignments for Milty
```

**Tile Data Schema:**
```typescript
interface SystemTileData {
  id: number;
  name: string;
  type: 'blue' | 'red' | 'green';
  planets: PlanetData[];
  wormhole?: 'alpha' | 'beta' | 'gamma' | 'delta';
  anomaly?: 'asteroid' | 'nebula' | 'supernova' | 'gravity_rift';
  frontier?: boolean; // PoK - has frontier token
  legendary?: boolean;
  expansion: 'base' | 'pok' | 'thunders_edge';
}

interface PlanetData {
  name: string;
  resources: number;
  influence: number;
  trait?: 'cultural' | 'hazardous' | 'industrial';
  techSpecialty?: 'blue' | 'red' | 'green' | 'yellow';
  legendary?: boolean;
}
```

---

#### 11.9 Implementation Tasks (Setup System)

**Phase 1: Core Setup**
- [ ] System tile data entry (all tiles with planets, wormholes, anomalies)
- [ ] Faction data entry (starting units, tech, abilities)
- [ ] Map position/ring calculation for 3-8 players
- [ ] Hex coordinate system implementation
- [ ] Adjacency calculation (including wormholes)

**Phase 2: Standard Setup**
- [ ] Tile distribution by player count
- [ ] Tile dealing UI
- [ ] Galaxy building (alternating placement)
- [ ] Placement validation (no adjacent same-wormholes, no adjacent anomalies)
- [ ] Home system attachment

**Phase 3: Milty Draft**
- [ ] Tile tier assignment data
- [ ] Optimal value calculation
- [ ] Slice generation algorithm
- [ ] Slice validation (thresholds, constraints)
- [ ] Slice balancing/regeneration
- [ ] 3-round draft UI
- [ ] Draft state management
- [ ] Map assembly from draft results

**Phase 4: Faction Draft**
- [ ] Faction pool configuration
- [ ] Multiple draft mode support (Milty, blind, ban/pick, pool)
- [ ] Draft timer (optional)
- [ ] Starting unit placement automation
- [ ] Starting technology assignment

**Phase 5: Advanced**
- [ ] Hyperlane support (5/7/8 player)
- [ ] Custom map editor
- [ ] Map import/export (compatible with TI4 Map Lab format)
- [ ] Preset balanced maps
- [ ] PoK legendary planet / frontier token placement

### 12. Transaction System (EXPANDED)

**Neighbor Definition:**
- Players are neighbors if they both have units or control planets in:
  - The same system, OR
  - Adjacent systems (including via wormholes)
- Ghosts of Creuss "Quantum Entanglement" creates one-way adjacency

**Transaction Rules:**
- Active player may resolve ONE transaction per neighbor per turn
- Can transact at any time during turn (even during combat!)
- Tradeable items:
  - Trade goods (any number)
  - Commodities (any number) - become trade goods when received
  - Promissory notes (max 1 per transaction)
  - Relic fragments (PoK, any number)
  - Action cards (Hacan only)

**Edge Cases:**
- If you become neighbors mid-turn, you can transact
- If you stop being neighbors after transacting, then become neighbors again, you cannot transact again
- Combat transactions allowed with opponent if neighbors in active system

**Agenda Phase Exception:**
- Can transact with ANY player (not just neighbors)
- One transaction per player per agenda (not per phase)

**Binding vs Non-Binding Deals:**
- Binding: Terms can be resolved immediately
- Non-binding: Future promises (not enforceable by game rules)

**Implementation Tasks:**
- [ ] Neighbor calculation (including wormholes)
- [ ] Transaction tracking per turn
- [ ] Trade offer UI
- [ ] Binding deal validation
- [ ] Agenda phase transaction mode

### 13. Timing System / Action Stack (CRITICAL - UNDERSPECIFIED)

**Timing Keywords:**
- **"When"**: Happens AT the moment of the trigger (can modify/replace)
- **"After"**: Happens immediately following the trigger
- "When" resolves BEFORE "after"

**Simultaneous Ability Resolution:**
When multiple abilities trigger at the same time:
1. Each player takes turn resolving ONE ability (initiative order)
2. Repeat until all players have resolved all desired abilities

**Sabotage Timing:**
- Played AFTER targets are declared
- Played BEFORE effects resolve, votes cast, or dice rolled

**Implementation Tasks:**
- [ ] Timing window framework
- [ ] Action/ability stack
- [ ] Initiative-order resolution for simultaneous triggers
- [ ] Interrupt points for action cards
- [ ] "When" vs "After" distinction in ability system

### 14. Status Phase (COMPLETE 8 STEPS)

```
Status Phase (in strict order):
1. Score Objectives     - Each player may score 1 public + 1 secret (initiative order)
2. Reveal Objective     - Speaker reveals next public objective
3. Draw Action Cards    - Each player draws 1 action card (initiative order)
4. Remove Command Tokens - All command tokens removed from board
5. Gain Command Tokens  - Each player gains 2 tokens, may redistribute ALL tokens
6. Ready Cards          - All exhausted cards readied (planets, tech, strategy cards)
7. Repair Units         - All damaged units repaired (Sustain Damage reset)
8. Return Strategy Cards - Strategy cards returned to common area
   → If custodians taken: proceed to Agenda Phase
   → Otherwise: new round begins with Strategy Phase
```

**Implementation Tasks:**
- [ ] Enforce step order
- [ ] Objective scoring validation
- [ ] Stage I before Stage II reveal rule
- [ ] Action card hand limit check (7 cards)
- [ ] Command token redistribution UI

### 15. Exploration System - PoK (EXPANDED)

**Four Exploration Decks:**
| Deck | Trigger | Card Count |
|------|---------|------------|
| Cultural | Take control of cultural planet | 20 |
| Industrial | Take control of industrial planet | 20 |
| Hazardous | Take control of hazardous planet | 20 |
| Frontier | Explore frontier token (requires Dark Energy Tap tech) | 20 |

**Exploration Rules:**
- Triggered when taking control of uncontrolled planet
- Draw from deck matching planet trait
- Multi-trait planets: player chooses which deck
- Mecatol Rex and home system planets cannot be explored

**Card Types:**
- Immediate effects (resolve and discard)
- Attach cards (attach to planet, modify it permanently)
- Relic fragments (keep in play area)

**Relic Fragments:**
- Three types: Cultural, Industrial, Hazardous
- Unknown (from Frontier) = wild
- Purge 3 matching fragments → draw 1 Relic card

**Attach Mechanic:**
- Card attaches to planet card
- Modifies planet's resources, influence, or abilities
- Stays until planet changes control or card effect removes it

**Implementation Tasks:**
- [ ] Four exploration deck management
- [ ] Exploration trigger detection
- [ ] Attach card system for planets
- [ ] Relic fragment tracking
- [ ] Relic deck and purge mechanic

### 16. Leaders System - PoK (EXPANDED)

Each faction has 3 leaders:

**Agent:**
- Available from game start
- Can be used once per round (exhausts)
- Readies during Status Phase

**Commander:**
- Starts locked
- Unlock condition varies by faction
- Once unlocked, ability is always active
- Other players can use via Alliance promissory note

**Hero:**
- Starts locked
- Unlock requires 3 scored objectives
- Extremely powerful one-time ability
- Purged after use (removed from game)

**Implementation Tasks:**
- [ ] Leader state tracking (locked/unlocked/exhausted/purged)
- [ ] Unlock condition checking per faction
- [ ] Agent exhaustion/ready cycle
- [ ] Hero purge mechanic
- [ ] Alliance promissory note commander sharing

### 17. Critical Edge Cases & FAQ Rules

**Dice:**
- "0" on d10 = 10 (always a hit)

**Combat:**
- If neither side can mathematically win, attacker MUST retreat
- Multiple "Direct Hit" cards legal if targeting different units
- "Direct Hit" works on hits from abilities (Ambush, etc.)

**Movement:**
- Fighters can block ship movement (they are ships!)
- "Skilled Retreat" can pick up/transport units if capacity allows

**Production:**
- All produced units must be paid for (even from non-Production abilities)
- "Sarween Tools" only applies to Production ability, not other production effects
- Multiple production abilities in same system stack

**Objectives:**
- "Turn Their Fleets to Dust" NOT fulfilled via "Direct Hit"
- Cannot score public objectives without controlling all home system planets
- CAN score secret objectives without home system control

**Naalu:**
- Cannot gain planet control using only fighters (results in draw)

**Nekro:**
- Can hold both standard AND faction-specific unit upgrades
- Cannot copy printed faction units via "Valefar Assimilator"

**Hidden Information:**
- Players MAY voluntarily reveal hidden info (action cards, secrets)

**Implementation Tasks:**
- [ ] Edge case test suite
- [ ] FAQ rules encoded in validators
- [ ] Combat mathematical impossibility detection
- [ ] Home system control checking for objectives

### 18. Game Variants

**Player Counts:**
- 3-4 players: Each player picks 2 strategy cards
- 5-6 players: Standard rules
- 7-8 players: Requires PoK, uses hyperlanes

**Alliance Mode (Codex II):**
- 2v2v2 team variant
- Shared victory, special team rules

**14-Point Game:**
- Extended variant for longer games

**Twilight's Fall (Thunder's Edge):**
- Franken-draft custom faction building
- Almost entirely different game mode

**Implementation Tasks:**
- [ ] Player count configurations
- [ ] 2-strategy-card mode for 3-4 players
- [ ] Alliance mode team tracking
- [ ] Hyperlane tile support

### 19. UI/UX Considerations (ADDED)

**Hidden Information Management:**
- Action cards visible only to owner
- Secret objectives visible only to owner
- Hand counts visible to all
- Promissory notes in hand visible to owner

**Real-time Features:**
- Turn timer (optional)
- "Thinking" indicator
- Transaction request notifications
- Action card play windows (pause for responses)

**Game Log:**
- Complete action history
- Dice roll results
- State change tracking
- Exportable for analysis

**Accessibility:**
- Color-blind friendly player colors
- Keyboard navigation
- Screen reader support for card text

**Implementation Tasks:**
- [ ] Hidden state filtering per player
- [ ] Turn timer system
- [ ] Notification system
- [ ] Comprehensive game log
- [ ] Accessibility audit

---

## Resources

### Official
- [Fantasy Flight Games - TI4](https://www.fantasyflightgames.com/en/products/twilight-imperium-fourth-edition/)
- [Official Rules PDF](https://images-cdn.fantasyflightgames.com/filer_public/c2/69/c269b9e2-8d9a-420b-a807-2b164dd54977/ti-k0289_rules_referencecompressed.pdf)

### Community
- [TI4 Rules Reference](https://ti4rules.github.io/reference/)
- [Twilight Imperium Wiki](https://twilight-imperium.fandom.com/wiki/Twilight_Imperium_Wiki)
- [TI Rules Help](https://www.tirules.com/)
- [BoardGameGeek - TI4](https://boardgamegeek.com/boardgame/233078/twilight-imperium-fourth-edition)

### Code References
- [TI4-TTS GitHub](https://github.com/DangerousGoods/TI4-TTS) - Tabletop Simulator scripting
- [TTS-TwilightImperium](https://github.com/TwilightImperiumContentCreators/TTS-TwilightImperium)

---

## Notes

- This is a hobby project for practice/simulation purposes
- Goal is exact rule implementation
- Start with base game, expand to PoK and beyond
- Prioritize core gameplay loop before edge cases

---

## Frontend Visual Systems

### 20. Rendering Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dimension | **2D Top-Down** | Simpler, faster dev, like TTS |
| Renderer | **Pixi.js** | High-performance 2D WebGL |
| Assets | **Existing GitHub repos** | KeeganW/ti4 has 312 tile images |

---

### 21. Asset Sources

#### Primary Asset Sources

**1. [KeeganW/ti4](https://github.com/KeeganW/ti4/tree/master/public/tiles) - System Tiles**
- **312 tile images** in WebP format
- Naming convention: `ST_{number}.webp` (e.g., `ST_18.webp` for Mecatol Rex)
- Includes base game + PoK + hyperlane tiles
- Variants: `ST_18_Back.webp`, `ST_83A.webp`, `ST_83B.webp`

**2. [Twilight Imperium Wiki](https://twilight-imperium.fandom.com/) - Everything Else**

The Fandom wiki has extensive image assets hosted at `static.wikia.nocookie.net`:

| Asset Type | Available | URL Pattern |
|------------|-----------|-------------|
| Unit Plastics | All 11 types | `/twilight-imperium-4/images/.../[Unit]_Plastic.png` |
| Faction Symbols | All 30 | `/twilight-imperium-4/images/.../[Faction].png` |
| Faction Sheets | Front + Back | `/twilight-imperium-4/images/.../[Faction]1.jpg`, `[Faction]2.jpg` |
| Home Systems | All 30 | `/twilight-imperium-4/images/.../[Faction]HomeSystem.png` |
| Leaders (PoK) | Agent/Commander/Hero | `/twilight-imperium-4/images/.../[Faction]AgentP.jpg` |
| Mech Cards | All factions | `/twilight-imperium-4/images/.../[Faction]Mech.jpg` |
| Tech Cards | Most techs | On individual tech pages |
| Strategy Cards | All 8 | On Strategy Cards page |
| Promissory Notes | Faction-specific | On faction pages |

**Example URLs (Emirates of Hacan):**
```
Symbol:      .../images/f/f8/Hacan.png
Sheet Front: .../images/b/b9/Hacan1.jpg
Sheet Back:  .../images/c/cc/Hacan2.jpg
Home System: .../images/4/43/HacanHomeSystem.png
Agent:       .../images/6/63/HacanAgentP.jpg
Commander:   .../images/2/2f/HacanCommanderP.jpg
Hero:        .../images/a/a4/HacanHeroP.jpg
Mech:        .../images/7/76/HacanMech.jpg
```

**3. Additional GitHub Sources**
- [TTS-TwilightImperium](https://github.com/TwilightImperiumContentCreators/TTS-TwilightImperium) - `/assets` folder
- [ti4-mapbuilder](https://github.com/gstilwell/ti4-mapbuilder) - "thousands of images"

---

#### Asset Acquisition Strategy

| Asset Type | Count | Source | Status |
|------------|-------|--------|--------|
| System Tiles | 90+ | KeeganW/ti4 | ✅ Ready (WebP) |
| Home System Tiles | 30 | KeeganW/ti4 OR Wiki | ✅ Ready |
| Hyperlane Tiles | 20+ | KeeganW/ti4 | ✅ Ready |
| Unit Plastics | 11 | Wiki | ✅ Ready (PNG) |
| Faction Symbols | 30 | Wiki | ✅ Ready (PNG) |
| Faction Sheets | 30×2 | Wiki | ✅ Ready (JPG) |
| Leader Cards | 30×3 | Wiki | ✅ Ready (JPG) |
| Mech Cards | 30 | Wiki | ✅ Ready (JPG) |
| Technology Cards | 80+ | Wiki (individual pages) | ⚠️ Need to scrape |
| Strategy Cards | 8 | Wiki | ✅ Ready |
| Action Cards | 80+ | Text-based | 📝 Use text rendering |
| Objective Cards | 40+ | Text-based | 📝 Use text rendering |
| Planet Cards | 80+ | Text-based | 📝 Use text rendering |
| Promissory Notes | 30+ | Wiki (faction pages) | ⚠️ Need to scrape |
| Command Tokens | 8 colors | Create | 🎨 Simple SVG |
| Control Markers | 8 colors | Create | 🎨 Simple SVG |

**Legend:** ✅ Ready | ⚠️ Need to scrape | 📝 Text-based | 🎨 Create ourselves

---

#### Asset Scraping Plan

For assets that need scraping from the wiki, we'll create a one-time script:

```typescript
// scripts/scrape-wiki-assets.ts
const WIKI_BASE = 'https://twilight-imperium.fandom.com';

const FACTION_IDS = [
  'Arborec', 'Barony_of_Letnev', 'Clan_of_Saar', /* ... */
];

async function scrapeFactionAssets(factionId: string) {
  const pageUrl = `${WIKI_BASE}/wiki/The_${factionId}`;
  // Parse HTML, extract image URLs
  // Download to /public/assets/factions/{factionId}/
}

async function scrapeTechCards() {
  const techListUrl = `${WIKI_BASE}/wiki/Technology`;
  // Get list of all techs, visit each page, extract card image
  // Download to /public/assets/tech/
}
```

---

#### Cards Without Images (Text Rendering)

For Action Cards, Objectives, and Planet Cards, we'll render them programmatically:

```typescript
// components/cards/ActionCard.tsx
interface ActionCardProps {
  name: string;
  timing: string;
  effect: string;
  flavor?: string;
}

function ActionCard({ name, timing, effect, flavor }: ActionCardProps) {
  return (
    <div className="action-card bg-gradient-to-b from-purple-900 to-purple-950
                    rounded-lg border-2 border-purple-400 p-3 w-48 h-72">
      <div className="text-xs text-purple-300 uppercase">{timing}</div>
      <div className="text-lg font-bold text-white mt-1">{name}</div>
      <div className="text-sm text-gray-200 mt-3 leading-tight">{effect}</div>
      {flavor && (
        <div className="text-xs text-gray-400 italic mt-auto">{flavor}</div>
      )}
    </div>
  );
}
```

This approach:
- No copyright concerns (we're displaying game text, not reproducing art)
- Faster to implement
- Easier to update/fix
- Can add official images later if desired

---

### 22. Tech Stack (Frontend)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND STACK                            │
├─────────────────────────────────────────────────────────────┤
│ Framework:        Next.js 14+ (App Router)                  │
│ Language:         TypeScript                                 │
│ Styling:          Tailwind CSS                              │
│ UI Components:    shadcn/ui (Radix primitives)              │
│ State:            Zustand (game state) + React Query        │
│ Realtime:         Socket.io-client                          │
├─────────────────────────────────────────────────────────────┤
│ RENDERING LAYER                                              │
├─────────────────────────────────────────────────────────────┤
│ 2D Renderer:      Pixi.js v8 (@pixi/react)                  │
│ Hex Math:         honeycomb-grid (npm)                      │
│ Animations:       Pixi.js built-in + GSAP                   │
│ UI Animations:    Framer Motion                             │
├─────────────────────────────────────────────────────────────┤
│ UTILITIES                                                    │
├─────────────────────────────────────────────────────────────┤
│ Icons:            Lucide React                              │
│ Forms:            React Hook Form + Zod                     │
│ Drag & Drop:      @dnd-kit/core                             │
│ Tooltips:         Radix Tooltip                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 23. Application Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER BAR                                                           │
│ [Logo] [Game: "Chris's Game"] [Round 3] [Phase: Action] [Settings]  │
├─────────────────┬───────────────────────────────────┬───────────────┤
│                 │                                   │               │
│  LEFT SIDEBAR   │         MAIN GAME AREA           │ RIGHT SIDEBAR │
│                 │                                   │               │
│  ┌───────────┐  │    ┌─────────────────────────┐   │ ┌───────────┐ │
│  │ Strategy  │  │    │                         │   │ │ Player    │ │
│  │ Cards     │  │    │                         │   │ │ List      │ │
│  │           │  │    │      HEX MAP            │   │ │           │ │
│  │ [1] Lead  │  │    │      (Pixi.js)          │   │ │ P1: 4 VP  │ │
│  │ [2] Diplo │  │    │                         │   │ │ P2: 3 VP  │ │
│  │ [3] Polit │  │    │                         │   │ │ P3: 5 VP* │ │
│  │ ...       │  │    │                         │   │ │ ...       │ │
│  └───────────┘  │    └─────────────────────────┘   │ └───────────┘ │
│                 │                                   │               │
│  ┌───────────┐  │    ┌─────────────────────────┐   │ ┌───────────┐ │
│  │ Objectives│  │    │ CONTEXT PANEL           │   │ │ Chat /    │ │
│  │           │  │    │ (Combat, Production,    │   │ │ Trade     │ │
│  │ Public:   │  │    │  Tech Tree, Voting)     │   │ │ Log       │ │
│  │ □ Spend 8 │  │    └─────────────────────────┘   │ │           │ │
│  │ □ 2 Tech  │  │                                   │ │           │ │
│  └───────────┘  │                                   │ └───────────┘ │
├─────────────────┴───────────────────────────────────┴───────────────┤
│ PLAYER HUD (YOUR FACTION)                                            │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [Faction Icon] The Emirates of Hacan     💰 12  🔵 8  ⚙️ 3/3/2  │ │
│ │                                                                   │ │
│ │ [Tech: 6 owned]  [Planets: 8]  [Hand: 4 cards]  [Secrets: 1]    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 24. Hex Map Rendering (Pixi.js)

#### Hex Coordinate System
Using **axial coordinates** (q, r) with pointy-top hexagons:

```typescript
// Hex coordinate types
interface HexCoord {
  q: number;  // Column
  r: number;  // Row
}

// Convert hex to pixel position
function hexToPixel(hex: HexCoord, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * hex.q + Math.sqrt(3) / 2 * hex.r);
  const y = size * (3 / 2 * hex.r);
  return { x, y };
}

// Get hex from pixel (for click detection)
function pixelToHex(x: number, y: number, size: number): HexCoord {
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
  const r = (2 / 3 * y) / size;
  return hexRound({ q, r });
}
```

#### Map Layers (Pixi.js Containers)

```typescript
// Layer hierarchy (bottom to top)
const mapLayers = {
  background: Container,      // Space background, stars
  tiles: Container,           // System tile images
  overlays: Container,        // Wormhole connections, anomaly effects
  units: Container,           // Ship and ground unit tokens
  tokens: Container,          // Command tokens, control markers
  selection: Container,       // Highlight rings, selection indicators
  ui: Container,              // Floating labels, tooltips
};
```

#### Tile Rendering

```typescript
interface TileSprite {
  tileId: number;
  sprite: Sprite;
  position: HexCoord;
  rotation: number;          // 0-5 for 60° increments
  planets: PlanetOverlay[];
  units: UnitToken[];
  commandToken?: CommandToken;
}

// Load tile from KeeganW/ti4 assets
async function loadTileTexture(tileId: number): Promise<Texture> {
  const url = `/assets/tiles/ST_${tileId}.webp`;
  return await Assets.load(url);
}
```

#### Unit Token Rendering

```typescript
interface UnitToken {
  unitType: UnitType;
  playerId: string;
  count: number;           // Stack count for fighters/infantry
  damaged: boolean;
  position: 'space' | { planetIndex: number };
}

// Unit tokens as colored shapes with icons
const UNIT_SHAPES = {
  fighter: 'triangle',
  infantry: 'circle',
  destroyer: 'diamond',
  carrier: 'rectangle',
  cruiser: 'hexagon',
  dreadnought: 'octagon',
  warsun: 'star',
  flagship: 'custom',      // Faction-specific
  pds: 'square',
  spacedock: 'pentagon',
  mech: 'shield',
};
```

---

### 25. UI Components

#### Card Display System

```typescript
// Card component variants
type CardSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'fullscreen';

interface CardDisplayProps {
  card: CardData;
  size: CardSize;
  faceDown?: boolean;
  exhausted?: boolean;
  onClick?: () => void;
  onHover?: () => void;
}

// Cards can be image-based or text-based
interface CardData {
  id: string;
  name: string;
  type: CardType;
  imageUrl?: string;        // Optional - use text rendering if missing
  text: string;
  flavor?: string;
}
```

#### Context Panels (Modals/Drawers)

| Panel | Trigger | Contents |
|-------|---------|----------|
| Combat | Space/ground combat starts | Dice roller, hit assignment, retreat options |
| Production | Build step of tactical action | Unit costs, production limits, queue |
| Technology | Research action | Tech tree visualization, prerequisites |
| Agenda | Agenda phase | Current agenda, voting interface, riders |
| Trade | Transaction initiated | Offer builder, neighbor detection |
| System Detail | Click on system | Planets, units, control, actions available |

---

### 26. Animation System

#### Required Animations

```typescript
// Animation definitions
const ANIMATIONS = {
  // Unit Movement
  unitMove: {
    type: 'tween',
    duration: 500,
    easing: 'easeInOutQuad',
    path: 'arc',              // Slight arc for visual interest
  },

  // Combat
  diceRoll: {
    type: 'sequence',
    steps: ['spin', 'settle', 'highlight'],
    duration: 1200,
  },
  hitFlash: {
    type: 'flash',
    color: 0xff0000,
    duration: 200,
  },
  unitDestroy: {
    type: 'particle',
    effect: 'explosion',
    duration: 400,
  },

  // Cards
  cardDraw: {
    type: 'slide',
    from: 'deck',
    to: 'hand',
    duration: 300,
  },
  cardPlay: {
    type: 'zoom',
    to: 'center',
    duration: 400,
  },

  // Tokens
  tokenPlace: {
    type: 'drop',
    bounce: true,
    duration: 250,
  },

  // Phase Transitions
  phaseChange: {
    type: 'overlay',
    text: 'ACTION PHASE',
    duration: 1500,
  },
};
```

#### Animation Implementation (GSAP + Pixi.js)

```typescript
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

gsap.registerPlugin(PixiPlugin);

// Example: Animate unit movement
function animateUnitMove(
  sprite: Sprite,
  from: HexCoord,
  to: HexCoord,
  onComplete: () => void
) {
  const fromPixel = hexToPixel(from, HEX_SIZE);
  const toPixel = hexToPixel(to, HEX_SIZE);

  // Arc path via control point
  const midX = (fromPixel.x + toPixel.x) / 2;
  const midY = (fromPixel.y + toPixel.y) / 2 - 50; // Arc upward

  gsap.to(sprite, {
    duration: 0.5,
    motionPath: {
      path: [
        { x: fromPixel.x, y: fromPixel.y },
        { x: midX, y: midY },
        { x: toPixel.x, y: toPixel.y },
      ],
      curviness: 1.5,
    },
    ease: 'power2.inOut',
    onComplete,
  });
}
```

---

### 27. Responsive Design

```
┌─────────────────────────────────────────────────────────────┐
│ BREAKPOINTS                                                  │
├─────────────────────────────────────────────────────────────┤
│ Desktop (1920px+):  Full layout as shown above              │
│ Laptop (1280-1919): Collapsible sidebars                    │
│ Tablet (768-1279):  Bottom drawer for HUD, floating panels  │
│ Mobile (< 768):     NOT SUPPORTED (game too complex)        │
└─────────────────────────────────────────────────────────────┘
```

#### Desktop Layout
- Fixed sidebars (left: strategy/objectives, right: players/chat)
- Full hex map with zoom/pan
- Persistent bottom HUD

#### Laptop Layout
- Collapsible sidebars (icon-only when collapsed)
- Slightly smaller hex tiles
- Same HUD

#### Tablet Layout
- No sidebars - use overlay panels
- Swipe gestures for panels
- Bottom sheet for HUD (expandable)
- Touch-optimized hex selection

---

### 28. State Management (Frontend)

```typescript
// Zustand store structure
interface GameUIStore {
  // View state
  camera: { x: number; y: number; zoom: number };
  selectedSystem: string | null;
  selectedUnits: string[];
  hoveredElement: HoverTarget | null;

  // Panel state
  activePanels: PanelType[];
  modalStack: ModalType[];

  // Drag state
  dragging: DragState | null;

  // Actions
  panCamera: (delta: { x: number; y: number }) => void;
  zoomCamera: (delta: number) => void;
  selectSystem: (systemId: string | null) => void;
  openPanel: (panel: PanelType) => void;
  closePanel: (panel: PanelType) => void;
}

// Separate store for game state (synced with server)
interface GameStateStore {
  gameState: GameState | null;
  myPlayerId: string | null;
  pendingActions: GameAction[];

  // Derived
  myPlayer: () => PlayerState | null;
  isMyTurn: () => boolean;
  availableActions: () => ActionType[];
}
```

---

### 29. Performance Considerations

#### Pixi.js Optimizations

```typescript
// Texture atlases for unit tokens
const unitAtlas = await Assets.load('unit-atlas.json');

// Object pooling for frequently created/destroyed sprites
class SpritePool {
  private pool: Map<string, Sprite[]> = new Map();

  acquire(texture: Texture): Sprite {
    const key = texture.uid.toString();
    const available = this.pool.get(key);
    if (available?.length) {
      return available.pop()!;
    }
    return new Sprite(texture);
  }

  release(sprite: Sprite): void {
    const key = sprite.texture.uid.toString();
    sprite.visible = false;
    if (!this.pool.has(key)) this.pool.set(key, []);
    this.pool.get(key)!.push(sprite);
  }
}

// Culling - don't render off-screen tiles
function updateVisibility(viewport: Rectangle) {
  for (const tile of tiles) {
    const bounds = tile.getBounds();
    tile.visible = viewport.intersects(bounds);
  }
}

// Batch rendering - group similar sprites
app.renderer.render(stage); // Pixi auto-batches same-texture sprites
```

#### Target Performance
- 60 FPS on desktop
- 30 FPS minimum on tablet
- < 100ms response to user input
- < 500ms for complex animations

---

### 30. Implementation Tasks (Frontend)

**Phase 1: Foundation**
- [ ] Next.js project setup with TypeScript
- [ ] Tailwind + shadcn/ui configuration
- [ ] Pixi.js integration (@pixi/react)
- [ ] Basic hex grid rendering
- [ ] Camera pan/zoom controls
- [ ] Asset loading pipeline (WebP tiles)

**Phase 2: Map Display**
- [ ] Load and display all system tiles
- [ ] Hex coordinate system (honeycomb-grid)
- [ ] Tile placement for different player counts
- [ ] Wormhole connection lines
- [ ] Anomaly visual effects
- [ ] Planet overlays (resources, influence, trait icons)

**Phase 3: Unit Rendering**
- [ ] Unit token sprites (colored shapes)
- [ ] Unit stacking display (fighter/infantry counts)
- [ ] Damaged state indicator
- [ ] Control marker placement
- [ ] Command token display

**Phase 4: UI Framework**
- [ ] Application layout (header, sidebars, HUD)
- [ ] Strategy card display
- [ ] Objective display
- [ ] Player list with scores
- [ ] Chat/game log panel
- [ ] Faction HUD

**Phase 5: Context Panels**
- [ ] System detail panel (on tile click)
- [ ] Combat resolver UI
- [ ] Production calculator
- [ ] Technology tree visualization
- [ ] Trade offer builder
- [ ] Agenda voting interface

**Phase 6: Animations**
- [ ] Unit movement animation
- [ ] Combat dice roll animation
- [ ] Card draw/play animations
- [ ] Token placement animations
- [ ] Phase transition overlays

**Phase 7: Polish**
- [ ] Responsive layout adjustments
- [ ] Keyboard shortcuts
- [ ] Accessibility (ARIA labels, focus management)
- [ ] Sound effects (optional)
- [ ] Tutorial overlays
- [ ] Loading states and skeletons

---

## Backend Systems

### 31. REST API Endpoints

#### Authentication
```
POST   /api/auth/register        - Create new account
POST   /api/auth/login           - Login, returns JWT
POST   /api/auth/logout          - Invalidate session
GET    /api/auth/me              - Get current user
POST   /api/auth/refresh         - Refresh JWT token
```

#### Users
```
GET    /api/users/:id            - Get user profile
PATCH  /api/users/:id            - Update profile
GET    /api/users/:id/stats      - Get game statistics
GET    /api/users/:id/games      - Get game history
```

#### Lobbies
```
GET    /api/lobbies              - List open lobbies
POST   /api/lobbies              - Create new lobby
GET    /api/lobbies/:id          - Get lobby details
PATCH  /api/lobbies/:id          - Update lobby settings (host only)
DELETE /api/lobbies/:id          - Delete lobby (host only)
POST   /api/lobbies/:id/join     - Join lobby
POST   /api/lobbies/:id/leave    - Leave lobby
POST   /api/lobbies/:id/ready    - Toggle ready status
POST   /api/lobbies/:id/start    - Start game (host only)
POST   /api/lobbies/:id/kick/:playerId - Kick player (host only)
```

#### Games
```
GET    /api/games/:id            - Get game state (filtered by player)
GET    /api/games/:id/log        - Get game action log
GET    /api/games/:id/state/:version - Get specific state version
POST   /api/games/:id/action     - Submit game action
POST   /api/games/:id/undo       - Request undo (if allowed)
POST   /api/games/:id/concede    - Concede game
```

#### Draft
```
GET    /api/games/:id/draft      - Get draft state
POST   /api/games/:id/draft/pick - Make draft pick
```

#### Static Data
```
GET    /api/data/factions        - Get all factions
GET    /api/data/factions/:id    - Get faction details
GET    /api/data/technologies    - Get all technologies
GET    /api/data/tiles           - Get all system tiles
GET    /api/data/cards/action    - Get action card definitions
GET    /api/data/cards/agenda    - Get agenda card definitions
GET    /api/data/cards/objective - Get objective definitions
```

---

### 32. WebSocket Events

#### Connection
```typescript
// Client → Server
interface WSConnect {
  type: 'connect';
  token: string;        // JWT auth token
  gameId?: string;      // If rejoining game
}

// Server → Client
interface WSConnected {
  type: 'connected';
  userId: string;
  reconnected: boolean;
  gameState?: GameState; // If rejoining
}
```

#### Lobby Events
```typescript
// Server → Client (broadcast to lobby)
interface LobbyUpdate {
  type: 'lobby:update';
  lobby: LobbyState;
}

interface LobbyPlayerJoined {
  type: 'lobby:player_joined';
  player: LobbyPlayer;
}

interface LobbyPlayerLeft {
  type: 'lobby:player_left';
  playerId: string;
}

interface LobbyGameStarting {
  type: 'lobby:game_starting';
  gameId: string;
}
```

#### Game State Events
```typescript
// Server → Client (broadcast to game room)
interface GameStateUpdate {
  type: 'game:state_update';
  version: number;
  delta: GameStateDelta;      // Only changed fields
  fullState?: GameState;      // Sent on reconnect
}

interface GamePhaseChange {
  type: 'game:phase_change';
  from: GamePhase;
  to: GamePhase;
  round: number;
}

interface GameTurnChange {
  type: 'game:turn_change';
  activePlayerId: string;
  availableActions: ActionType[];
}

interface GameActionResult {
  type: 'game:action_result';
  actionId: string;
  success: boolean;
  error?: string;
  resultingEvents: GameEvent[];
}
```

#### Game Action Events
```typescript
// Client → Server
interface GameAction {
  type: 'game:action';
  actionId: string;          // Client-generated UUID
  actionType: ActionType;
  payload: ActionPayload;
}

type ActionType =
  | 'select_strategy_card'
  | 'activate_system'
  | 'move_units'
  | 'commit_to_combat'
  | 'assign_hits'
  | 'retreat'
  | 'invade_planet'
  | 'produce_units'
  | 'research_technology'
  | 'play_action_card'
  | 'play_strategy_primary'
  | 'play_strategy_secondary'
  | 'pass'
  | 'score_objective'
  | 'cast_votes'
  | 'initiate_transaction'
  | 'accept_transaction'
  | 'decline_transaction';

// Example payloads
interface ActivateSystemPayload {
  systemId: string;
}

interface MoveUnitsPayload {
  movements: {
    unitId: string;
    fromSystemId: string;
    toSystemId: string;
    path: string[];        // Systems traversed
  }[];
}

interface ProduceUnitsPayload {
  systemId: string;
  units: { type: UnitType; count: number }[];
  spentResources: { planetId: string; amount: number }[];
}
```

#### Combat Events
```typescript
interface CombatStarted {
  type: 'combat:started';
  combatId: string;
  systemId: string;
  planetId?: string;        // For ground combat
  attackerId: string;
  defenderId: string;
  combatType: 'space' | 'ground';
}

interface CombatRoundResult {
  type: 'combat:round_result';
  combatId: string;
  round: number;
  attackerRolls: DiceRoll[];
  defenderRolls: DiceRoll[];
  attackerHits: number;
  defenderHits: number;
}

interface DiceRoll {
  unitId: string;
  unitType: UnitType;
  roll: number;           // 1-10
  hit: boolean;
  modified: boolean;
  modifiers: string[];    // e.g., ["Morale Boost +1"]
}

interface CombatHitAssignment {
  type: 'combat:assign_hits';
  combatId: string;
  assignments: {
    unitId: string;
    destroyed: boolean;
    sustained: boolean;
  }[];
}

interface CombatEnded {
  type: 'combat:ended';
  combatId: string;
  winner: string | null;   // null = mutual destruction
  reason: 'elimination' | 'retreat' | 'draw';
}
```

#### Timing Window Events
```typescript
interface TimingWindowOpened {
  type: 'timing:window_opened';
  windowId: string;
  trigger: string;         // e.g., "after_combat_round"
  eligiblePlayers: string[];
  timeoutMs: number;
}

interface TimingWindowResponse {
  type: 'timing:response';
  windowId: string;
  playerId: string;
  action: 'pass' | 'play_card';
  cardId?: string;
}

interface TimingWindowClosed {
  type: 'timing:window_closed';
  windowId: string;
  responses: { playerId: string; action: string }[];
}
```

#### Transaction Events
```typescript
interface TransactionOffer {
  type: 'transaction:offer';
  transactionId: string;
  fromPlayerId: string;
  toPlayerId: string;
  offer: {
    tradeGoods?: number;
    commodities?: number;
    promissoryNotes?: string[];
    relicFragments?: string[];
  };
  request: {
    tradeGoods?: number;
    commodities?: number;
    promissoryNotes?: string[];
    relicFragments?: string[];
  };
  bindingTerms?: string;   // Free text for binding deals
}

interface TransactionResponse {
  type: 'transaction:response';
  transactionId: string;
  accepted: boolean;
  counterOffer?: TransactionOffer;
}
```

#### Chat Events
```typescript
interface ChatMessage {
  type: 'chat:message';
  channel: 'all' | 'team' | string;  // string = DM recipient
  senderId: string;
  message: string;
  timestamp: number;
}
```

---

### 33. Database Schema (PostgreSQL)

```sql
-- Users & Authentication
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(32) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_stats (
  user_id       UUID PRIMARY KEY REFERENCES users(id),
  games_played  INT DEFAULT 0,
  games_won     INT DEFAULT 0,
  total_vp      INT DEFAULT 0,
  favorite_faction VARCHAR(64),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Lobbies
CREATE TABLE lobbies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(64) NOT NULL,
  host_id       UUID REFERENCES users(id),
  status        VARCHAR(16) DEFAULT 'waiting',  -- waiting, drafting, in_game, closed
  max_players   INT DEFAULT 6,
  settings      JSONB DEFAULT '{}',             -- GameSettings
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lobby_players (
  lobby_id      UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  seat_index    INT,
  is_ready      BOOLEAN DEFAULT FALSE,
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (lobby_id, user_id)
);

-- Games
CREATE TABLE games (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id      UUID REFERENCES lobbies(id),
  status        VARCHAR(16) DEFAULT 'active',   -- active, completed, abandoned
  winner_id     UUID REFERENCES users(id),
  settings      JSONB NOT NULL,                 -- GameSettings snapshot
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  ended_at      TIMESTAMPTZ
);

CREATE TABLE game_players (
  game_id       UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  faction_id    VARCHAR(64) NOT NULL,
  color         VARCHAR(16) NOT NULL,
  seat_index    INT NOT NULL,
  final_score   INT,
  PRIMARY KEY (game_id, user_id)
);

-- Game State (versioned for history/replay)
CREATE TABLE game_states (
  id            BIGSERIAL PRIMARY KEY,
  game_id       UUID REFERENCES games(id) ON DELETE CASCADE,
  version       INT NOT NULL,
  state         JSONB NOT NULL,                 -- Full GameState
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (game_id, version)
);

CREATE INDEX idx_game_states_game_version ON game_states(game_id, version DESC);

-- Game Action Log
CREATE TABLE game_actions (
  id            BIGSERIAL PRIMARY KEY,
  game_id       UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id     UUID REFERENCES users(id),
  version       INT NOT NULL,                   -- State version after action
  action_type   VARCHAR(64) NOT NULL,
  payload       JSONB NOT NULL,
  result        JSONB,                          -- Dice rolls, etc.
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_actions_game ON game_actions(game_id, version);

-- Draft State (for Milty Draft)
CREATE TABLE draft_states (
  game_id       UUID PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  slices        JSONB NOT NULL,                 -- Generated slices
  draft_order   JSONB NOT NULL,                 -- Player order per round
  picks         JSONB DEFAULT '[]',             -- Picks made
  current_round INT DEFAULT 1,
  current_pick  INT DEFAULT 0,
  status        VARCHAR(16) DEFAULT 'active'
);

-- Indexes for common queries
CREATE INDEX idx_lobbies_status ON lobbies(status);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_game_players_user ON game_players(user_id);
```

---

### 34. Game Engine / Rules Validation

#### State Machine Architecture

```typescript
// Core game phases
type GamePhase = 'setup' | 'strategy' | 'action' | 'status' | 'agenda';

// Action phase sub-states
type ActionPhaseState =
  | 'awaiting_action'
  | 'tactical_activation'
  | 'tactical_movement'
  | 'tactical_space_combat'
  | 'tactical_invasion'
  | 'tactical_production'
  | 'strategic_primary'
  | 'strategic_secondary'
  | 'component_action';

// Combat sub-states
type CombatState =
  | 'anti_fighter_barrage'
  | 'announce_retreat'
  | 'combat_round_roll'
  | 'combat_round_assign'
  | 'combat_complete';

interface GameStateMachine {
  currentPhase: GamePhase;
  currentSubState: string;
  activePlayerId: string;
  pendingActions: PendingAction[];
  timingWindows: TimingWindow[];
}
```

#### Action Validation Flow

```typescript
interface ActionValidator {
  validate(
    action: GameAction,
    state: GameState,
    playerId: string
  ): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Main validator orchestrator
class GameActionValidator {
  private validators: Map<ActionType, ActionValidator>;

  async validateAction(
    action: GameAction,
    state: GameState,
    playerId: string
  ): Promise<ValidationResult> {
    // 1. Check it's the player's turn (or valid interrupt)
    if (!this.canActNow(playerId, state)) {
      return { valid: false, errors: [{ code: 'NOT_YOUR_TURN' }] };
    }

    // 2. Check action is valid for current phase/state
    if (!this.isValidActionType(action.actionType, state)) {
      return { valid: false, errors: [{ code: 'INVALID_ACTION_FOR_PHASE' }] };
    }

    // 3. Run action-specific validation
    const validator = this.validators.get(action.actionType);
    return validator.validate(action, state, playerId);
  }
}
```

#### Example Validators

```typescript
// Tactical Action - Activate System
class ActivateSystemValidator implements ActionValidator {
  validate(action: ActivateSystemAction, state: GameState, playerId: string): ValidationResult {
    const errors: ValidationError[] = [];
    const player = state.players.find(p => p.id === playerId);
    const system = state.map.tiles.find(t => t.id === action.systemId);

    // Must have command token in tactics pool
    if (player.commandTokens.tactics < 1) {
      errors.push({ code: 'NO_TACTICS_TOKENS' });
    }

    // Cannot activate system that already has your command token
    if (system.commandTokens.includes(playerId)) {
      errors.push({ code: 'SYSTEM_ALREADY_ACTIVATED' });
    }

    // Cannot activate if Diplomacy rider is active on you
    if (this.hasDiplomacyProtection(system, playerId, state)) {
      errors.push({ code: 'DIPLOMACY_PROTECTION' });
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }
}

// Movement Validation
class MoveUnitsValidator implements ActionValidator {
  validate(action: MoveUnitsAction, state: GameState, playerId: string): ValidationResult {
    const errors: ValidationError[] = [];
    const activeSystem = this.getActiveSystem(state);

    for (const movement of action.movements) {
      const unit = this.getUnit(movement.unitId, state);

      // Unit must belong to player
      if (unit.ownerId !== playerId) {
        errors.push({ code: 'NOT_YOUR_UNIT', unitId: movement.unitId });
        continue;
      }

      // Unit must be a ship (not ground force or structure)
      if (!this.isShip(unit.type)) {
        errors.push({ code: 'CANNOT_MOVE_NON_SHIP', unitId: movement.unitId });
        continue;
      }

      // Path must be valid
      const pathValidation = this.validatePath(
        movement.path,
        unit,
        player,
        state
      );
      if (!pathValidation.valid) {
        errors.push(...pathValidation.errors);
      }

      // Must end in active system
      if (movement.toSystemId !== activeSystem.id) {
        errors.push({ code: 'MUST_END_IN_ACTIVE_SYSTEM' });
      }
    }

    // Fleet supply check at destination
    const fleetSupplyValid = this.checkFleetSupply(
      activeSystem,
      action.movements,
      player,
      state
    );
    if (!fleetSupplyValid) {
      errors.push({ code: 'EXCEEDS_FLEET_SUPPLY' });
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  private validatePath(
    path: string[],
    unit: Unit,
    player: Player,
    state: GameState
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const moveValue = this.getUnitMoveValue(unit, player);

    // Path length must not exceed move value
    if (path.length > moveValue) {
      errors.push({ code: 'EXCEEDS_MOVE_VALUE', max: moveValue, actual: path.length });
    }

    // Each step must be adjacent (or wormhole connected)
    for (let i = 0; i < path.length - 1; i++) {
      if (!this.areAdjacent(path[i], path[i + 1], state)) {
        errors.push({ code: 'INVALID_PATH_NOT_ADJACENT', from: path[i], to: path[i + 1] });
      }
    }

    // Cannot pass through systems with enemy ships (unless Light/Wave)
    for (const systemId of path.slice(0, -1)) { // Excluding destination
      const system = state.map.tiles.find(t => t.id === systemId);
      if (this.hasEnemyShips(system, playerId, state)) {
        if (!player.technologies.includes('light_wave_deflector')) {
          errors.push({ code: 'ENEMY_SHIPS_BLOCK_PATH', systemId });
        }
      }
    }

    // Anomaly checks
    for (const systemId of path) {
      const system = state.map.tiles.find(t => t.id === systemId);
      if (system.anomaly === 'supernova') {
        errors.push({ code: 'CANNOT_ENTER_SUPERNOVA', systemId });
      }
      if (system.anomaly === 'asteroid' && !player.technologies.includes('antimass_deflectors')) {
        errors.push({ code: 'CANNOT_ENTER_ASTEROID_FIELD', systemId });
      }
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }
}

// Technology Research Validation
class ResearchTechValidator implements ActionValidator {
  validate(action: ResearchTechAction, state: GameState, playerId: string): ValidationResult {
    const errors: ValidationError[] = [];
    const player = state.players.find(p => p.id === playerId);
    const tech = getTechnologyData(action.technologyId);

    // Cannot already own this tech
    if (player.technologies.includes(action.technologyId)) {
      errors.push({ code: 'ALREADY_OWN_TECH' });
    }

    // Check prerequisites
    const prereqsMet = this.checkPrerequisites(tech, player, state);
    if (!prereqsMet.valid) {
      errors.push({ code: 'PREREQUISITES_NOT_MET', required: prereqsMet.missing });
    }

    // Check resources (if paying for tech)
    if (action.spentResources) {
      const totalResources = this.calculateSpentResources(action.spentResources, player);
      if (totalResources < (action.cost || 0)) {
        errors.push({ code: 'INSUFFICIENT_RESOURCES' });
      }
    }

    // Nekro cannot research (must copy)
    if (player.faction.id === 'nekro_virus' && !action.isCopy) {
      errors.push({ code: 'NEKRO_CANNOT_RESEARCH' });
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  private checkPrerequisites(
    tech: Technology,
    player: Player,
    state: GameState
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    const playerTechCounts = this.countTechByColor(player.technologies);

    // Add tech specialties from exhaustable planets
    const techSpecialties = this.getAvailableTechSpecialties(player, state);

    for (const prereq of tech.prerequisites) {
      const available = playerTechCounts[prereq.color] + (techSpecialties[prereq.color] || 0);
      if (available < prereq.count) {
        missing.push(`${prereq.count} ${prereq.color}`);
      }
    }

    return { valid: missing.length === 0, missing };
  }
}
```

#### Combat Resolution Engine

```typescript
class CombatResolver {
  async resolveCombat(combat: CombatInstance, state: GameState): Promise<CombatResult> {
    const rounds: CombatRound[] = [];
    let currentCombat = { ...combat };

    // 1. Anti-Fighter Barrage (space combat only)
    if (combat.type === 'space') {
      const afbResult = await this.resolveAntiFighterBarrage(currentCombat, state);
      currentCombat = this.applyAfbResult(currentCombat, afbResult);
    }

    // 2. Combat rounds
    while (!this.isCombatOver(currentCombat)) {
      // Check for retreat announcement
      const retreatDecision = await this.promptRetreat(currentCombat);
      if (retreatDecision.retreat) {
        return this.resolveRetreat(currentCombat, retreatDecision);
      }

      // Roll dice
      const attackerRolls = this.rollCombat(currentCombat.attackerUnits, 'attacker', state);
      const defenderRolls = this.rollCombat(currentCombat.defenderUnits, 'defender', state);

      // Calculate hits
      const attackerHits = this.countHits(attackerRolls);
      const defenderHits = this.countHits(defenderRolls);

      // Assign hits (player choice)
      const attackerAssignments = await this.promptHitAssignment(
        currentCombat.attackerId,
        defenderHits,
        currentCombat.attackerUnits
      );
      const defenderAssignments = await this.promptHitAssignment(
        currentCombat.defenderId,
        attackerHits,
        currentCombat.defenderUnits
      );

      // Apply damage/destruction
      currentCombat = this.applyHits(currentCombat, attackerAssignments, defenderAssignments);

      rounds.push({
        attackerRolls,
        defenderRolls,
        attackerHits,
        defenderHits,
        attackerAssignments,
        defenderAssignments,
      });
    }

    return {
      winner: this.determineWinner(currentCombat),
      rounds,
      finalState: currentCombat,
    };
  }

  private rollCombat(units: Unit[], side: 'attacker' | 'defender', state: GameState): DiceRoll[] {
    const rolls: DiceRoll[] = [];

    for (const unit of units) {
      const combatValue = this.getCombatValue(unit, side, state);
      const diceCount = this.getDiceCount(unit);

      for (let i = 0; i < diceCount; i++) {
        const roll = this.rollD10();
        rolls.push({
          unitId: unit.id,
          unitType: unit.type,
          roll,
          combatValue,
          hit: roll >= combatValue,
          modifiers: this.getModifiers(unit, side, state),
        });
      }
    }

    return rolls;
  }

  private rollD10(): number {
    // Returns 1-10 (not 0-9)
    return Math.floor(Math.random() * 10) + 1;
  }
}
```

#### Ability Effect System

```typescript
// Modular ability system for faction/tech/card effects
interface AbilityEffect {
  id: string;
  trigger: EffectTrigger;
  condition?: EffectCondition;
  effect: EffectType;
  priority: number;  // For ordering simultaneous effects
}

type EffectTrigger =
  | 'on_activation'
  | 'on_movement'
  | 'on_combat_start'
  | 'on_combat_round'
  | 'on_hit_assigned'
  | 'on_unit_destroyed'
  | 'on_production'
  | 'on_technology_research'
  | 'on_agenda_vote'
  | 'on_status_phase'
  | 'on_planet_control_gained'
  | 'passive';

// Example: Sardakk N'orr racial ability
const sardakkCombatBonus: AbilityEffect = {
  id: 'sardakk_combat_bonus',
  trigger: 'on_combat_round',
  condition: { type: 'owner_is_faction', factionId: 'sardakk_norr' },
  effect: {
    type: 'modify_combat_value',
    modifier: -1,  // Lower is better in TI4
    targets: 'all_units',
  },
  priority: 100,
};

// Example: Duranium Armor technology
const duraniumArmor: AbilityEffect = {
  id: 'duranium_armor',
  trigger: 'on_combat_round',
  condition: { type: 'owner_has_tech', techId: 'duranium_armor' },
  effect: {
    type: 'repair_unit',
    count: 1,
    targets: 'damaged_units',
  },
  priority: 50,
};

class AbilityEffectProcessor {
  private effects: AbilityEffect[] = [];

  registerEffect(effect: AbilityEffect): void {
    this.effects.push(effect);
    this.effects.sort((a, b) => b.priority - a.priority);
  }

  processEffects(trigger: EffectTrigger, context: EffectContext, state: GameState): GameState {
    let currentState = state;

    const applicableEffects = this.effects
      .filter(e => e.trigger === trigger)
      .filter(e => this.evaluateCondition(e.condition, context, currentState));

    for (const effect of applicableEffects) {
      currentState = this.applyEffect(effect.effect, context, currentState);
    }

    return currentState;
  }
}
```

---

### 35. Complete Game Data Reference

#### Faction Data Schema

```typescript
interface FactionData {
  id: string;
  name: string;
  shortName: string;              // For UI
  expansion: 'base' | 'pok' | 'codex3' | 'thunders_edge';

  // Abilities
  abilities: {
    name: string;
    description: string;
    type: 'passive' | 'action' | 'triggered';
  }[];

  // Starting Setup
  startingUnits: { type: UnitType; count: number }[];
  startingTech: string[];
  commodities: number;
  homeSystemId: number;

  // Faction-specific
  flagship: {
    name: string;
    cost: number;
    combat: number;
    combatDice: number;
    move: number;
    capacity: number;
    abilities: string[];
  };

  factionTech: {
    id: string;
    name: string;
    prerequisites: { color: TechColor; count: number }[];
    description: string;
  }[];

  promissoryNote: {
    name: string;
    description: string;
  };

  // PoK additions
  mech?: {
    name: string;
    abilities: string[];
  };

  leaders?: {
    agent: { name: string; ability: string };
    commander: { name: string; unlockCondition: string; ability: string };
    hero: { name: string; unlockCondition: string; ability: string };
  };
}
```

#### All 17 Base Game Factions (Summary)

| Faction | Commodities | Starting Tech | Flagship |
|---------|-------------|---------------|----------|
| The Arborec | 3 | Magen Defense Grid | Duha Menaimon |
| The Barony of Letnev | 2 | Antimass Deflectors, Plasma Scoring | Arc Secundus |
| The Clan of Saar | 3 | Antimass Deflectors | Son of Ragh |
| The Embers of Muaat | 4 | Plasma Scoring | The Inferno |
| The Emirates of Hacan | 6 | Antimass Deflectors, Sarween Tools | Wrath of Kenara |
| The Federation of Sol | 4 | Antimass Deflectors, Neural Motivator | Genesis |
| The Ghosts of Creuss | 4 | Gravity Drive | Hil Colish |
| The L1Z1X Mindnet | 2 | Neural Motivator, Plasma Scoring | [0.0.1] |
| The Mentak Coalition | 2 | Sarween Tools, Plasma Scoring | Fourth Moon |
| The Naalu Collective | 3 | Neural Motivator, Sarween Tools | Matriarch |
| The Nekro Virus | 3 | Dacxive Animators | The Alastor |
| Sardakk N'orr | 3 | (none) | C'Morran N'orr |
| The Universities of Jol-Nar | 4 | Neural Motivator, Antimass Deflectors, Sarween Tools, Plasma Scoring | J.N.S. Hylarim |
| The Winnu | 3 | (choice based on Mecatol planets) | Salai Sai Coravus |
| The Xxcha Kingdom | 4 | Graviton Laser System | Loncara Ssodu |
| The Yin Brotherhood | 2 | Sarween Tools | Van Hauge |
| The Yssaril Tribes | 3 | Neural Motivator | Y'sia Y'ssrila |

#### Technology Data (Complete List)

```typescript
const TECHNOLOGIES: TechnologyData[] = [
  // === BIOTIC (GREEN) ===
  { id: 'neural_motivator', name: 'Neural Motivator', color: 'green', prereqs: [], effect: 'Draw 2 action cards instead of 1' },
  { id: 'dacxive_animators', name: 'Dacxive Animators', color: 'green', prereqs: [{ green: 1 }], effect: 'After ground combat, place 1 infantry on planet' },
  { id: 'hyper_metabolism', name: 'Hyper Metabolism', color: 'green', prereqs: [{ green: 2 }], effect: 'Gain 3 command tokens instead of 2 during status phase' },
  { id: 'x89_bacterial_weapon', name: 'X-89 Bacterial Weapon', color: 'green', prereqs: [{ green: 3 }], effect: 'ACTION: Destroy all infantry on a planet you bombard' },
  { id: 'psychoarchaeology', name: 'Psychoarchaeology', color: 'green', prereqs: [], effect: 'Use tech specialties without exhausting planets' }, // PoK
  { id: 'bio_stims', name: 'Bio-Stims', color: 'green', prereqs: [{ green: 1 }], effect: 'Exhaust to ready another planet or tech' }, // PoK

  // === PROPULSION (BLUE) ===
  { id: 'antimass_deflectors', name: 'Antimass Deflectors', color: 'blue', prereqs: [], effect: 'Move through asteroids; -1 to space cannon against you' },
  { id: 'gravity_drive', name: 'Gravity Drive', color: 'blue', prereqs: [{ blue: 1 }], effect: '+1 move to 1 ship after activation' },
  { id: 'fleet_logistics', name: 'Fleet Logistics', color: 'blue', prereqs: [{ blue: 2 }], effect: 'Take 2 actions per turn' },
  { id: 'light_wave_deflector', name: 'Light/Wave Deflector', color: 'blue', prereqs: [{ blue: 2 }], effect: 'Move through systems with enemy ships' },
  { id: 'dark_energy_tap', name: 'Dark Energy Tap', color: 'blue', prereqs: [{ blue: 1 }], effect: 'Explore frontier tokens; retreat to empty adjacent' }, // PoK
  { id: 'sling_relay', name: 'Sling Relay', color: 'blue', prereqs: [{ blue: 2 }], effect: 'Exhaust to produce 1 ship in dock system' }, // PoK

  // === CYBERNETIC (YELLOW) ===
  { id: 'sarween_tools', name: 'Sarween Tools', color: 'yellow', prereqs: [], effect: '-1 cost to Production ability' },
  { id: 'graviton_laser_system', name: 'Graviton Laser System', color: 'yellow', prereqs: [{ yellow: 1 }], effect: 'Space cannon hits must be assigned to non-fighters' },
  { id: 'transit_diodes', name: 'Transit Diodes', color: 'yellow', prereqs: [{ yellow: 2 }], effect: 'Relocate up to 4 ground forces during status phase' },
  { id: 'integrated_economy', name: 'Integrated Economy', color: 'yellow', prereqs: [{ yellow: 2 }], effect: 'Produce units when capturing planet' },
  { id: 'scanlink_drone_network', name: 'Scanlink Drone Network', color: 'yellow', prereqs: [], effect: 'Explore planet when activating system' }, // PoK
  { id: 'predictive_intelligence', name: 'Predictive Intelligence', color: 'yellow', prereqs: [{ yellow: 2 }], effect: 'Redistribute tokens; +3 votes' }, // PoK

  // === WARFARE (RED) ===
  { id: 'plasma_scoring', name: 'Plasma Scoring', color: 'red', prereqs: [], effect: '+1 die to bombardment or space cannon' },
  { id: 'magen_defense_grid', name: 'Magen Defense Grid', color: 'red', prereqs: [{ red: 1 }], effect: 'Opponent cannot make combat rolls round 1 of ground combat' },
  { id: 'duranium_armor', name: 'Duranium Armor', color: 'red', prereqs: [{ red: 2 }], effect: 'Repair 1 unit during each combat round' },
  { id: 'assault_cannon', name: 'Assault Cannon', color: 'red', prereqs: [{ red: 3 }], effect: 'Destroy 1 non-fighter if you have 3+ non-fighters' },
  { id: 'ai_development_algorithm', name: 'AI Development Algorithm', color: 'red', prereqs: [], effect: 'Ignore 1 prereq for unit upgrades' }, // PoK
  { id: 'self_assembly_routines', name: 'Self Assembly Routines', color: 'red', prereqs: [{ red: 2 }], effect: 'Place mech after production; gain TG when mech destroyed' }, // PoK

  // === UNIT UPGRADES ===
  { id: 'infantry_2', name: 'Infantry II', color: 'unit', prereqs: [{ green: 2 }], effect: 'Combat 7, cost 0.5 for 2' },
  { id: 'fighter_2', name: 'Fighter II', color: 'unit', prereqs: [{ green: 2 }], effect: 'Combat 8, move 2, cost 0.5 for 2' },
  { id: 'destroyer_2', name: 'Destroyer II', color: 'unit', prereqs: [{ red: 2 }], effect: 'Combat 8, AFB 6x3' },
  { id: 'cruiser_2', name: 'Cruiser II', color: 'unit', prereqs: [{ green: 1 }, { yellow: 1 }, { red: 1 }], effect: 'Combat 6, move 3, capacity 1' },
  { id: 'carrier_2', name: 'Carrier II', color: 'unit', prereqs: [{ blue: 2 }], effect: 'Combat 9, move 2, capacity 6' },
  { id: 'dreadnought_2', name: 'Dreadnought II', color: 'unit', prereqs: [{ blue: 2 }, { yellow: 2 }], effect: 'Combat 4, move 2, capacity 2' },
  { id: 'war_sun', name: 'War Sun', color: 'unit', prereqs: [{ red: 3 }, { yellow: 1 }], effect: 'Combat 3x3, move 2, capacity 6, sustain' },
  { id: 'pds_2', name: 'PDS II', color: 'unit', prereqs: [{ red: 1 }, { yellow: 1 }], effect: 'Space cannon 5, planetary shield, can hit adjacent' },
  { id: 'space_dock_2', name: 'Space Dock II', color: 'unit', prereqs: [{ yellow: 2 }], effect: 'Production +4' },
];
```

#### Action Cards (Count by Type)

| Timing | Base Game | PoK | Total |
|--------|-----------|-----|-------|
| Action | 15 | 8 | 23 |
| After | 25 | 12 | 37 |
| When | 18 | 10 | 28 |
| At the start | 12 | 6 | 18 |
| **Total** | **70** | **36** | **106** |

*Full card data should be stored in `/data/cards/action-cards.json`*

#### Objective Cards (Summary)

| Type | Base | PoK | Total |
|------|------|-----|-------|
| Public Stage I | 10 | 10 | 20 |
| Public Stage II | 10 | 10 | 20 |
| Secret (Action) | 5 | 7 | 12 |
| Secret (Status) | 15 | 11 | 26 |
| Secret (Agenda) | 2 | 0 | 2 |
| **Total** | **42** | **38** | **80** |

#### Agenda Cards (Summary)

| Type | Base | PoK | Total |
|------|------|-----|-------|
| Laws | 28 | 6 | 34 |
| Directives | 16 | 7 | 23 |
| **Total** | **44** | **13** | **57** |

---

### 36. Data File Structure

```
/data
├── factions/
│   ├── index.json              # List of all faction IDs
│   ├── arborec.json
│   ├── barony_of_letnev.json
│   ├── clan_of_saar.json
│   └── ... (30 total)
├── technologies/
│   ├── index.json
│   ├── biotic.json
│   ├── propulsion.json
│   ├── cybernetic.json
│   ├── warfare.json
│   └── unit-upgrades.json
├── tiles/
│   ├── index.json
│   ├── base-game.json          # Tiles 1-50
│   ├── pok.json                # Tiles 51-82+
│   └── hyperlanes.json
├── cards/
│   ├── action-cards.json
│   ├── agenda-cards.json
│   ├── objectives-public.json
│   ├── objectives-secret.json
│   └── promissory-notes.json
├── units/
│   └── unit-stats.json         # Base stats for all units
└── maps/
    ├── preset-3p.json
    ├── preset-4p.json
    ├── preset-5p.json
    ├── preset-6p.json
    ├── preset-7p.json
    └── preset-8p.json
```

---

### 37. Testing Strategy

#### Testing Stack

```
Unit Tests:        Vitest (fast, ESM native, Jest-compatible)
Integration Tests: Vitest + Supertest (API testing)
E2E Tests:         Playwright (browser automation)
Test Coverage:     Vitest built-in coverage (c8/v8)
Mocking:           Vitest mocking + MSW (API mocking)
```

#### Test Categories

| Category | What to Test | Tools | Location |
|----------|--------------|-------|----------|
| Unit | Pure functions, validators, game logic | Vitest | `*.test.ts` next to source |
| Integration | API endpoints, WebSocket events | Vitest + Supertest | `tests/integration/` |
| E2E | User flows, multiplayer scenarios | Playwright | `tests/e2e/` |
| Game Rules | Combat, movement, tech prerequisites | Vitest | `tests/rules/` |

#### Critical Test Areas

**1. Game Rules Engine (Highest Priority)**
```typescript
// tests/rules/combat.test.ts
describe('Space Combat', () => {
  it('should resolve anti-fighter barrage before combat rounds', () => {});
  it('should allow sustain damage to cancel one hit', () => {});
  it('should force attacker retreat when mathematically impossible to win', () => {});
  it('should treat dice roll of 10 as always hitting', () => {});
});

// tests/rules/movement.test.ts
describe('Movement Validation', () => {
  it('should block movement through enemy ships without Light/Wave', () => {});
  it('should allow movement through asteroids with Antimass Deflectors', () => {});
  it('should connect alpha wormholes for adjacency', () => {});
  it('should enforce fleet supply at destination', () => {});
});

// tests/rules/technology.test.ts
describe('Technology Prerequisites', () => {
  it('should require correct color prerequisites', () => {});
  it('should allow tech specialty planets to count as prerequisites', () => {});
  it('should not count unit upgrades as prerequisites', () => {});
});
```

**2. Action Validators**
```typescript
// tests/validators/activate-system.test.ts
describe('ActivateSystemValidator', () => {
  it('should reject activation without tactics token', () => {});
  it('should reject activating system with existing command token', () => {});
  it('should reject activation blocked by Diplomacy', () => {});
});
```

**3. State Machine Transitions**
```typescript
// tests/state-machine/phases.test.ts
describe('Game Phase Transitions', () => {
  it('should transition from strategy to action phase after all picks', () => {});
  it('should transition to agenda phase after Mecatol Rex is taken', () => {});
  it('should skip agenda phase before custodians token is claimed', () => {});
});
```

**4. WebSocket Events**
```typescript
// tests/integration/websocket.test.ts
describe('WebSocket Game Events', () => {
  it('should broadcast state updates to all players in game', () => {});
  it('should filter hidden information per player', () => {});
  it('should handle reconnection with full state sync', () => {});
});
```

**5. E2E Multiplayer Scenarios**
```typescript
// tests/e2e/full-game.spec.ts
test('complete 3-player game flow', async ({ browser }) => {
  // Create 3 browser contexts for 3 players
  // Test: lobby creation, joining, draft, gameplay, victory
});

test('combat resolution with action cards', async ({ browser }) => {
  // Test: Sabotage timing, Direct Hit, retreat
});
```

#### Test Data Fixtures

```typescript
// tests/fixtures/game-states.ts
export const fixtures = {
  emptyGame: () => createGameState({ round: 1, phase: 'strategy' }),
  midGame: () => createGameState({ round: 4, phase: 'action', hasMecatol: true }),
  combatScenario: () => createGameState({
    activeSystem: 'mecatol',
    attackerUnits: [{ type: 'dreadnought', count: 2 }],
    defenderUnits: [{ type: 'cruiser', count: 3 }],
  }),
  techPrereqScenario: () => createGameState({
    playerTech: ['neural_motivator', 'dacxive_animators'],
  }),
};
```

#### Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| Game Rules Engine | 95%+ | Most critical - bugs here break the game |
| Action Validators | 90%+ | Prevents illegal game states |
| API Endpoints | 80%+ | Standard coverage |
| UI Components | 70%+ | Focus on interactive parts |
| E2E Flows | Key paths | Not percentage-based |

#### CI Pipeline

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v4
```

#### Package Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --project unit",
    "test:integration": "vitest run --project integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

#### Example Faction JSON

```json
{
  "id": "arborec",
  "name": "The Arborec",
  "shortName": "Arborec",
  "expansion": "base",
  "abilities": [
    {
      "name": "Mitosis",
      "type": "passive",
      "description": "Your space docks cannot produce infantry. At the start of the status phase, place 1 infantry from your reinforcements on any planet you control other than Mecatol Rex."
    }
  ],
  "startingUnits": [
    { "type": "carrier", "count": 1 },
    { "type": "cruiser", "count": 1 },
    { "type": "fighter", "count": 2 },
    { "type": "infantry", "count": 4 },
    { "type": "space_dock", "count": 1 },
    { "type": "pds", "count": 1 }
  ],
  "startingTech": ["magen_defense_grid"],
  "commodities": 3,
  "homeSystemId": 5,
  "flagship": {
    "name": "Duha Menaimon",
    "cost": 8,
    "combat": 7,
    "combatDice": 2,
    "move": 1,
    "capacity": 5,
    "abilities": ["sustain_damage", "After you activate this system, you may produce up to 5 units in this system."]
  },
  "factionTech": [
    {
      "id": "bioplasmosis",
      "name": "Bioplasmosis",
      "prerequisites": { "green": 2 },
      "description": "At the end of the status phase, you may remove any number of infantry from planets you control and place them on 1 or more planets you control in the same or adjacent systems."
    },
    {
      "id": "letani_warrior_2",
      "name": "Letani Warrior II",
      "prerequisites": { "green": 2 },
      "description": "After this unit is destroyed, roll 1 die. If the result is 6 or greater, place the unit on its side on this planet."
    }
  ],
  "promissoryNote": {
    "name": "Stymie",
    "description": "ACTION: Place this card face-up in your play area. While this card is in your play area, the Arborec player cannot produce units in or adjacent to non-home systems that contain 1 or more of your units. If you activate a system that contains 1 or more of the Arborec player's units, return this card to the Arborec player."
  },
  "mech": {
    "name": "Letani Behemoth",
    "abilities": ["DEPLOY: When you would place this unit, you may replace 1 of your infantry on that planet with this unit.", "PRODUCTION 2"]
  },
  "leaders": {
    "agent": {
      "name": "Letani Ospha",
      "ability": "At the start of a ground combat on a planet that contains 1 or more of your structures: You may exhaust this card; if you do, produce 1 hit and assign it to 1 of your opponent's ground forces."
    },
    "commander": {
      "name": "Dirzuga Rophal",
      "unlockCondition": "Have 12 or more ground forces on the game board.",
      "ability": "At the start of the status phase, you may place 1 infantry from your reinforcements on any planet you control other than Mecatol Rex."
    },
    "hero": {
      "name": "Letani Miasmiala",
      "unlockCondition": "Have 3 scored objectives.",
      "ability": "ACTION: Remove each ground force on the game board that is not on a planet or in a space dock."
    }
  }
}
```
