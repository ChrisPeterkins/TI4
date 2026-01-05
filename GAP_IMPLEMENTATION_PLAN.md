# TI4 Gap Implementation Plan

## Overview

This plan addresses all gaps identified in the January 2026 codebase audit. Tasks are organized by priority and estimated complexity.

**Last Updated:** January 2026 (Post-Sprint 4 Audit)

**Legend:**
- **Complexity:** S (Small - hours), M (Medium - 1-2 days), L (Large - 3-5 days), XL (Very Large - 1+ weeks)
- **Priority:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

---

## Phase 1: Game-Critical Backend Fixes (P0) ✅ COMPLETE

These issues can cause game-breaking scenarios or incorrect rule enforcement.

### 1.1 Action Card Edge Cases
**Complexity: M | Files: `action-card-effects.ts`, `action-cards.ts`**

- [x] **Ion Storm Wormhole Token** ✅ IMPLEMENTED
  - `ionStormToken` in GameState with systemId and side ('alpha'/'beta')
  - `flipIonStorm()` function in component-actions.ts
  - `getIonStormWormhole()` and `checkIonStormFlip()` helpers
  - Integrated into movement-modifiers.ts via `getEffectiveWormhole()`
  - Correctly handles Skilled Retreat exception (does NOT flip)

- [x] **Mirage Planet Implementation** ✅ IMPLEMENTED
  - Mirage in explorations.ts as frontier card
  - Legendary ability "Flight Academy" in legendary-planets.ts
  - `executeMirageAbility()` places 2 fighters in system with ships

- [x] **Infantry Hit Application** ✅ IMPLEMENTED
  - Ground force targeting in combat handlers
  - Plague and similar cards work correctly

- [x] **Home System Adjacency Checks** ✅ IMPLEMENTED
  - `hasShipsAdjacentToEnemyHome()` in objectives.ts
  - `countEnemyHomesWithAdjacentPlanets()` utility
  - `isEnemyHomeSystem()` helper function

- [x] **Tech Research from Cards** ✅ IMPLEMENTED
  - Prerequisites validated in technology.ts
  - "Ignore prerequisites" effects handled

### 1.2 Production System Completion ✅ COMPLETE
**Complexity: S | Files: `action-phase.ts`, validators**

- [x] **Space Dock Production Limits** ✅ IMPLEMENTED
  - `calculateProductionLimit()` in units.ts
  - Enforces planet resources + 2 (or +4 for Space Dock II)
  - Production validation in action-phase.ts validator

- [x] **Floating Factory (Saar)** ✅ IMPLEMENTED
  - Floating Factory handled in production system
  - Movement with fleet supported

### 1.3 Combat Edge Cases ✅ COMPLETE
**Complexity: S | Files: `combat.ts`, `invasion.ts`**

- [x] **Carrier Capacity Overflow** ✅ IMPLEMENTED (combat.ts:660-766)
  - `checkCapacityOverflow()` detects excess units
  - `resolveCapacityOverflow()` removes excess fighters/ground forces
  - Called when carriers destroyed via `removeUnit()`

- [x] **Graviton Laser System** ✅ IMPLEMENTED (combat.ts:890-943)
  - NOTE: Does NOT block movement (original plan was incorrect)
  - Forces space cannon hits to be assigned to non-fighters first
  - `validateGravitonLaserAssignment()` enforces this rule

- [x] **PDS Deep Space Cannon** ✅ IMPLEMENTED (combat.ts:315-387)
  - PDS II fires into adjacent systems
  - `getAdjacentPDSIIUnits()` finds eligible PDS
  - `getAllSpaceCannonOffenseUnits()` aggregates all firing units

### 1.4 Unit Reinforcement Limits ✅ COMPLETE
**Complexity: S | Files: `units.ts`, production validators**

- [x] **Track Unit Maximums Per Player** ✅ IMPLEMENTED
  - `BASE_UNIT_LIMITS` and `POK_UNIT_LIMITS` in units.ts
  - All unit counts match official rules

- [x] **Enforce During Production** ✅ IMPLEMENTED
  - `validateReinforcementsForProduction()` in units.ts
  - Called from action-phase.ts production validator (line 560)

- [x] **Handle "Out of Reinforcements"** ✅ IMPLEMENTED
  - `getAvailableReinforcements()` calculates available units
  - `hasReinforcementsAvailable()` check before production

### 1.5 Space Dock Placement Rules ✅ COMPLETE
**Complexity: S | Files: `production.ts`, validators**

- [x] **One Space Dock Per Planet** ✅ IMPLEMENTED
  - Validated in action-phase.ts (line 533)
  - Prevents second space dock on same planet

- [x] **Cannot Build in Opponent's Home System** ✅ IMPLEMENTED
  - Validated in action-phase.ts (line 529)
  - Error: "Cannot build space dock in opponent's home system"

---

## Phase 2: Faction Ability Automation (P1) ✅ MOSTLY COMPLETE

### 2.1 High-Impact Faction Abilities ✅ COMPLETE

#### Nekro Virus ✅ COMPLETE
- [x] **Galactic Threat / Technological Singularity** ✅ IMPLEMENTED
  - `checkTechnologicalSingularity()` in combat.ts
  - `handleTechnologicalSingularityGain()` and `handleSkipTechnologicalSingularity()`
  - Once per combat, gain tech when opponent's unit destroyed
- [x] **Valefar Assimilator X/Y** ✅ IMPLEMENTED
  - `placeAssimilatorToken()` in technology.ts
  - `isTechAssimilated()`, `hasEffectiveFactionTech()`, `getAssimilatedTechs()`
  - `getAvailableAssimilatorToken()` checks which token is free
  - `assimilatorTokens` tracked in PlayerState
- [x] **Cannot Research** ✅ IMPLEMENTED
  - Blocked in technology validators

#### Hacan ✅ COMPLETE
- [x] **Arbiters** ✅ IMPLEMENTED
  - Action card trading enabled in transaction validators
- [x] **Trade Convoys (Promissory)** ✅ IMPLEMENTED
  - Allows transactions with non-neighbors
  - Enforced in transaction validators
- [x] **Guild Ships** ✅ IMPLEMENTED
  - Flagship refreshes commodities

#### Yssaril Tribes ✅ COMPLETE
- [x] **Stall Tactics** ✅ IMPLEMENTED
  - `handleStallTactics()` in component-actions.ts (lines 716-770)
  - ACTION: Discard 1 action card
  - Includes Blackshade Infiltrator mech deploy trigger
- [x] **Scheming** ✅ IMPLEMENTED
  - `handleDrawActionCards()` in action-cards.ts (lines 129-193)
  - Draw +1 additional card, then discard 1
  - Tracks `pendingSchemingDiscard` for human players
- [x] **Crafty** ✅ IMPLEMENTED
  - No hand limit for Yssaril

#### L1Z1X Mindnet ✅ COMPLETE
- [x] **Assimilate** ✅ IMPLEMENTED
  - invasion.ts (lines 1181-1203)
  - Replaces enemy PDS and Space Docks with L1Z1X units
- [x] **Harrow** ✅ IMPLEMENTED
  - Bombardment at end of ground combat rounds
  - `l1z1xHarrow` handler registered
- [x] **Inheritance Systems** ✅ IMPLEMENTED
  - Commander unlock automation

#### Naalu Collective ✅ COMPLETE
- [x] **Telepathic** ✅ IMPLEMENTED
  - 0 Initiative token in strategy phase
  - `giftOfPrescienceUsed` tracking
- [x] **Matriarch Flagship** ✅ IMPLEMENTED
  - `fightersAsGroundForces` tracking in InvasionTracking
  - `hasMatriarchInSystem()` and `canCommitAsGroundForce()` helpers
  - Fighters return to space after combat
  - Cannot win with only fighters (results in DRAW)
- [x] **Foresight** ✅ IMPLEMENTED
  - Agent ability for agenda preview

### 2.2 Medium-Impact Faction Abilities
**Complexity: M | Files: `abilities/handlers/`**

- [x] **Arborec** - Letani Warriors production ✅ IMPLEMENTED
- [x] **Creuss** - Wormhole mechanics ✅ IMPLEMENTED
- [x] **Muaat** - War Sun prototype ✅ IMPLEMENTED
- [x] **Mentak** - Pillage and ambush ✅ IMPLEMENTED
- [x] **Sardakk N'orr** - Combat bonuses ✅ IMPLEMENTED
- [x] **Winnu** - Mecatol bonuses ✅ IMPLEMENTED
- [x] **Xxcha** - Peace Accords ✅ IMPLEMENTED
- [x] **Yin** - Indoctrination ✅ IMPLEMENTED

---

## Phase 3: Frontend UX Improvements (P1) ⏳ NOT STARTED

### 3.1 Keyboard Shortcuts
**Complexity: M | Files: New `hooks/useKeyboardShortcuts.ts`, various panels**

- [ ] Create `useKeyboardShortcuts` hook
- [ ] Add shortcut hints to UI elements
- [ ] Create shortcuts help modal (? key)
- [ ] Context-aware shortcuts (different per phase)

### 3.2 Confirmation Dialogs
**Complexity: S | Files: New `components/ui/ConfirmDialog.tsx`**

- [ ] Create reusable `ConfirmDialog` component
- [ ] Add confirmations for critical actions

### 3.3 Tooltips System
**Complexity: M | Files: New `components/ui/Tooltip.tsx`, all game components**

- [ ] Create `Tooltip` wrapper component
- [ ] Add tooltips to game elements

### 3.4 Loading States
**Complexity: S | Files: Various panels and modals**

- [ ] Create consistent `LoadingSpinner` component
- [ ] Add loading states for async operations

### 3.5 Error Handling UI
**Complexity: S | Files: New `components/ui/ErrorToast.tsx`**

- [ ] Create toast notification system
- [ ] Display validation errors clearly

---

## Phase 4: Promissory Note & Relic Completion (P2) 🔄 PARTIALLY COMPLETE

### 4.1 Promissory Note Conditional Effects
**Complexity: M | Files: `promissory-notes.ts`, handlers**

**Completed:**
- [x] **Political Secret** ✅ IMPLEMENTED (agenda-phase.ts:101-114)
  - Blocks original owner from voting when in play
- [x] **Support for the Throne** ✅ IMPLEMENTED
  - VP tracking on play and return
- [x] **Alliance (PoK)** ✅ IMPLEMENTED (promissory-notes.ts:517-576)
  - `canUseCommanderViaAlliance()` enables commander sharing
  - `hasCommanderAccess()` checks own or Alliance access
- [x] **Stymie (Arborec)** ✅ IMPLEMENTED (action-phase.ts:458-497)
  - Blocks production in/adjacent to holder's units
- [x] **Trade Convoys** ✅ IMPLEMENTED
  - Allows non-neighbor transactions

**Now Implemented:**
- [x] **Creuss IFF** ✅ IMPLEMENTED (promissory-notes.ts:694-754)
  - `executeCreussIff()` places/moves Creuss wormhole token
  - Added `creussWormholeToken` to GameState
- [x] **Cybernetic Enhancements (L1Z1X)** ✅ IMPLEMENTED (promissory-notes.ts:591-684)
  - `executeCyberneticEnhancements()` replaces infantry with fighters
- [x] **Antivirus (Nekro)** ✅ IMPLEMENTED (combat.ts:72-79)
  - Blocks Technological Singularity when in play
- [x] **Acquiescence (Winnu)** ✅ IMPLEMENTED (promissory-notes.ts:388-423)
  - Exchanges strategy cards at end of strategy phase
- [x] **Greyfire Mutagen (Yin)** ✅ IMPLEMENTED (faction-abilities.ts:699-742)
  - Triggers when Indoctrination used, grants infantry to holder

**All Promissory Notes Complete:**
- [x] **Promise of Protection (Mentak)** ✅ IMPLEMENTED (faction-abilities.ts:221-229)
  - Blocks Pillage ability when in play

### 4.2 Relic Fragment System ✅ COMPLETE
**Complexity: M | Files: `relics.ts`, `exploration.ts`**

- [x] **Fragment Tracking** ✅ IMPLEMENTED
  - `relicFragments` in PlayerState
  - Fragment gains from exploration
  - Tradeable in transactions

- [x] **Purge Mechanics** ✅ IMPLEMENTED
  - ACTION: Purge 3 fragments for 1 relic
  - Unknown fragment rules enforced
  - Naaz-Rokha special handling

- [x] **Relic Activation** ✅ IMPLEMENTED
  - All relic effects complete
  - Exhaustion tracking

---

## Phase 5: Data Completion (P2) 🔄 95% COMPLETE

### 5.1 PoK Action Cards ✅ COMPLETE
**Complexity: S | Files: `action-cards.ts`, `action-card-effects.ts`**

- [x] **27 PoK action cards implemented** (17 unique + duplicates)

**Previously Implemented (16 cards):**
- Waylay, Decoy Operation, Intercept, Rally
- Seize Artifact, Ancient Burial Sites, Salvage
- Deadly Plot, Emergency Meeting, Hack Election
- Boarding Party, Scuttle, Forward Supply Base
- Coup d'Etat, Sanction Rider, Keleres Rider

**Newly Added (January 2026 - 11 unique, 14 physical):**
- [x] **Archaeological Expedition** - Reveal top 3 exploration cards, gain relic fragments
- [x] **Exploration Probe** - Explore frontier token in/adjacent to system with ships
- [x] **Confounding Legal Text** - Become the elected player instead
- [x] **Diplomatic Pressure (x4)** - Target player gives you a promissory note
- [x] **Divert Funding** - Return non-unit tech, research another
- [x] **Reveal Prototype** - Spend 4 resources to research unit upgrade in combat
- [x] **Reverse Engineer** - Take discarded action card from discard pile
- [x] **Nav Suite** - Ignore anomaly effects during tactical action movement
- [x] **Rout** - Force opponent to announce retreat if able
- [x] **Refit Troops** - Replace up to 2 infantry with mechs
- [x] **Manipulate Investments** - Place up to 5 TG on strategy cards

### 5.1.1 Action Card Deck Building ✅ COMPLETE
**Complexity: S | Files: `action-cards.ts`, `game-init.ts`**

- [x] **Expansion-based deck building** ✅ IMPLEMENTED
  - `createActionCardDeck(expansions: Expansion[])` - Builds deck based on enabled expansions
  - `getEffectiveExpansions(expansions)` - Handles expansion hierarchy
  - `getActionCardCountForExpansions(expansions)` - Returns card count for UI
  - Thunder's Edge automatically includes all Codex content
  - Game initialization now passes enabled expansions to deck builder

### 5.2 Legendary Planet Abilities ✅ COMPLETE
**Complexity: M | Files: `legendary-planets.ts`**

- [x] **Primor** - "The Atrament" ✅ IMPLEMENTED
  - `executePrimorAbility()` places up to 2 infantry
- [x] **Mallice** - "Exterrix Headquarters" ✅ IMPLEMENTED
  - `executeMalliceAbility()` gains 2 TG or converts commodities
- [x] **Hope's End** - "Imperial Arms Vault" ✅ IMPLEMENTED
  - `executeHopesEndAbility()` places mech or draws action card
- [x] **Mirage** - "Flight Academy" ✅ IMPLEMENTED
  - `executeMirageAbility()` places up to 2 fighters

### 5.3 Tech Specialty Population
**Complexity: S | Files: `systems.ts`**

- [ ] Audit all planets for tech specialties (low priority)

### 5.4 Codex Content (Partial)
**Complexity: L | Files: Various data files**

- [ ] Codex I - Omega Cards
- [ ] Codex II - Alliance Mode (Defer)
- [ ] Codex III - Council Keleres sub-factions

---

## Phase 6: Advanced Combat & Movement (P2) ✅ COMPLETE

### 6.1 Advanced Movement Rules ✅ COMPLETE
- [x] **Gravity Rift Roll Per Ship** ✅ IMPLEMENTED (movement-modifiers.ts)
  - `rollGravityRift()` rolls 1-10, returns destroyed if 1-3
  - Called per ship exiting gravity rift
  - `hasGravityRiftDanger()` detects dangerous systems

- [x] **Hyperlane Movement** ✅ IMPLEMENTED
  - Hyperlane adjacency in hex.ts
  - Movement validation considers hyperlanes

### 6.2 Advanced Combat Interactions ✅ COMPLETE
- [x] **Nebula Defender +1 Combat** ✅ IMPLEMENTED (combat.ts:166-171)
  - Defender applies +1 to each space combat roll in nebula
  - Does NOT apply to AFB, bombardment, or space cannon
  - Does NOT apply to ground combat

- [x] **Anomaly Retreat Restrictions** ✅ IMPLEMENTED (combat.ts:636-653)
  - Cannot retreat into nebula (not active system)
  - Cannot retreat into supernova (ships cannot enter)
  - Cannot retreat into asteroid field WITHOUT Antimass Deflectors
  - CAN retreat into asteroid field WITH Antimass Deflectors
  - CAN retreat into gravity rift (dangerous but legal)

### 6.3 Previously Implemented Combat Features
- [x] **Faction Combat Modifiers** (combat-modifiers.ts)
  - Sardakk N'orr: +1 to all combat rolls
  - Jol-Nar: -1 to all combat rolls
  - Mentak Fourth Moon: Opponent cannot sustain damage

- [x] **Combat Technologies** (combat.ts)
  - Plasma Scoring: +1 die for bombardment/space cannon
  - Antimass Deflectors: -1 to opponent space cannon
  - Graviton Laser System: Hits must go to non-fighters first
  - Duranium Armor: Repair 1 damaged unit after assigning hits
  - Assault Cannon: Destroy 1 non-fighter at start of combat

- [x] **Retreat Validation** (combat.ts:597-673)
  - Adjacent system requirement
  - No enemy ships in retreat destination
  - Must have own ships or command token
  - Defender cannot retreat round 1

---

## Phase 7: Accessibility & Mobile (P3) ⏳ NOT STARTED

### 7.1 Accessibility Audit
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support

### 7.2 Mobile Responsive Design
- [ ] Responsive breakpoints
- [ ] Touch-friendly controls

---

## Phase 8: Polish & Quality of Life (P3) ⏳ NOT STARTED

### 8.1 Game Log Enhancements
- [ ] Export to file
- [ ] Search functionality

### 8.2 Spectator Mode
- [ ] Join as spectator
- [ ] Hide secret information

### 8.3 Reconnection Handling
- [ ] Auto-reconnect
- [ ] State sync

### 8.4 Undo System
- [ ] Action history
- [ ] Undo for non-revealed actions

---

## Current Status Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: P0 Backend | ✅ Complete | 100% |
| Phase 2: P1 Faction Abilities | ✅ Complete | 100% |
| Phase 3: P1 Frontend UX | ⏳ Not Started | 0% |
| Phase 4: P2 Promissory/Relics | ✅ Complete | 100% |
| Phase 5: P2 Data Completion | 🔄 Partial | 95% |
| Phase 6: P2 Advanced Combat | ✅ Complete | 100% |
| Phase 7: P3 Accessibility | ⏳ Not Started | 0% |
| Phase 8: P3 Polish | ⏳ Not Started | 0% |

**Game Engine Backend: ~99% Complete**
**Frontend UX: Functional but missing polish features**

---

## Next Priority Items

1. **Phase 3: Frontend UX** (Next Sprint)
   - Keyboard shortcuts, tooltips, confirmation dialogs

2. **Phase 5.4: Codex Content**
   - Council Keleres, Omega cards

---

## Rules Reference Sources

### Primary Sources
- [TI4 Rules Reference](https://ti4rules.github.io/) - Comprehensive searchable rules
- [TI Rules Help](https://www.tirules.com/) - Detailed rules with FAQ
- [Twilight Imperium Wiki](https://twilight-imperium.fandom.com/) - Community wiki with card text
- [BoardGameGeek TI4 Forums](https://boardgamegeek.com/boardgame/233078/) - Official FAQ threads

### Key Corrections Made

| Topic | Original Assumption | Correct Rule |
|-------|---------------------|--------------|
| Ion Storm | Blocks fighter movement | Is a WORMHOLE token that flips between alpha/beta |
| Graviton Laser System | Blocks movement | Forces hits to non-fighters first |
| Yssaril Stall Tactics | Triggered when others pass | Is an ACTION: Discard 1 card |
| L1Z1X Assimilate | Replaces infantry | Replaces PDS and Space Docks |
| Naalu Fighters | Can win ground combat | Cannot win; results in DRAW |

### Verified Implementations (All Passing - 1215 tests)

| System | Status | Location |
|--------|--------|----------|
| Carrier Capacity Overflow | ✅ | combat.ts:660-766 |
| Graviton Laser System | ✅ | combat.ts:890-943 |
| PDS II Adjacent Firing | ✅ | combat.ts:315-387 |
| Unit Reinforcement Limits | ✅ | units.ts |
| Political Secret | ✅ | agenda-phase.ts:101-114 |
| Alliance Commander Sharing | ✅ | promissory-notes.ts:517-576 |
| Stymie Production Block | ✅ | action-phase.ts:458-497 |
| Legendary Planet Abilities | ✅ | legendary-planets.ts |
| Ion Storm Token | ✅ | component-actions.ts:1330-1418 |
| Stall Tactics | ✅ | component-actions.ts:716-770 |
| L1Z1X Assimilate | ✅ | invasion.ts:1181-1203 |
| Naalu Matriarch | ✅ | invasion.ts validators |
| Nekro Valefar Assimilator | ✅ | technology.ts:281-472 |
| Technological Singularity | ✅ | combat.ts |
| Antivirus (Nekro Block) | ✅ | combat.ts:72-79 |
| Cybernetic Enhancements | ✅ | promissory-notes.ts:591-684 |
| Acquiescence (Winnu) | ✅ | promissory-notes.ts:388-423 |
| Creuss IFF | ✅ | promissory-notes.ts:694-754 |
| Greyfire Mutagen | ✅ | faction-abilities.ts:699-742 |
| Promise of Protection | ✅ | faction-abilities.ts:221-229 |
