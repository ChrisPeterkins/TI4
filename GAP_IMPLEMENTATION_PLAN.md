# TI4 Gap Implementation Plan

## Overview

This plan addresses all gaps identified in the January 2026 codebase audit. Tasks are organized by priority and estimated complexity.

**Legend:**
- **Complexity:** S (Small - hours), M (Medium - 1-2 days), L (Large - 3-5 days), XL (Very Large - 1+ weeks)
- **Priority:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

---

## Phase 1: Game-Critical Backend Fixes (P0)

These issues can cause game-breaking scenarios or incorrect rule enforcement.

### 1.1 Action Card Edge Cases
**Complexity: M | Files: `action-card-effects.ts`, `action-cards.ts`**

- [ ] **Ion Storm Wormhole Token** *(CORRECTED per official rules)*
  - Add `ionStormToken: { systemId: string, side: 'alpha' | 'beta' } | null` to GameState
  - Ion Storm is a WORMHOLE token placed in frontier systems (not a blocker)
  - Has alpha on one side, beta on the other
  - FLIPS to opposite side when ships pass through it during Move Ships or Retreat
  - Active player chooses initial side when placed
  - Does NOT flip for Skilled Retreat action card
  - Source: [BGG Ion Storm Thread](https://boardgamegeek.com/thread/2643063/ion-storm)

- [ ] **Mirage Planet Implementation** *(CORRECTED per official rules)*
  - Mirage is a FRONTIER exploration card (not cultural/hazardous/industrial)
  - When drawn: Place Mirage planet token in the empty system, gain Mirage planet card (ready), purge exploration card
  - Mirage stays permanently (does not disappear)
  - Legendary Ability "Flight Academy": Create 2 fighters in any system where you have a ship
  - Planet stats: 1 Resource / 2 Influence, Cultural trait
  - Source: [TI Rules - Exploration](https://www.tirules.com/R_exploration)

- [ ] **Infantry Hit Application**
  - Fix cards that deal infantry hits (Plague, etc.)
  - Ensure ground force targeting works correctly

- [ ] **Home System Adjacency Checks**
  - Validate cards requiring "adjacent to home system"
  - Add utility function: `isAdjacentToHomeSystem(systemId, playerId)`

- [ ] **Tech Research from Cards**
  - Validate prerequisites when researching via action cards
  - Handle "ignore prerequisites" effects properly

### 1.2 Production System Completion
**Complexity: S | Files: `action-phase.ts`, validators**

- [ ] **Space Dock Production Limits**
  - Enforce production limit = planet resources + 2
  - Track production per dock per activation
  - Space Dock II: production limit = planet resources + 4

- [ ] **Floating Factory (Saar)**
  - Allow production from Floating Factory in space
  - Production limit = 5 (or 7 with upgrade)
  - Movement with fleet

### 1.3 Combat Edge Cases
**Complexity: S | Files: `combat.ts`, `invasion.ts`**

- [ ] **Carrier Capacity Overflow**
  - When carrier destroyed, excess fighters must be assigned to other capacity or destroyed
  - Prompt player for fighter assignment

- [ ] **Graviton Laser System**
  - Block movement through systems with enemy PDS II
  - Add path validation check

- [ ] **PDS Deep Space Cannon**
  - PDS II can fire into adjacent systems
  - Validate targeting for space cannon offense

---

## Phase 2: Faction Ability Automation (P1)

### 2.1 High-Impact Faction Abilities
**Complexity: L | Files: `abilities/handlers/`, faction-specific files**

#### Nekro Virus *(CORRECTED per official rules)*
- [ ] **Galactic Threat** - When winning combat against a player, copy ONE of their technologies
  - Cannot copy faction technologies this way (use Valefar Assimilator for that)
  - Source: [TI Rules - Nekro](https://www.tirules.com/F_nekro)
- [ ] **Valefar Assimilator X/Y** - Used to copy FACTION technologies specifically
  - Place token on opponent's faction tech when gaining tech via faction abilities
  - Assimilator gains that tech's text while token is placed
  - Cannot copy mechs or printed faction units (e.g., Muaat Prototype War Sun I)
  - If copying unit upgrade of same type, must reuse same Assimilator token
- [ ] **Cannot Research** - Already blocked; verify Focused Research and other card edge cases
- [ ] **Valefar State Tracking** - Track which faction techs are currently copied

#### Hacan *(CORRECTED per official rules)*
- [ ] **Arbiters** - Passive ability allowing action card trading (not Trade Convoys)
  - Can trade action cards even with Political Secret played against them
  - Cannot trade when over hand limit (must discard first)
  - Can broker trades between other players
  - Source: [TI Rules - Hacan](https://www.tirules.com/F_hacan)
- [ ] **Trade Convoys (Promissory)** - Allows transactions with non-neighbors
  - Returns when holder activates system with Hacan units
- [ ] **Guild Ships** - Flagship refreshes commodities

#### Yssaril Tribes *(CORRECTED per official rules)*
- [ ] **Stall Tactics** - ACTION: Discard 1 action card from hand
  - This is an ACTION you take, NOT triggered by others passing
  - Allows "stalling" without committing to real actions
  - Source: [TI Rules - Yssaril](https://www.tirules.com/F_yssaril)
- [ ] **Scheming** - When drawing 1+ action cards, draw 1 ADDITIONAL card, then discard 1
  - Triggers each time cards are drawn (not just status phase)
  - Does NOT trigger for Mageon Implants (looking, not drawing)
- [ ] **Crafty** - No hand limit enforcement (already may be implemented)

#### L1Z1X Mindnet *(CORRECTED per official rules)*
- [ ] **Assimilate** - When gaining control of planet, REPLACE enemy PDS/Space Docks with yours
  - Not about infantry; replaces STRUCTURES
  - Only replaces if you have units in reinforcements
  - Source: [TI Rules - L1Z1X](https://www.tirules.com/F_lizix)
- [ ] **Harrow** - At END of each ground combat round, ships may use Bombardment
  - Only works when L1Z1X is ATTACKER (active player)
  - All ships with Bombardment can fire at the combat planet
  - Works with X-89 Bacterial Weapon
- [ ] **Inheritance Systems** - Commander unlock automation

#### Naalu Collective *(VERIFIED correct)*
- [ ] **Telepathic** - 0 Initiative token mechanics
  - Token stays with Naalu even if strategy card is exchanged
  - Source: [TI Rules - Naalu](https://www.tirules.com/F_naalu)
- [ ] **Matriarch Flagship** - Fighters commit to ground combat but return to space when combat ENDS
  - Cannot win with only fighters (results in DRAW, not victory)
  - Does NOT work with Dacxive Animators (draw = no trigger)
- [ ] **Foresight** - Look at top agenda before others (agent ability)

### 2.2 Medium-Impact Faction Abilities
**Complexity: M | Files: `abilities/handlers/`**

- [ ] **Arborec** - Letani Warriors production on planets
- [ ] **Creuss** - Wormhole Nexus and Delta wormhole placement
- [ ] **Muaat** - War Sun prototype, supernova movement
- [ ] **Mentak** - Pillage and ambush automation
- [ ] **Sardakk N'orr** - +1 combat bonus stacking
- [ ] **Winnu** - Mecatol control bonuses
- [ ] **Xxcha** - Peace Accords and political actions
- [ ] **Yin** - Indoctrination and devotion mechanics

---

## Phase 3: Frontend UX Improvements (P1)

### 3.1 Keyboard Shortcuts
**Complexity: M | Files: New `hooks/useKeyboardShortcuts.ts`, various panels**

```typescript
// Proposed shortcuts
const SHORTCUTS = {
  'p': 'pass',           // Pass turn
  'r': 'ready',          // Ready up (lobby)
  'Enter': 'confirm',    // Confirm current action
  'Escape': 'cancel',    // Cancel/close modal
  'Space': 'endTurn',    // End turn
  't': 'openTech',       // Open technology panel
  'a': 'openActions',    // Open action cards
  'c': 'openChat',       // Toggle chat
  'l': 'openLog',        // Toggle game log
  '1-8': 'selectStrategy', // Quick select strategy card
};
```

- [ ] Create `useKeyboardShortcuts` hook
- [ ] Add shortcut hints to UI elements
- [ ] Create shortcuts help modal (? key)
- [ ] Context-aware shortcuts (different per phase)

### 3.2 Confirmation Dialogs
**Complexity: S | Files: New `components/ui/ConfirmDialog.tsx`**

- [ ] Create reusable `ConfirmDialog` component
- [ ] Add confirmations for:
  - Discarding action cards
  - Passing turn
  - Retreat announcement
  - Purging heroes/relics
  - Leaving game/lobby
- [ ] "Don't ask again" option for non-critical actions

### 3.3 Tooltips System
**Complexity: M | Files: New `components/ui/Tooltip.tsx`, all game components**

- [ ] Create `Tooltip` wrapper component with consistent styling
- [ ] Add tooltips to:
  - Command tokens (explain each pool)
  - Strategy cards (quick ability summary)
  - Technology cards (prerequisites, effects)
  - Unit icons (stats, abilities)
  - Phase indicators (what happens in each phase)
  - Player action buttons (what each does)
- [ ] Support rich content (formatted text, icons)

### 3.4 Loading States
**Complexity: S | Files: Various panels and modals**

- [ ] Create consistent `LoadingSpinner` component
- [ ] Add loading states for:
  - Game state updates
  - Dice rolling animation
  - Action card plays (waiting for responses)
  - Turn transitions
- [ ] Skeleton loaders for card panels

### 3.5 Error Handling UI
**Complexity: S | Files: New `components/ui/ErrorToast.tsx`**

- [ ] Create toast notification system
- [ ] Display validation errors clearly
- [ ] Show network/connection issues
- [ ] Provide retry options where applicable

---

## Phase 4: Promissory Note & Relic Completion (P2)

### 4.1 Promissory Note Conditional Effects
**Complexity: M | Files: `promissory-notes.ts`, handlers**

- [ ] **Political Secret** - Trigger on agenda voting
- [ ] **Support for the Throne** - VP tracking on play
- [ ] **Alliance (PoK)** - Commander sharing mechanics
- [ ] **Faction-specific conditionals**:
  - Creuss IFF - Wormhole adjacency
  - Trade Convoys - Hacan action card trading
  - Antivirus - Nekro blocking

### 4.2 Relic Fragment System *(VERIFIED per official rules)*
**Complexity: M | Files: `relics.ts`, `exploration.ts`**
**Source: [TI Rules - Relics](https://www.tirules.com/R_relics)**

- [ ] **Fragment Tracking**
  - Add `relicFragments: { cultural: number, industrial: number, hazardous: number, unknown: number }` to PlayerState
  - Track fragment gains from exploration
  - Fragments can be traded as part of transactions

- [ ] **Purge Mechanics**
  - ACTION: Purge 3 fragments of the same type to gain 1 relic
  - Unknown fragments are WILD but at least ONE must be cultural/hazardous/industrial
  - CANNOT purge 3 unknown fragments alone
  - Draw from relic deck; if empty, no relic gained but fragments still purged
  - Naaz-Rokha special: Can purge 2 fragments OR purge 1 for a command token

- [ ] **Relic Activation**
  - Complete all relic effects
  - Exhaustion tracking (exhaust vs purge usage types)
  - When player eliminated: relics purged, fragments discarded

---

## Phase 5: Data Completion (P2)

### 5.1 PoK Action Cards
**Complexity: S | Files: `action-cards.ts`**

Add missing PoK action cards:
- [ ] Blitz
- [ ] Counterstroke
- [ ] Enigmatic Device
- [ ] Exploration cards with action timing
- [ ] Fighter Conscription
- [ ] Forward Supply Base
- [ ] Harness Energy (verify)
- [ ] Insider Information
- [ ] Master Plan
- [ ] Reparations
- [ ] Scramble Frequency (verify)
- [ ] Solar Flare
- [ ] War Machine (verify count)

### 5.2 Legendary Planet Abilities *(CORRECTED per official rules)*
**Complexity: M | Files: `systems.ts`, new `legendary-planets.ts`**
**Source: [TI Rules - Legendary Planets](https://www.tirules.com/R_legendary_planets)**

- [ ] **Primor** (2/1, Hazardous) - "The Atrament"
  - Exhaust at END of your turn to place up to 2 infantry on any planet you control
- [ ] **Mallice** (0/3, Cultural) - "Exterrix Headquarters"
  - Exhaust at END of your turn to gain 2 trade goods OR convert all commodities to trade goods
  - Connected via Gamma wormhole (exists in pocket dimension)
- [ ] **Hope's End** (3/0, Hazardous) - "Imperial Arms Vault"
  - Exhaust to gain 1 relic fragment of any type
- [ ] **Mirage** (1/2, Cultural) - "Flight Academy"
  - Exhaust to place 2 fighters in any system where you have a ship with capacity
  - Placed via Frontier exploration (see Ion Storm section)
- [ ] Add `legendaryAbility: { name: string, timing: string, effect: string }` to planet data
- [ ] Legendary planets are claimed EXHAUSTED when invaded
- [ ] Implement exhaust-based ability triggers

### 5.3 Tech Specialty Population
**Complexity: S | Files: `systems.ts`**

- [ ] Audit all planets for missing tech specialties
- [ ] Add `techSpecialty` to planets:
  - Wellon (Yellow)
  - Thibah (Blue)
  - Tar'mann (Green)
  - Mehar Xull (Red)
  - New Albion (Green)
  - Arinam (Red)
  - etc.

### 5.4 Codex Content (Partial)
**Complexity: L | Files: Various data files**

#### Codex I - Omega Cards
- [ ] Omega tech versions (if different mechanics)
- [ ] Updated promissory notes

#### Codex II - Alliance Mode (Defer)
- [ ] Team victory tracking
- [ ] Shared objectives
- [ ] Team trading rules

#### Codex III - Council Keleres
- [ ] Sub-faction variants (Argent, Mentak, Xxcha flavors)
- [ ] Unique starting conditions per variant
- [ ] Leader swaps per variant

---

## Phase 6: Advanced Combat & Movement (P2)

### 6.1 Advanced Movement Rules
**Complexity: M | Files: `hex.ts`, movement validators**

- [ ] **Gravity Rift Enhanced**
  - Roll for each ship passing through
  - Remove destroyed ships mid-movement

- [ ] **Wormhole Nexus (Creuss)**
  - Delta wormhole placement
  - Nexus tile control effects

- [ ] **Hyperlane Movement**
  - Validate hyperlane traversal for 5/7/8 player maps
  - Correct adjacency calculations

### 6.2 Advanced Combat Interactions
**Complexity: M | Files: `combat.ts`, ability handlers**

- [ ] **Nebula Combat**
  - Defender rolls +1 die
  - No retreat for attacker

- [ ] **Asteroid Field**
  - Ships destroyed on 1 roll
  - Movement restrictions

- [ ] **Multiple Sustain Damage Interactions**
  - Track damage sources
  - Direct Hit timing

---

## Phase 7: Accessibility & Mobile (P3)

### 7.1 Accessibility Audit
**Complexity: M | Files: All components**

- [ ] Add ARIA labels to interactive elements
- [ ] Ensure keyboard navigation (tab order)
- [ ] Add screen reader descriptions for:
  - Game state
  - Combat results
  - Card effects
- [ ] High contrast mode option
- [ ] Color-blind friendly palette (already partially done)

### 7.2 Mobile Responsive Design
**Complexity: L | Files: All component styles**

- [ ] Create responsive breakpoints
- [ ] Collapsible panels for mobile
- [ ] Touch-friendly controls:
  - Larger tap targets
  - Swipe gestures for panels
  - Pinch zoom for map
- [ ] Simplified mobile layout:
  - Tab bar for panels
  - Bottom sheet modals
  - Condensed player info

---

## Phase 8: Polish & Quality of Life (P3)

### 8.1 Game Log Enhancements
**Complexity: S | Files: `GameLog.tsx`**

- [ ] Export game log to file (JSON/text)
- [ ] Search within log
- [ ] Jump to round/phase
- [ ] Collapsible combat details

### 8.2 Spectator Mode
**Complexity: M | Files: Game page, state management**

- [ ] Join as spectator option
- [ ] Hide secret information
- [ ] Read-only game view
- [ ] Spectator chat channel

### 8.3 Reconnection Handling
**Complexity: M | Files: Socket handling, game page**

- [ ] Graceful disconnect detection
- [ ] Auto-reconnect with state sync
- [ ] "Reconnecting..." UI state
- [ ] Preserve pending actions

### 8.4 Undo System
**Complexity: L | Files: Game engine, action handlers**

- [ ] Track action history
- [ ] Allow undo for non-revealed actions:
  - Movement before ending
  - Production before confirming
- [ ] Undo request/approval for multiplayer
- [ ] Clear undo boundary points (combat, reveals)

---

## Implementation Order

### Sprint 1: Critical Fixes (Week 1-2)
1. Action Card Edge Cases (1.1)
2. Production System Completion (1.2)
3. Combat Edge Cases (1.3)

### Sprint 2: Faction Abilities (Week 3-4)
1. Nekro Virus automation (2.1)
2. Hacan trading (2.1)
3. Other high-impact factions (2.1)

### Sprint 3: UX Improvements (Week 5-6)
1. Keyboard Shortcuts (3.1)
2. Confirmation Dialogs (3.2)
3. Tooltips System (3.3)

### Sprint 4: Data & Systems (Week 7-8)
1. PoK Action Cards (5.1)
2. Relic Fragment System (4.2)
3. Promissory Note Effects (4.1)

### Sprint 5: Polish (Week 9-10)
1. Legendary Planets (5.2)
2. Loading States (3.4)
3. Error Handling UI (3.5)

### Sprint 6: Advanced Features (Week 11-12)
1. Medium-impact Faction Abilities (2.2)
2. Advanced Movement (6.1)
3. Game Log Enhancements (8.1)

### Future Sprints
- Accessibility (Phase 7)
- Mobile Support (Phase 7)
- Codex Content (Phase 5.4)
- Spectator Mode (8.2)
- Undo System (8.4)

---

## Success Metrics

- [ ] All base game + PoK factions playable with full automation
- [ ] Zero game-blocking bugs in action cards
- [ ] Keyboard shortcuts for all common actions
- [ ] Tooltips on all interactive elements
- [ ] 100% of promissory notes functional
- [ ] Complete relic/exploration system
- [ ] Mobile-usable interface

---

## Notes

- Prioritize P0/P1 items before expanding to new content
- Each sprint should include test coverage for new features
- Consider creating integration tests for complex faction abilities
- Document new keyboard shortcuts in help modal
- Keep accessibility in mind during all UI work

---

## Rules Reference Sources

The following sources were consulted to verify and correct this implementation plan (January 2026):

### Primary Sources
- [TI4 Rules Reference](https://ti4rules.github.io/) - Comprehensive searchable rules
- [TI Rules Help](https://www.tirules.com/) - Detailed rules with FAQ
- [Twilight Imperium Wiki](https://twilight-imperium.fandom.com/) - Community wiki with card text
- [BoardGameGeek TI4 Forums](https://boardgamegeek.com/boardgame/233078/) - Official FAQ threads

### Key Corrections Made

| Topic | Original Assumption | Correct Rule |
|-------|---------------------|--------------|
| Ion Storm | Blocks fighter movement | Is a WORMHOLE token that flips between alpha/beta |
| Yssaril Stall Tactics | Triggered when others pass | Is an ACTION: Discard 1 card |
| L1Z1X Assimilate | Replaces infantry | Replaces PDS and Space Docks |
| Hacan Trading | Trade Convoys enables action cards | Arbiters enables action cards; Trade Convoys enables non-neighbor |
| Mirage | Appears/disappears | Placed permanently via Frontier exploration |
| Naalu Fighters | Can win ground combat | Cannot win; results in DRAW |
| Relic Fragments | 3 unknown = 1 relic | At least 1 must be cultural/hazardous/industrial |

### Faction-Specific Rule Sources
- [Nekro Virus](https://www.tirules.com/F_nekro)
- [Hacan](https://www.tirules.com/F_hacan)
- [Yssaril](https://www.tirules.com/F_yssaril)
- [L1Z1X](https://www.tirules.com/F_lizix)
- [Naalu](https://www.tirules.com/F_naalu)
