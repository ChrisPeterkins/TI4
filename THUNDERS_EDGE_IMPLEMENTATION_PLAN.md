# Thunder's Edge Expansion Implementation Plan

## Overview

Thunder's Edge is the second major expansion for Twilight Imperium Fourth Edition, released October 2025. This document outlines a comprehensive implementation plan to add Thunder's Edge support to our TI4 digital implementation.

## Expansion Contents Summary

| Category | Count | Priority |
|----------|-------|----------|
| New Factions | 5 | HIGH |
| Breakthroughs (all 30 factions) | 30 | HIGH |
| New Action Cards | 20 | HIGH |
| Galactic Events | 20 | MEDIUM |
| New System Tiles | 33 + 3 Fracture | MEDIUM |
| New Planets | 43 + 10 Legendary | MEDIUM |
| New Relics | 10 | MEDIUM |
| Space Stations | 3 | MEDIUM |
| Neutral Units System | 1 mechanic | MEDIUM |
| Strategy Card Updates (Ω versions) | 2 | LOW |
| Alliance Cards | 31 | LOW |
| Twilight's Fall Mode | Separate game mode | FUTURE |

---

## Phase 1: Core Data Structures

### 1.1 Update Expansion Type
**File:** `/packages/shared/src/types/common.ts`

```typescript
// Already includes 'thunders_edge' - verify it's properly supported
type Expansion = 'base' | 'pok' | 'codex1' | 'codex2' | 'codex3' | 'codex4' | 'thunders_edge';
```

### 1.2 Add Breakthrough Type Definitions
**File:** `/packages/shared/src/types/static-data.ts`

```typescript
interface BreakthroughData {
  id: string;
  factionId: string;
  name: string;
  description: string;
  synergy: {
    color1: TechColor;
    color2: TechColor;
  };
  unlockMethod: 'expedition' | 'game_start' | 'special';
  ability: BreakthroughAbility;
  expansion: 'thunders_edge';
}

interface BreakthroughAbility {
  timing: AbilityTiming;
  effectType: string;
  handlerId: string;
  isExhaustable: boolean;
}
```

### 1.3 Add Galactic Event Type Definitions
**File:** `/packages/shared/src/types/static-data.ts`

```typescript
interface GalacticEventData {
  id: string;
  name: string;
  complexity: 1 | 2 | 3;
  description: string;
  setupInstructions?: string;
  ruleModifications: RuleModification[];
  expansion: 'codex4' | 'thunders_edge';
}

interface RuleModification {
  type: string;
  description: string;
  affectedPhases?: GamePhase[];
}
```

### 1.4 Add Space Station Type
**File:** `/packages/shared/src/types/static-data.ts`

```typescript
interface SpaceStationData {
  id: string;
  name: string;
  resources: number;
  influence: number;
  abilities: string[];
  expansion: 'thunders_edge';
}
```

### 1.5 Add Neutral Units Support
**File:** `/packages/shared/src/types/game-state.ts`

```typescript
interface NeutralUnit {
  id: string;
  type: 'infantry' | 'destroyer' | 'carrier' | 'cruiser' | 'fighter';
  systemId: number;
  planetId?: string;
}

// Add to GameState
interface GameState {
  // ... existing fields
  neutralUnits: NeutralUnit[];
  fracture?: FractureState;
  activeGalacticEvents: string[];
  thundersEdgeExpedition?: ExpeditionState;
}
```

---

## Phase 2: New Factions (5 factions)

### 2.1 Faction Data
**File:** `/packages/game-data/src/data/factions.ts`

Add 5 new factions with complete details:

#### 2.1.1 Last Bastion
| Property | Value |
|----------|-------|
| ID | `last_bastion` |
| Home System | Ordinian (legendary) |
| Commodities | 1 |
| Starting Tech | Choose 1 blue or yellow |

**Abilities:**
- **Galvanize**: As an action, spend 1 command token from strategy pool; place 1 galvanize token on an eligible unit (dreadnought, flagship, mech). Galvanized units roll 1 additional die during combat and SPACE CANNON.
- **Phoenix Standard**: Your units cannot be destroyed by BOMBARDMENT. At the end of ground combat, if you lost at least 1 unit, place 1 infantry on a planet you control in your home system.
- **Liberate**: After you win a ground combat, you may give the defender 1 trade good; if you do, they do not lose control of that planet.

**Leaders:**
- **Agent: Dame Briar** - When a player would gain trade goods: You may exhaust this card; that player loses 1 trade good and you gain 1 trade good.
- **Commander: Nip and Tuck** (Unlock: Control 3 legendary planets OR score a secret objective that requires controlling planets) - At the end of your turn, you may redistribute up to 2 ground forces among planets you control.
- **Hero: Lyra Keen** (Purge) - LIBERATE: Place this card in play. During combat, apply +1 to the result of your unit's combat rolls. You cannot use the GALVANIZE ability.

**Faction Technology:**
- **Proxima Targeting VI** (Unit Upgrade - PDS) - Cost 1 | You may use your SPACE CANNON ability in adjacent systems and in systems that contain your command tokens.

**Flagship: The Egeiro** - Cost 9, Combat 6x3, Move 2, Capacity 4 | SUSTAIN DAMAGE. This ship's SPACE CANNON is 4(×3).

**Mech: A3 Valiance** - Cost 2, Combat 7 | SUSTAIN DAMAGE. You may exhaust this unit's GALVANIZE token to cancel a hit produced against this unit.

---

#### 2.1.2 Deepwrought Scholarate
| Property | Value |
|----------|-------|
| ID | `deepwrought` |
| Home System | Ikatena |
| Commodities | 3 |
| Starting Tech | Research 2 technologies during setup |

**Abilities:**
- **Coexistence**: During the COMMIT GROUND FORCES step, you may commit ground forces to planets that contain only another player's ground forces. Ground combat is not resolved on planets where you have committed ground forces this way. You cannot use this ability on legendary planets or planets you control. (Special Ocean card deck included)
- **Oceanbound**: You cannot invade planets that contain only another player's ground forces unless those forces are in coexistence.
- **Research Team**: At the end of each strategy phase, you may research 1 technology.

**Ocean Cards (5 types):**
1. **Crimson Tide**: Remove coexisting units and produce ships
2. **Low Tide**: Draw action cards based on coexisting planets
3. **Neap Tide**: Gain trade goods or commodities from coexistence
4. **High Tide**: Place infantry and gain resources from coexistence
5. **Storm Surge**: Gain command tokens and exhaust opponent planets

**Leaders:**
- **Agent: Dr. Carrina** - When a player gains a planet: You may exhaust this card; if that planet does not contain another player's ground forces, you may place 1 infantry from your reinforcements on that planet.
- **Commander: Aello** (Unlock: Have 5+ coexisting planets across the galaxy) - Other players cannot use ANTI-FIGHTER BARRAGE during combat against you.
- **Hero: Ta Zern** (Purge) - GREAT EMERGENCE: Place this card in play. During the agenda phase, after an agenda is revealed, you may predict an outcome of the agenda; if the outcome matches your prediction, gain 2 victory points.

**Faction Technologies:**
- **Radical Advancement** (Green) - During setup, research 1 additional technology. At the start of each strategy phase, you may exhaust 1 planet you control to gain its specialty as a prerequisite for the phase.
- **Hydrothermal Mining** (Yellow) - When you spend resources to produce units, each planet you control that has your ground forces provides 1 additional resource.

**Flagship: D.W.S. Luminous** - Cost 8, Combat 7x2, Move 1, Capacity 8 | SUSTAIN DAMAGE. This ship has PRODUCTION 3. When this ship produces units, you may produce units at one additional space dock you control.

**Mech: Eanautic** - Cost 2, Combat 6 | SUSTAIN DAMAGE. At the start of ground combat, you may remove 1 of your coexisting ground forces from the active planet; if you do, this unit rolls 1 additional die during this combat.

---

#### 2.1.3 Ral Nel Consortium
| Property | Value |
|----------|-------|
| ID | `ral_nel` |
| Home System | Mez Lo Orz Pei Zsha (3 planets) |
| Commodities | 4 |
| Starting Tech | Choose 1 red or green |

**Abilities:**
- **Miniaturization**: ACTION: You may transport 1 structure from a system that contains your units. Structures transported this way may be placed on a planet you control that does not contain a structure (except in your home system).
- **Survival Instinct**: When 1 or more of your non-fighter ships would be destroyed: You may destroy 1 of your fighters in that system; if you do, 1 non-fighter ship is not destroyed.
- **Linkships**: Your Destroyer II units gain "This ship can be placed at the start of each round of space combat, attaching to 1 of your ships that has capacity; that ship's capacity is reduced by 1."

**Leaders:**
- **Agent: Kan Kip Rel** - At the start of a player's turn: You may exhaust this card; that player may move 1 of their ships in a system that does not contain their command token to an adjacent system that does not contain another player's ships.
- **Commander: Watchful Ojz** (Unlock: Own 4+ structures on non-home planets) - When you would produce units, you may spend trade goods as if they were resources.
- **Hero: Director Nel** (Purge) - REDISTRIBUTION: Choose up to 2 structures on planets you do not control; gain those structures on planets you control.

**Faction Technology:**
- **Nanomachines** (Unit Upgrade - Infantry) - Cost 1/2, Combat 6 | After this unit is destroyed, you may place it on a planet you control in an adjacent system.

**Flagship: Last Dispatch** - Cost 8, Combat 5x2, Move 2, Capacity 6 | SUSTAIN DAMAGE. This ship can transport structures. When this ship is destroyed, you may place 1 PDS and 1 space dock on a planet you control in this system.

**Mech: Alarum** - Cost 2, Combat 6 | SUSTAIN DAMAGE. At the end of a round of ground combat, you may transport this unit to an adjacent planet you control that does not contain a mech.

---

#### 2.1.4 Crimson Rebellion
| Property | Value |
|----------|-------|
| ID | `crimson_rebellion` |
| Home System | Ahk Creuxx |
| Commodities | 2 |
| Starting Tech | Choose 1 blue or red |

**Abilities:**
- **Sundered**: During setup, after placing your starting units, you gain your breakthrough. Place the Epsilon wormhole token in your home system. While you control Ahk Creuxx, systems that contain breach tokens are adjacent to your home system.
- **Incursion**: ACTION: Place 1 breach token in 1 or 2 systems that contain planets. You cannot place breach tokens in home systems, on Mecatol Rex, or in systems that already contain breach tokens. Systems that contain breach tokens contain epsilon wormholes.
- **Exile Destroyers**: Your destroyers are "Exile" destroyers with ANTI-FIGHTER BARRAGE 7 and the ability: "After an opponent activates a system that contains this ship, you may roll 1 die; on a 6+, that player destroys 1 of their non-fighter ships in this system."

**Leaders:**
- **Agent: Ahk Ravin** - When a player would gain a relic: You may exhaust this card; instead of gaining that relic, that player gains 2 trade goods and you gain that relic.
- **Commander: Ahk Siever** (Unlock: Have 3+ breach tokens on the game board) - At the end of your turn, you may place or remove 1 breach token.
- **Hero: Homesick Phantom** (Purge) - PHASE BREACH: Choose a non-home system; destroy all units in that system. Remove all command tokens from that system. Place 1 of your command tokens and 1 breach token in that system.

**Faction Technology:**
- **Subatomic Splicer** (Unit Upgrade - Flagship) - Cost 8, Combat 6x2, Move 2 | SUSTAIN DAMAGE. At the start of your turn, you may place 1 breach token in a non-home system that contains your ships.

**Flagship: Quietus** - Cost 8, Combat 7x2, Move 2, Capacity 4 | SUSTAIN DAMAGE. Other players' ships in systems that contain epsilon wormholes apply -1 to their combat rolls.

**Mech: Revenant** - Cost 2, Combat 6 | SUSTAIN DAMAGE. This unit can be transported by destroyers. After you use your INCURSION ability, you may place 1 infantry in a system that you placed a breach token in.

---

#### 2.1.5 The Firmament / The Obsidian (Dual Faction)
| Property | Value |
|----------|-------|
| ID | `firmament` / `obsidian` |
| Home System | Cronos / Cronos Hollow |
| Commodities | 3 |
| Starting Tech | Choose 1 green or yellow |

**Note:** This is a DUAL-SIDED faction. Players start as The Firmament and can transform into The Obsidian during the game by purging their hero.

**The Firmament Abilities:**
- **Plots Within Plots**: At the end of each round, draw 1 plot card. Plot cards can be played for various effects during the game.
- **Puppets of the Blade**: When resolving transactions, you may give plot cards. Other players may not give you promissory notes.

**The Obsidian Abilities (after transformation):**
- **Hollow Harvest**: When you destroy another player's units, gain 1 trade good.
- **Void Consumption**: At the start of your turn, you may purge 1 action card from your hand; if you do, draw 2 action cards.

**Plot Cards (9 unique cards):**
1. Asset Retrieval, Bribery, Collateral Damage, Data Breach
2. Hired Guns, Infiltration, Saboteur, Sleeper Cell, Weaponized Data

**The Firmament Leaders:**
- **Agent: Myru Vos** - After a player resolves the primary ability of a strategy card: You may exhaust this card; you may resolve that strategy card's secondary ability.
- **Commander: Captain Aroz** (Unlock: Have 3 plot cards in your play area) - At the start of each round, draw 1 additional plot card.
- **Hero: Sharsiss** (Purge) - REVELATION: You become The Obsidian. Flip your faction sheet, flagship, and mech cards. Gain 3 trade goods and research 1 technology.

**The Obsidian Leaders:**
- **Agent: Vos Hollow** - When a player would draw action cards: You may exhaust this card; instead of drawing, that player gains trade goods equal to the number of cards they would have drawn.
- **Commander: Aroz Hollow** (Unlock: Have 5+ trade goods) - When you win a combat, gain 1 command token.
- **Hero: Sharsiss Hollow** - (Already purged to become The Obsidian)

**Faction Technologies:**
- **Plane Splitter** (Unit Upgrade - Flagship) - Cost 8, Combat 6x2, Move 2, Capacity 4 | SUSTAIN DAMAGE. When this ship is destroyed, you may place 1 infantry and 1 fighter in an adjacent system.
- **Neural Parasite** (Green) - When another player researches a technology, you may exhaust this card; if you do, you may research that technology.

**The Firmament Flagship: Heaven's Eye** - Cost 8, Combat 5x2, Move 2, Capacity 4 | SUSTAIN DAMAGE. Other players cannot see your action cards.

**The Obsidian Flagship: Heaven's Hollow** - Cost 8, Combat 8x2, Move 1, Capacity 2 | SUSTAIN DAMAGE. After this ship wins a combat, you may destroy 1 of your ground forces in this system; if you do, draw 2 action cards.

**The Firmament Mech: Viper EX-23** - Cost 2, Combat 6 | SUSTAIN DAMAGE. When this unit is destroyed, you may draw 1 plot card.

**The Obsidian Mech: Viper Hollow** - Cost 2, Combat 5 | SUSTAIN DAMAGE. At the end of a round of combat, if you did not destroy an enemy unit this round, you may destroy this unit to destroy 1 enemy ground force.

---

### 2.2 Faction Leaders
**File:** `/packages/shared/src/data/leaders.ts`

Add leader mappings for 5 new factions (18 leaders total including dual Firmament/Obsidian):

```typescript
// Example structure
export const FACTION_LEADERS: Record<string, FactionLeaders> = {
  // ... existing factions
  last_bastion: {
    agent: { id: 'dame_briar', name: 'Dame Briar', ... },
    commander: { id: 'nip_and_tuck', name: 'Nip and Tuck', ... },
    hero: { id: 'lyra_keen', name: 'Lyra Keen', ... },
  },
  deepwrought: {
    agent: { id: 'dr_carrina', name: 'Dr. Carrina', ... },
    commander: { id: 'aello', name: 'Aello', ... },
    hero: { id: 'ta_zern', name: 'Ta Zern', ... },
  },
  ral_nel: {
    agent: { id: 'kan_kip_rel', name: 'Kan Kip Rel', ... },
    commander: { id: 'watchful_ojz', name: 'Watchful Ojz', ... },
    hero: { id: 'director_nel', name: 'Director Nel', ... },
  },
  crimson_rebellion: {
    agent: { id: 'ahk_ravin', name: 'Ahk Ravin', ... },
    commander: { id: 'ahk_siever', name: 'Ahk Siever', ... },
    hero: { id: 'homesick_phantom', name: 'Homesick Phantom', ... },
  },
  firmament: {
    agent: { id: 'myru_vos', name: 'Myru Vos', ... },
    commander: { id: 'captain_aroz', name: 'Captain Aroz', ... },
    hero: { id: 'sharsiss', name: 'Sharsiss', ... },
  },
  obsidian: {
    agent: { id: 'vos_hollow', name: 'Vos Hollow', ... },
    commander: { id: 'aroz_hollow', name: 'Aroz Hollow', ... },
    hero: null, // Purged to become Obsidian
  },
};
```

### 2.3 Leader Abilities
**File:** `/packages/shared/src/data/leader-abilities.ts`

Add ability definitions for all new faction leaders with:
- Timing specifications
- Effect implementations
- Unlock conditions (commanders)

### 2.4 Faction-Specific Mechanics

#### Last Bastion - Galvanize Token System
**New mechanic requiring:**
- Galvanize token state on units (dreadnought, flagship, mech only)
- Modified combat roll handlers (+1 die when galvanized)
- Action handler for spending strategy tokens to galvanize
- Visual token representation in UI

#### Deepwrought Scholarate - Coexistence System
**New mechanic requiring:**
- Coexistence state tracking per planet (list of coexisting player IDs)
- Ocean card deck (5 unique cards, faction-specific)
- Modified ground combat rules (skip combat on coexistence)
- Invasion restriction validation (Oceanbound ability)
- Ocean card draw triggers at end of action phase

#### Crimson Rebellion - Breach/Epsilon Wormhole System
**New mechanic requiring:**
- Breach token placement and tracking
- Epsilon wormhole adjacency calculations
- Home system adjacency via breach tokens
- Exile destroyer special combat abilities
- Action handler for INCURSION ability

#### Ral Nel Consortium - Miniaturization System
**New mechanic requiring:**
- Structure transport during tactical actions
- Linkship attachment mechanics for Destroyer II
- Survival Instinct destruction prevention
- Modified capacity calculations for Linkships

#### Firmament/Obsidian - Transformation System
**New mechanic requiring:**
- Dual faction sheet state tracking
- Plot card deck (9 unique cards)
- Mid-game faction transformation handler
- Separate component/leader sets for each form
- UI for flipping faction sheet

---

## Phase 3: Breakthroughs System

### 3.1 Breakthrough Data
**File:** `/packages/shared/src/data/breakthroughs.ts` (new file)

Define all 30 breakthroughs with correct synergies and abilities:

#### Base Game Factions (17 breakthroughs)

| Faction | Breakthrough | Synergy | Ability Summary |
|---------|--------------|---------|-----------------|
| The Arborec | Psychospore | Red/Green | Exhaust to remove command token from system with infantry, return to reinforcements, place 1 infantry |
| The Barony of Letnev | Gravleash Maneuvers | Blue/Red | Apply bonus to space combat rolls; match highest move value during movement |
| The Clan of Saar | Deorbit Barrage | Blue/Red | Spend resources to roll dice and assign hits to ground forces on distant planets |
| The Embers of Muaat | Stellar Genesis | Red/Yellow | Place Avernus token; move it with war suns through non-home systems |
| The Emirates of Hacan | Auto-Factories | Red/Yellow | Producing 3+ non-fighter ships grants a command token to fleet pool |
| The Federation of Sol | Bellum Gloriosum | Yellow/Green | Produce ground forces/fighters at ship capacity without counting against production |
| The Ghosts of Creuss | Particle Synthesis | Blue/Yellow | Wormholes provide production; reduce production costs in systems with wormholes |
| The L1Z1X Mindnet | Fealty Uplink | Red/Green | Place infantry from reinforcements equal to planet's influence when gaining control |
| The Mentak Coalition | The Table's Grace | Yellow/Green | Flip and place on Cruiser II when acquired; grants movement through enemy ships |
| The Naalu Collective | Mindsieve | Red/Green | Give opponent promissory note to resolve secondary strategy card ability without token |
| The Nekro Virus | Valefar Assimilator Z | N/A | Place "Z" assimilator tokens instead of gaining tech; flagship gains assimilated abilities |
| Sardakk N'orr | N'orr Supremacy | Blue/Red | After winning combat, gain a command token or research unit upgrade technology |
| The Universities of Jol-Nar | Specialized Compounds | Yellow/Green | Exhaust a planet with matching specialty instead of spending resources for technology |
| The Winnu | Imperator | Blue/Red | Bonus to combat rolls per opponent's "Support for the Throne"; bonus move after legendary planets |
| The Xxcha Kingdom | Archon's Gift | Yellow/Green | Spend influence as resources and resources as influence |
| The Yin Brotherhood | Yin Ascendant | Yellow/Green | Gain the alliance ability of a random, unused faction when gaining breakthrough or scoring objectives |
| The Yssaril Tribes | Deepgloom Executable | Yellow/Green | Share STALL TACTICS/SCHEMING with others; resolve bonus transactions outside normal limits |

#### Prophecy of Kings Factions (7 breakthroughs)

| Faction | Breakthrough | Synergy | Ability Summary |
|---------|--------------|---------|-----------------|
| The Argent Flight | Wing Transfer | Blue/Yellow | Place command tokens in adjacent systems with only your units; move ships among them |
| The Empyrean | Void Tether | Green/Blue | Place void tether tokens on borders; other players don't treat systems as adjacent unless allowed |
| The Mahact Gene-Sorcerers | Vaults of the Heir | Yellow/Green | Exhaust and purge a technology to gain a relic |
| The Naaz-Rokha Alliance | Absolute Synergy | Green/Blue | Return 3 mechs to flip into Eidolon Maximum—a durable hybrid unit |
| The Nomad | Thunder's Paradox | Yellow/Green | Exhaust one agent to ready any other agent |
| The Titans of Ul | Slumberstate Computing | Yellow/Green | Coexist peacefully instead of ground combat; draw action cards from coexisting players |
| The Vuil'Raith Cabal | Al'Raith Ix Ianovar | Red/Green | Brings The Fracture into play; move ingress tokens; grant move bonus in The Fracture |

#### Thunder's Edge Factions (5 breakthroughs)

| Faction | Breakthrough | Synergy | Ability Summary |
|---------|--------------|---------|-----------------|
| Last Bastion | The Icon | Red/Yellow | Exhaust to place produced ships in systems with tokens, ground forces, and no enemy ships |
| Deepwrought Scholarate | Visionaria Select | Yellow/Green | Other players spend trade goods to research tech; you gain those technologies |
| Ral Nel Consortium | Data Skimmer | Yellow/Green | Collect discarded action cards; choose one when passing |
| Crimson Rebellion | Resonance Generator | Blue/Red | Ships gain move bonus from home system or active breach; exhaust to flip or place breaches |
| The Firmament | The Sowing | Yellow/Green | Place trade goods on card at start of status phase; flips when becoming The Obsidian |
| The Obsidian | The Reaping | Yellow/Green | Gain trade goods from combat wins and double them at status phase |

#### Council Keleres (1 breakthrough)

| Faction | Breakthrough | Synergy | Ability Summary |
|---------|--------------|---------|-----------------|
| The Council Keleres | I.I.H.Q. Modernization | Yellow/Green | Gain the Custodia Vigilia planet card; neighbors with all players in Mecatol Rex area |

```typescript
// Example structure
export const BREAKTHROUGHS: Record<string, BreakthroughData> = {
  arborec: {
    id: 'psychospore',
    factionId: 'arborec',
    name: 'Psychospore',
    synergy: { color1: 'red', color2: 'green' },
    description: 'Exhaust this card to remove a command token from a system that contains your infantry and return it to your reinforcements, then place 1 infantry in a system that contains your units.',
    isExhaustable: true,
    expansion: 'thunders_edge',
  },
  // ... all 30 factions
};
```

### 3.2 Thunder's Edge Expedition Mechanic
**File:** `/apps/server/src/engine/handlers/expedition.ts` (new file)

Implement expedition slice claiming:
- 6 slices with different costs (5 resources, 2 action cards, 5 influence, 1 secret objective, tech specialty planet, 3 trade goods)
- First claimer gets breakthrough
- Final claimer places Thunder's Edge planet
- Majority controller gains infantry

### 3.3 Breakthrough Unlock Handler
**File:** `/apps/server/src/engine/handlers/breakthroughs.ts` (new file)

- Track breakthrough unlock state per player
- Handle expedition claims
- Handle special unlock conditions (Crimson Rebellion starts unlocked)

---

## Phase 4: New Systems & Planets

### 4.1 System Tiles
**File:** `/packages/game-data/src/data/systems.ts`

Add ~33 new system tiles (IDs 92+):
- Standard blue tiles with new planets
- New anomaly: Entropic Scar
- Space station tiles (3)

### 4.2 Legendary Planets (10 new)
**File:** `/packages/game-data/src/data/planets.ts`

| Planet | Resources | Influence | Trait | Ability |
|--------|-----------|-----------|-------|---------|
| **Mecatol Rex Ω** | 1 | 6 | — | "The Galactic Council": Swap secret objectives with deck |
| **Thunder's Edge** | 5 | 1 | — | "Jupiter Brain": Perform 1 extra action each turn |
| **Styx** | 4 | 0 | Hazardous, Relic | "A Song Like Marrow": Grants 1 VP while controlled |
| **Ordinian** | 0 | 0 | Legendary | "4X4ID Hyperion VI": Draw cards and gain command tokens |
| **Avernus** | 2 | 0 | Hazardous | "The Nucleus": Use Muaat faction ability freely |
| **Emelpar** | 0 | 2 | Cultural | "The Acropolis": Ready other components |
| **Faunus** | 1 | 3 | Industrial, Biotic | "Maxis Central Control": Gain unoccupied planets |
| **Garbozia** | 2 | 1 | Hazardous | "Salvage Yard": Recover action cards |
| **Industrex** | 2 | 0 | Industrial, Warfare | "Aeurex Mechanica": Deploy upgraded ships |
| **Tempesta** | 1 | 1 | Hazardous, Propulsion | "Ionian Fuel Refinery": Boost ship movement |

### 4.3 The Fracture System
**File:** `/apps/server/src/engine/handlers/fracture.ts` (new file)

#### Overview
The Fracture is an enigmatic area of space disconnected from the rest of the galaxy. It enters play when a player gains their Breakthrough and rolls a 1 or 10 on the expedition die. It contains 7 systems spread across 3 tiles, each populated with neutral military forces.

#### Fracture Tiles
| Tile ID | Systems | Entry Point |
|---------|---------|-------------|
| 125 | Cocytus (System 1), Styx (System 4) | Egress tokens |
| 126 | Lethe & Phlegethon (System 7) | Egress tokens |
| 127 | Additional systems | Egress tokens |

#### Fracture Planets

| Planet | Resources | Influence | Traits | Defending Force | Reward |
|--------|-----------|-----------|--------|-----------------|--------|
| **Cocytus** | 3 | 0 | Relic | 2 Cruisers, 2 Infantry | Gain 1 relic |
| **Styx** | 4 | 0 | Legendary, Relic | 1 Destroyer, 2 Dreadnoughts, 3 Infantry | Gain 1 VP + 1 relic |
| **Lethe** | 0 | 2 | Relic | 1 Carrier, 2 Fighters, 1 Infantry | Gain 1 relic |
| **Phlegethon** | 1 | 2 | Relic | 2 Fighters, 1 Infantry | Gain 1 relic |

#### Access Mechanics
- **Ingress Tokens**: Placed in regular galaxy systems. Systems with ingress tokens become adjacent to Fracture systems with egress points.
- **Egress Tokens**: Placed in Fracture systems. Allow movement back to the regular galaxy.
- Ingress and egress systems are NOT adjacent to each other within The Fracture.

#### Implementation Requirements
- Fracture state tracking in GameState
- Neutral unit placement and combat resolution
- Ingress/egress token management
- Relic rewards on planet control
- VP tracking for Styx control

### 4.4 Home Systems for New Factions
Add 5 new home system tiles:

| Faction | System Name | Planets | Special |
|---------|-------------|---------|---------|
| Last Bastion | Ordinian | Ordinian (legendary, 0/0) | Home planet is legendary |
| Ral Nel Consortium | Mez Lo Orz Pei Zsha | Mez (1/1), Lo Orz (0/2), Pei Zsha (2/0) | 3-planet home system |
| Deepwrought Scholarate | Ikatena | Ikatena (2/2) | Single planet |
| Crimson Rebellion | Ahk Creuxx | Ahk Creuxx (1/2) | Epsilon wormhole starts here |
| The Firmament | Cronos | Cronos (2/2) | Flips to Cronos Hollow |
| The Obsidian | Cronos Hollow | Cronos Hollow (2/2) | After transformation |

---

## Phase 5: Action Cards

### 5.1 New Action Cards (20 cards, 14 unique)
**File:** `/packages/shared/src/data/action-cards.ts`

| Card | Count | Timing | Effect |
|------|-------|--------|--------|
| Black Market Dealings | 1 | When negotiating a transaction | Include relics, action cards, and unscored secret objectives in transactions |
| Brillance | 1 | ACTION | Ready a planet with a technology specialty OR gain another player's breakthrough for this round |
| Crash Landing | 1 | When your last ship is destroyed in a system | Place ground forces equal to the ship's capacity on a planet in that system |
| Crisis | 1 | At the end of any player's turn | If 2+ players haven't passed, skip the next player's turn |
| Exchange Program | 1 | ACTION | Place 1 infantry in coexistence on a planet controlled by another player |
| Extreme Duress | 1 | At the start of another player's turn | If you have a readied strategy card, that player discards action cards and gives you trade goods |
| Lie in Wait | 1 | After a transaction is resolved | View and take 1 action card from each player involved in the transaction |
| Mercenary Contract | 1 | ACTION | Spend 2 trade goods to place neutral infantry on a planet you control |
| Pirate Contract | 4 | ACTION | Place 1 neutral destroyer in a non-home system |
| Pirate Fleet | 1 | ACTION | Spend 3 resources to place neutral ships (carrier, fighters, destroyer) in a system |
| Puppets on a String | 1 | At the end of your turn, if you have passed | Perform 1 additional action |
| Rescue | 1 | After another player moves ships into a system | Move 1 of your ships from an adjacent system into the active system |
| Strategize | 4 | ACTION | Perform the secondary ability of a readied or unchosen strategy card (without spending CC) |
| Overrule | 1 | ACTION | Perform the primary ability of a readied or unchosen strategy card |

### 5.2 Omega Action Cards (7 updates)
**File:** `/packages/shared/src/data/action-cards.ts`

These replace the original versions when using Thunder's Edge:

| Card | Timing | Ω Effect |
|------|--------|----------|
| Master Plan Ω | After you perform an action | Perform 1 additional action |
| Fighter Conscription Ω | ACTION | Place 1 fighter in each system that contains your space dock or ship with capacity |
| Blitz Ω | At the start of an invasion | Your non-fighter ships gain BOMBARDMENT 6 for this invasion |
| Hack Election Ω | After an agenda is revealed | You vote last during this agenda |
| Solar Flare Ω | After you activate a system | Other players cannot use SPACE CANNON during the movement step |
| Counterstroke Ω | After another player activates a system | Return your command token from that system to your tactic pool |
| Ghost Squad Ω | After you commit ground forces to a planet | Move any number of your ground forces between planets in the active system |

**Note:** War Machine Ω was listed in initial plan but not confirmed in official sources.

---

## Phase 6: Relics

### 6.1 New Relics (7 confirmed)
**File:** `/packages/shared/src/data/relics.ts`

| Relic | Effect Summary |
|-------|----------------|
| **Metali Void Armaments** | Combat enhancement - apply bonuses to combat rolls |
| **The Quantumcore** | Resource/influence manipulation - spend as either resource or influence |
| **The Silver Flame** | High-risk VP gain - purge to gain VP under certain conditions |
| **Lightrail Ordnance** | Movement/combat bonus - ships gain +1 movement and combat bonus |
| **Metali Void Shielding** | Defense + legendary attachment - reduce hits, attach to planet for ongoing effect |
| **The Triad** | Multi-use ability - exhaust for one of three different effects |
| **Heart of Ixth** | Special faction interaction - effects vary based on faction abilities |

### 6.2 Relic Implementation Notes
- Fracture planets grant relics when controlled (Cocytus, Styx, Lethe, Phlegethon)
- Styx additionally grants 1 VP
- New relic fragment acquisition via legendary planets

---

## Phase 7: Galactic Events

### 7.1 Galactic Events Data
**File:** `/packages/shared/src/data/galactic-events.ts` (new file)

Implement all 20 galactic events:

#### Codex IV Events (4)

| Event | Complexity | Rule Modification |
|-------|------------|-------------------|
| **Minor Factions** | 2 | Neutral faction systems in second ring with planetary traits; claim alliance cards by controlling all planets |
| **Total War** | 3 | Destroying units generates commodities in home system; convert 10 commodities into 1 VP |
| **Age of Commerce** | 1 | Players don't need to be neighbors for transactions; can share non-faction technology |
| **Age of Exploration** | 2 | Relics require 2 fragments instead of 3; ACTION to draw random tiles adjacent to edge systems |

#### Thunder's Edge Events (16)

| Event | Complexity | Rule Modification |
|-------|------------|-------------------|
| **Stellar Atomics** | 2 | Place control tokens to destroy ground forces/structures on non-home planets; losing token restricts agenda participation |
| **Age of Fighters** | 3 | All players gain Fighters II; fighters count toward fleet pools; non-fighters purged when destroyed |
| **Civilized Society** | 2 | All public objectives revealed; unlimited objective scoring per round; highest final score wins |
| **Dangerous Wilds** | 1 | Hazardous planets spawn neutral infantry based on resources; controlling grants tech research with reduced prereqs |
| **Call of the Void** | 1 | Moving units into The Fracture grants command tokens; ships in Fracture gain +1 movement |
| **Hidden Agenda** | 2 | Only speaker speaks during agenda; voting is secret and simultaneous; only totals revealed |
| **Wild, Wild Galaxy** | 3 | Multiple action cards receive enhanced effects (e.g., Flank Speed adds +2 instead of +1) |
| **Cultural Exchange Program** | 2 | Each player draws a faction card and takes its leaders for the game; Obsidian/Firmament gain relic instead |
| **Cosmic Phenomena** | 2 | Anomaly modifications—nebulae provide defender bonus, supernovas boost production, gravity rifts offer risky movement |
| **Advent of the War Sun** | 1 | All non-Muaat players gain War Sun tech; Muaat gains extra War Sun and commander unlock |
| **Mercenaries for Hire** | 1 | Unused faction alliance cards form purchasable deck; spend 3 TG for mercenary abilities |
| **Rapid Mobilization** | 1 | The Fracture enters play immediately; players gain adjacent infantry, space docks, and research initial tech |
| **Weird Wormholes** | 3 | After moving through wormhole, roll 1 die to randomly upgrade or downgrade ship types |
| **Monuments to the Ages** | 2 | Spend 5 TG to place monuments instead of structures; monuments accumulate commodities and provide VP |
| **Zealous Orthodoxy** | 1 | First player scoring 2 secret objectives gains 1 VP and grants their faction ability to all players |
| **Conventions of War Abandoned** | 3 | Bombardment hits destroy 3 units instead of 1; X-89 Bacterial Weapon purges enemy planet cards |

### 7.2 Event Setup Handler
**File:** `/apps/server/src/engine/handlers/galactic-events.ts` (new file)

- Event selection during setup (typically 1-2 events per game)
- Rule modification application at game start
- Event-specific game state tracking
- Complexity-based filtering for new players

### 7.3 Event UI Requirements
- Event selection modal during game setup
- Active events display in game UI
- Rule reminder tooltips
- Event-specific action buttons (e.g., Monuments placement)

---

## Phase 8: Strategy Card Updates

### 8.1 Omega Strategy Cards
**File:** `/packages/game-data/src/data/strategies.ts`

Add Ω versions:

**Warfare Ω:**
- Secondary: Spend strategy token to produce in home system

**Construction ΩΩ:**
- Additional secondary for structure placement via token

---

## Phase 9: Space Stations & Neutral Units

### 9.1 Space Stations
**File:** `/packages/shared/src/data/space-stations.ts` (new file)

```typescript
export const SPACE_STATIONS: SpaceStationData[] = [
  {
    id: 'the_watchtower',
    name: 'The Watchtower',
    resources: 2,
    influence: 2,
    abilities: ['commodity_bonus', 'cross_neighbor_trade', 'commodity_conversion'],
  },
  // Tsion Station, Oluz Station
];
```

### 9.2 Neutral Units Handler
**File:** `/apps/server/src/engine/handlers/neutral-units.ts` (new file)

- Neutral unit placement (from cards, events)
- Neutral unit combat resolution
- Fracture guardian units

---

## Phase 10: Coexistence Mechanic

### 10.1 Coexistence State
**File:** `/packages/shared/src/types/game-state.ts`

```typescript
interface CoexistenceState {
  planetId: string;
  coexistingPlayers: string[]; // Player IDs
}
```

### 10.2 Coexistence Handler
**File:** `/apps/server/src/engine/handlers/coexistence.ts` (new file)

- Ground force commitment with coexistence option
- Coexistence resolution rules
- Deepwrought ocean card system

---

## Phase 11: Alliance Cards (Optional/Future)

### 11.1 Alliance Card Data
**File:** `/packages/shared/src/data/alliance-cards.ts` (new file)

31 alliance cards for Minor Factions galactic event and other uses.

---

## Implementation Priority Order

### Sprint 1: Foundation (Weeks 1-2)
1. Type definitions (Phase 1)
2. Action cards data (Phase 5.1)
3. Basic relic additions (Phase 6)

### Sprint 2: New Factions (Weeks 3-5)
1. Faction data structures (Phase 2.1-2.3)
2. Home systems (Phase 4.4)
3. Basic faction abilities

### Sprint 3: Breakthroughs (Weeks 6-7)
1. Breakthrough data (Phase 3.1)
2. Expedition mechanic (Phase 3.2)
3. Breakthrough handlers (Phase 3.3)

### Sprint 4: Systems & Planets (Weeks 8-9)
1. New system tiles (Phase 4.1-4.2)
2. Fracture system (Phase 4.3)
3. Space stations (Phase 9.1)

### Sprint 5: Advanced Mechanics (Weeks 10-12)
1. Galactic events (Phase 7)
2. Neutral units (Phase 9.2)
3. Coexistence (Phase 10)
4. Strategy card updates (Phase 8)

### Sprint 6: Polish & Testing (Weeks 13-14)
1. Integration testing
2. UI updates for new mechanics
3. Balance testing

---

## File Changes Summary

### New Files to Create
| File | Description |
|------|-------------|
| `/packages/shared/src/data/breakthroughs.ts` | All 30 breakthrough definitions |
| `/packages/shared/src/data/galactic-events.ts` | 20 galactic event definitions |
| `/packages/shared/src/data/space-stations.ts` | 3 space station definitions |
| `/packages/shared/src/data/alliance-cards.ts` | 31 alliance card definitions |
| `/apps/server/src/engine/handlers/expedition.ts` | Thunder's Edge expedition mechanic |
| `/apps/server/src/engine/handlers/breakthroughs.ts` | Breakthrough unlock/effects |
| `/apps/server/src/engine/handlers/fracture.ts` | Fracture dimension mechanics |
| `/apps/server/src/engine/handlers/galactic-events.ts` | Event setup and effects |
| `/apps/server/src/engine/handlers/neutral-units.ts` | Neutral unit combat/placement |
| `/apps/server/src/engine/handlers/coexistence.ts` | Deepwrought coexistence mechanic |

### Existing Files to Modify
| File | Changes |
|------|---------|
| `/packages/shared/src/types/static-data.ts` | Add new type definitions |
| `/packages/shared/src/types/game-state.ts` | Add new state fields |
| `/packages/game-data/src/data/factions.ts` | Add 5 new factions |
| `/packages/game-data/src/data/systems.ts` | Add ~38 new system tiles |
| `/packages/shared/src/data/action-cards.ts` | Add 20 new cards + 8 Ω updates |
| `/packages/shared/src/data/relics.ts` | Add 10 new relics |
| `/packages/shared/src/data/leaders.ts` | Add 15+ new leader mappings |
| `/packages/shared/src/data/leader-abilities.ts` | Add new leader abilities |
| `/packages/game-data/src/data/strategies.ts` | Add Ω strategy cards |
| `/apps/server/src/engine/game-init.ts` | Support new expansion setup |

---

## Testing Requirements

### Unit Tests
- Faction ability implementations
- Breakthrough effects
- Action card effects
- Relic effects
- Galactic event rule modifications

### Integration Tests
- Expedition flow
- Fracture access and combat
- Coexistence mechanics
- Firmament/Obsidian transformation

### Game Flow Tests
- Full game with Thunder's Edge factions
- Galactic events game setup
- Mixed expansion games

---

## Phase 12: Frontend Components

### 12.1 New UI Components Required

#### Lobby/Setup Components
| Component | File | Description |
|-----------|------|-------------|
| GalacticEventSelect | `/apps/web/src/components/lobby/GalacticEventSelect.tsx` | Event selection during game setup |
| ExpansionToggle (update) | `/apps/web/src/components/lobby/CreateLobbyModal.tsx` | Add Thunder's Edge expansion option |
| FactionSelect (update) | `/apps/web/src/components/lobby/FactionSelect.tsx` | Add 5 new faction options + Firmament/Obsidian dual display |

#### Game Board Components
| Component | File | Description |
|-----------|------|-------------|
| BreakthroughPanel | `/apps/web/src/components/game/BreakthroughPanel.tsx` | Display/use breakthrough ability |
| BreakthroughCard3D | `/apps/web/src/components/game-board-3d/cards/BreakthroughCard3D.tsx` | 3D breakthrough card display |
| ExpeditionPanel | `/apps/web/src/components/game/ExpeditionPanel.tsx` | Expedition slice claiming UI |
| FractureDisplay3D | `/apps/web/src/components/game-board-3d/FractureDisplay3D.tsx` | Render The Fracture tiles |
| NeutralUnits3D | `/apps/web/src/components/game-board-3d/NeutralUnits3D.tsx` | Render neutral units in Fracture |
| GalacticEventDisplay | `/apps/web/src/components/game/GalacticEventDisplay.tsx` | Show active events and rules |
| CoexistenceIndicator | `/apps/web/src/components/game-board-3d/CoexistenceIndicator.tsx` | Planet coexistence state display |

#### Faction-Specific Components
| Component | File | Description |
|-----------|------|-------------|
| GalvanizeTokenDisplay | `/apps/web/src/components/game-board-3d/tokens/GalvanizeToken3D.tsx` | Last Bastion galvanize tokens on units |
| OceanCardPanel | `/apps/web/src/components/game/OceanCardPanel.tsx` | Deepwrought ocean cards display |
| BreachTokenDisplay | `/apps/web/src/components/game-board-3d/tokens/BreachToken3D.tsx` | Crimson Rebellion breach tokens |
| EpsilonWormholeIndicator | `/apps/web/src/components/game-board-3d/EpsilonWormhole3D.tsx` | Epsilon wormhole visual on systems |
| PlotCardPanel | `/apps/web/src/components/game/PlotCardPanel.tsx` | Firmament plot cards display |
| FactionTransformModal | `/apps/web/src/components/game/FactionTransformModal.tsx` | Firmament → Obsidian transformation UI |

#### Player Station Updates
| Component | Changes |
|-----------|---------|
| FactionSheet3D | Add dual-sided support for Firmament/Obsidian |
| LeaderCardsDisplay3D | Support new faction leaders |
| TechnologyDisplay3D | Support new faction technologies |
| PlayerDashboard | Add breakthrough display, galvanize counter |

### 12.2 Component Updates Required

#### HexTile3D.tsx
- Add support for Fracture tile rendering
- Add ingress/egress token display
- Add breach token overlay
- Add space station rendering

#### Unit3D.tsx
- Add galvanize token visual on units
- Add neutral unit color scheme (gray/silver)
- Add Linkship attachment visual for Ral Nel destroyers

#### PlayerStation3D.tsx
- Add breakthrough card slot
- Add plot cards area (Firmament)
- Add ocean cards area (Deepwrought)

---

## Phase 13: Required Assets

### 13.1 3D Models Required
**Location:** `/apps/web/public/models/`

| Model | Format | Description |
|-------|--------|-------------|
| `tokens/galvanize.obj` | OBJ | Galvanize token for Last Bastion units |
| `tokens/breach.obj` | OBJ | Breach token for Crimson Rebellion |
| `tokens/ingress.obj` | OBJ | Ingress token for Fracture access |
| `tokens/egress.obj` | OBJ | Egress token for Fracture access |
| `tokens/epsilon_wormhole.obj` | OBJ | Epsilon wormhole token |
| `structures/space_station.obj` | OBJ | Space station model (3 variants possible) |
| `units/mech_last_bastion.obj` | OBJ | A3 Valiance mech (optional faction-specific) |
| `units/destroyer_exile.obj` | OBJ | Exile destroyer for Crimson Rebellion (optional) |
| `units/linkship.obj` | OBJ | Linkship attachment for Ral Nel (optional) |

### 13.2 Image Assets Required
**Location:** `/apps/web/public/images/`

#### Faction Sheets (10 images)
| File | Description |
|------|-------------|
| `faction-sheets/last_bastion.face.jpg` | Last Bastion front |
| `faction-sheets/last_bastion.back.jpg` | Last Bastion back |
| `faction-sheets/deepwrought.face.jpg` | Deepwrought front |
| `faction-sheets/deepwrought.back.jpg` | Deepwrought back |
| `faction-sheets/ral_nel.face.jpg` | Ral Nel front |
| `faction-sheets/ral_nel.back.jpg` | Ral Nel back |
| `faction-sheets/crimson_rebellion.face.jpg` | Crimson Rebellion front |
| `faction-sheets/crimson_rebellion.back.jpg` | Crimson Rebellion back |
| `faction-sheets/firmament.face.jpg` | Firmament front |
| `faction-sheets/firmament.back.jpg` | Firmament back (Obsidian front) |

#### Faction Icons (6 images)
| File | Description |
|------|-------------|
| `faction-icons/last_bastion.png` | Last Bastion symbol |
| `faction-icons/deepwrought.png` | Deepwrought symbol |
| `faction-icons/ral_nel.png` | Ral Nel symbol |
| `faction-icons/crimson_rebellion.png` | Crimson Rebellion symbol |
| `faction-icons/firmament.png` | Firmament symbol |
| `faction-icons/obsidian.png` | Obsidian symbol |

#### Command Tokens (6 images)
| File | Description |
|------|-------------|
| `command-tokens/last_bastion.png` | Last Bastion command token |
| `command-tokens/deepwrought.png` | Deepwrought command token |
| `command-tokens/ral_nel.png` | Ral Nel command token |
| `command-tokens/crimson_rebellion.png` | Crimson Rebellion command token |
| `command-tokens/firmament.png` | Firmament command token |
| `command-tokens/obsidian.png` | Obsidian command token |

#### System Tiles (~40 images)
| File Pattern | Description |
|--------------|-------------|
| `tiles/tile_092.png` - `tiles/tile_130.png` | New system tiles including Fracture |
| `tiles-ttpg/tile_092.png` - `tiles-ttpg/tile_130.png` | TTPG format versions |

#### Card Images (~200 images)
| Category | Count | Pattern |
|----------|-------|---------|
| Action Cards | 20 | `cards/action/[card_id].jpg` |
| Action Cards Ω | 7 | `cards/action/[card_id]_omega.jpg` |
| Breakthroughs | 30 | `cards/breakthrough/[faction_id].jpg` |
| Relics | 7 | `cards/relic/[relic_id].jpg` |
| Galactic Events | 20 | `cards/galactic_event/[event_id].jpg` |
| Legendary Planets | 10 | `cards/legendary_planet/[planet_id].jpg` |
| Ocean Cards | 5 | `cards/ocean/[card_id].jpg` |
| Plot Cards | 9 | `cards/plot/[card_id].jpg` |
| Alliance Cards | 31 | `cards/alliance/[faction_id].jpg` |
| Leader Cards | 18 | `cards/leader/[leader_id].jpg` |
| Technology Cards | 10 | `cards/technology/[tech_id].jpg` |

#### Card Backs (6 images)
| File | Description |
|------|-------------|
| `card-backs/breakthrough.jpg` | Breakthrough card back |
| `card-backs/galactic_event.jpg` | Galactic event card back |
| `card-backs/ocean.jpg` | Ocean card back (Deepwrought) |
| `card-backs/plot.jpg` | Plot card back (Firmament) |
| `card-backs/alliance.jpg` | Alliance card back |
| `card-backs/legendary_planet.jpg` | Legendary planet ability card back |

#### Token Images (8 images)
| File | Description |
|------|-------------|
| `tokens/galvanize.png` | Galvanize token (Last Bastion) |
| `tokens/breach.png` | Breach token (Crimson Rebellion) |
| `tokens/epsilon_wormhole.png` | Epsilon wormhole token |
| `tokens/ingress.png` | Ingress token (Fracture) |
| `tokens/egress.png` | Egress token (Fracture) |
| `tokens/coexistence.png` | Coexistence marker |
| `tokens/monument.png` | Monument token (Galactic Event) |
| `tokens/neutral.png` | Neutral unit indicator |

### 13.3 Asset Summary

| Category | Count |
|----------|-------|
| 3D Models | ~10 |
| Faction Sheets | 10 |
| Faction Icons | 6 |
| Command Tokens | 6 |
| System Tiles | ~80 (40 × 2 formats) |
| Card Images | ~200 |
| Card Backs | 6 |
| Token Images | 8 |
| **TOTAL** | ~326 assets |

---

## Notes

### Not Included in Initial Implementation
- **Twilight's Fall Mode**: This is essentially a separate game variant with its own faction sheets, strategy cards, and components. Should be implemented as a separate game mode in the future.

### Dependencies
- All Codex content (1-4) should be complete before Thunder's Edge
- PoK systems must be fully implemented

### Sources
- [Thunder's Edge - Fantasy Flight Games](https://www.fantasyflightgames.com/en/news/2025/7/31/thunders-edge/)
- [Thunder's Edge - Twilight Imperium Wiki](https://twilight-imperium.fandom.com/wiki/Thunder's_Edge)
- [Breakthroughs - Twilight Imperium Wiki](https://twilight-imperium.fandom.com/wiki/Breakthroughs)
- [Galactic Events - Twilight Imperium Wiki](https://twilight-imperium.fandom.com/wiki/Galactic_Events)
- [The Fracture - Twilight Imperium Wiki](https://twilight-imperium.fandom.com/wiki/The_Fracture)
- [BoardGameGeek - Thunder's Edge](https://boardgamegeek.com/boardgame/451388/twilight-imperium-fourth-edition-thunders-edge)
