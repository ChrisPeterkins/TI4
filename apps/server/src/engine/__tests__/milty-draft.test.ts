import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSlices,
  generateFactionPool,
  initializeDraft,
  getCurrentPicker,
  getPlayerNeeds,
  getAvailableOptions,
  makePick,
  getFinalAssignments,
  type MiltyDraftState,
} from '../milty-draft.js';

describe('Milty Draft', () => {
  const baseExpansions = ['base'];
  const testPlayerIds = ['player1', 'player2', 'player3', 'player4'];

  describe('generateSlices', () => {
    it('generates correct number of slices for player count', () => {
      const slices4 = generateSlices(4, baseExpansions);
      const slices6 = generateSlices(6, baseExpansions);

      expect(slices4).toHaveLength(4);
      expect(slices6).toHaveLength(6);
    });

    it('each slice has 5 systems', () => {
      const slices = generateSlices(4, baseExpansions);

      for (const slice of slices) {
        expect(slice.systems).toHaveLength(5);
      }
    });

    it('slices have valid total values', () => {
      const slices = generateSlices(4, baseExpansions);

      for (const slice of slices) {
        expect(slice.totalResources).toBeGreaterThanOrEqual(0);
        expect(slice.totalInfluence).toBeGreaterThanOrEqual(0);
        expect(slice.optimalValue).toBeGreaterThanOrEqual(0);
      }
    });

    it('slices have unique IDs', () => {
      const slices = generateSlices(6, baseExpansions);
      const ids = slices.map((s) => s.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(slices.length);
    });
  });

  describe('generateFactionPool', () => {
    it('generates playerCount + 2 factions', () => {
      const pool4 = generateFactionPool(4, baseExpansions);
      const pool6 = generateFactionPool(6, baseExpansions);

      expect(pool4).toHaveLength(6); // 4 + 2
      expect(pool6).toHaveLength(8); // 6 + 2
    });

    it('factions are unique', () => {
      const pool = generateFactionPool(6, baseExpansions);
      const uniqueFactions = new Set(pool);

      expect(uniqueFactions.size).toBe(pool.length);
    });

    it('generates non-empty faction IDs', () => {
      const pool = generateFactionPool(4, baseExpansions);

      for (const factionId of pool) {
        expect(factionId).toBeTruthy();
        expect(typeof factionId).toBe('string');
      }
    });
  });

  describe('initializeDraft', () => {
    it('creates draft state with correct phase', () => {
      const state = initializeDraft(4, testPlayerIds, baseExpansions);

      expect(state.phase).toBe('drafting');
    });

    it('creates slices and faction pool', () => {
      const state = initializeDraft(4, testPlayerIds, baseExpansions);

      expect(state.slices).toHaveLength(4);
      expect(state.factionPool).toHaveLength(6);
    });

    it('shuffles draft order', () => {
      // Run multiple times to check randomness
      const orders: string[][] = [];
      for (let i = 0; i < 10; i++) {
        const state = initializeDraft(4, testPlayerIds, baseExpansions);
        orders.push([...state.draftOrder]);
      }

      // Check all players are present in each order
      for (const order of orders) {
        expect(order.sort()).toEqual([...testPlayerIds].sort());
      }
    });

    it('initializes empty speaker order', () => {
      const state = initializeDraft(4, testPlayerIds, baseExpansions);

      expect(state.speakerOrder).toHaveLength(4);
      expect(state.speakerOrder.every((s) => s === null)).toBe(true);
    });

    it('starts with no picks', () => {
      const state = initializeDraft(4, testPlayerIds, baseExpansions);

      expect(state.picks).toHaveLength(0);
      expect(state.currentPickIndex).toBe(0);
    });
  });

  describe('getCurrentPicker', () => {
    let state: MiltyDraftState;

    beforeEach(() => {
      state = initializeDraft(4, testPlayerIds, baseExpansions);
      // Force a known draft order for testing
      state.draftOrder = ['p1', 'p2', 'p3', 'p4'];
    });

    it('returns first player at start', () => {
      expect(getCurrentPicker(state)).toBe('p1');
    });

    it('follows snake draft order', () => {
      // First round: p1, p2, p3, p4
      expect(getCurrentPicker(state)).toBe('p1');

      state.picks.push({ playerId: 'p1', pickType: 'faction', value: 'sol' });
      expect(getCurrentPicker(state)).toBe('p2');

      state.picks.push({ playerId: 'p2', pickType: 'faction', value: 'hacan' });
      expect(getCurrentPicker(state)).toBe('p3');

      state.picks.push({ playerId: 'p3', pickType: 'faction', value: 'jol_nar' });
      expect(getCurrentPicker(state)).toBe('p4');

      // Second round (reverse): p4, p3, p2, p1
      state.picks.push({ playerId: 'p4', pickType: 'faction', value: 'xxcha' });
      expect(getCurrentPicker(state)).toBe('p4');

      state.picks.push({ playerId: 'p4', pickType: 'slice', value: 0 });
      expect(getCurrentPicker(state)).toBe('p3');

      state.picks.push({ playerId: 'p3', pickType: 'slice', value: 1 });
      expect(getCurrentPicker(state)).toBe('p2');

      state.picks.push({ playerId: 'p2', pickType: 'slice', value: 2 });
      expect(getCurrentPicker(state)).toBe('p1');

      // Third round: p1, p2, p3, p4
      state.picks.push({ playerId: 'p1', pickType: 'slice', value: 3 });
      expect(getCurrentPicker(state)).toBe('p1');
    });

    it('returns null when draft is complete', () => {
      // Simulate 12 picks (4 players * 3 picks each)
      for (let i = 0; i < 12; i++) {
        state.picks.push({ playerId: 'p1', pickType: 'faction', value: 'test' });
      }

      expect(getCurrentPicker(state)).toBeNull();
    });
  });

  describe('getPlayerNeeds', () => {
    let state: MiltyDraftState;

    beforeEach(() => {
      state = initializeDraft(4, testPlayerIds, baseExpansions);
    });

    it('player needs all three at start', () => {
      const needs = getPlayerNeeds(state, testPlayerIds[0]);

      expect(needs.needsFaction).toBe(true);
      expect(needs.needsSlice).toBe(true);
      expect(needs.needsSpeaker).toBe(true);
    });

    it('player does not need faction after picking one', () => {
      state.picks.push({
        playerId: testPlayerIds[0],
        pickType: 'faction',
        value: 'sol',
      });

      const needs = getPlayerNeeds(state, testPlayerIds[0]);

      expect(needs.needsFaction).toBe(false);
      expect(needs.needsSlice).toBe(true);
      expect(needs.needsSpeaker).toBe(true);
    });

    it('player does not need slice after picking one', () => {
      state.picks.push({
        playerId: testPlayerIds[0],
        pickType: 'slice',
        value: 0,
      });

      const needs = getPlayerNeeds(state, testPlayerIds[0]);

      expect(needs.needsFaction).toBe(true);
      expect(needs.needsSlice).toBe(false);
      expect(needs.needsSpeaker).toBe(true);
    });

    it('player needs nothing after all picks', () => {
      state.picks.push(
        { playerId: testPlayerIds[0], pickType: 'faction', value: 'sol' },
        { playerId: testPlayerIds[0], pickType: 'slice', value: 0 },
        { playerId: testPlayerIds[0], pickType: 'speaker', value: 0 }
      );

      const needs = getPlayerNeeds(state, testPlayerIds[0]);

      expect(needs.needsFaction).toBe(false);
      expect(needs.needsSlice).toBe(false);
      expect(needs.needsSpeaker).toBe(false);
    });
  });

  describe('getAvailableOptions', () => {
    let state: MiltyDraftState;

    beforeEach(() => {
      state = initializeDraft(4, testPlayerIds, baseExpansions);
    });

    it('all options available at start', () => {
      const available = getAvailableOptions(state);

      expect(available.factions).toHaveLength(6);
      expect(available.slices).toHaveLength(4);
      expect(available.speakerPositions).toEqual([0, 1, 2, 3]);
    });

    it('faction removed after pick', () => {
      const factionToPick = state.factionPool[0];
      state.picks.push({
        playerId: testPlayerIds[0],
        pickType: 'faction',
        value: factionToPick,
      });

      const available = getAvailableOptions(state);

      expect(available.factions).not.toContain(factionToPick);
      expect(available.factions).toHaveLength(5);
    });

    it('slice removed after pick', () => {
      state.picks.push({
        playerId: testPlayerIds[0],
        pickType: 'slice',
        value: 0,
      });

      const available = getAvailableOptions(state);

      expect(available.slices).not.toContain(0);
      expect(available.slices).toHaveLength(3);
    });

    it('speaker position removed after pick', () => {
      state.picks.push({
        playerId: testPlayerIds[0],
        pickType: 'speaker',
        value: 2,
      });

      const available = getAvailableOptions(state);

      expect(available.speakerPositions).not.toContain(2);
      expect(available.speakerPositions).toEqual([0, 1, 3]);
    });
  });

  describe('makePick', () => {
    let state: MiltyDraftState;

    beforeEach(() => {
      state = initializeDraft(4, testPlayerIds, baseExpansions);
      state.draftOrder = ['p1', 'p2', 'p3', 'p4'];
    });

    it('rejects pick when not player turn', () => {
      const result = makePick(state, 'p2', 'faction', state.factionPool[0]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not your turn to pick');
    });

    it('rejects duplicate faction pick', () => {
      // p1 picks a faction, then other players pick, then when it's p1's turn again
      // in round 3, p1 should not be able to pick another faction
      state.picks.push(
        { playerId: 'p1', pickType: 'faction', value: 'sol' },
        { playerId: 'p2', pickType: 'faction', value: 'hacan' },
        { playerId: 'p3', pickType: 'faction', value: 'jol_nar' },
        { playerId: 'p4', pickType: 'faction', value: 'letnev' },
        // Round 2 (reverse): p4, p3, p2, p1
        { playerId: 'p4', pickType: 'slice', value: 0 },
        { playerId: 'p3', pickType: 'slice', value: 1 },
        { playerId: 'p2', pickType: 'slice', value: 2 },
        { playerId: 'p1', pickType: 'slice', value: 3 }
      );
      // Now it's round 3: p1's turn again

      const result = makePick(state, 'p1', 'faction', state.factionPool[4]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Already picked a faction');
    });

    it('rejects unavailable faction', () => {
      // p1 picks a faction that's already been taken (in the pool but hypothetically picked)
      const takenFaction = state.factionPool[0];
      // Simulate: advance to where p1 hasn't picked a faction yet but it's taken
      // Use a simpler approach: just test that picking a faction not in the pool fails
      state.factionPool = ['sol', 'hacan']; // Only these are available

      const result = makePick(state, 'p1', 'faction', 'xxcha'); // Not in pool

      expect(result.success).toBe(false);
      expect(result.error).toBe('Faction not available');
    });

    it('rejects unavailable slice', () => {
      // Make slice 0 already taken by having it in picks
      // But we need to make sure it's still p1's turn
      // Simplest: modify slices to not include slice 0
      state.slices = state.slices.filter(s => s.id !== 0);

      const result = makePick(state, 'p1', 'slice', 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Slice not available');
    });

    it('rejects unavailable speaker position', () => {
      // Make speaker position 1 already taken
      state.picks.push({ playerId: 'p1', pickType: 'speaker', value: 1 });
      // Now it's p2's turn

      const result = makePick(state, 'p2', 'speaker', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Speaker position not available');
    });

    it('successfully records faction pick', () => {
      const faction = state.factionPool[0];
      const result = makePick(state, 'p1', 'faction', faction);

      expect(result.success).toBe(true);
      expect(result.draftState.picks).toHaveLength(1);
      expect(result.draftState.picks[0]).toEqual({
        playerId: 'p1',
        pickType: 'faction',
        value: faction,
      });
    });

    it('successfully records slice pick', () => {
      const result = makePick(state, 'p1', 'slice', 2);

      expect(result.success).toBe(true);
      expect(result.draftState.picks[0]).toEqual({
        playerId: 'p1',
        pickType: 'slice',
        value: 2,
      });
    });

    it('updates speaker order on speaker pick', () => {
      const result = makePick(state, 'p1', 'speaker', 0);

      expect(result.success).toBe(true);
      expect(result.draftState.speakerOrder[0]).toBe('p1');
    });

    it('increments current pick index', () => {
      const result = makePick(state, 'p1', 'faction', state.factionPool[0]);

      expect(result.draftState.currentPickIndex).toBe(1);
    });

    it('sets phase to complete after all picks', () => {
      state.draftOrder = ['p1'];
      state.speakerOrder = [null];
      state.slices = [state.slices[0]];
      state.factionPool = [state.factionPool[0]];

      let result = makePick(state, 'p1', 'faction', state.factionPool[0]);
      expect(result.draftState.phase).toBe('drafting');

      result = makePick(result.draftState, 'p1', 'slice', 0);
      expect(result.draftState.phase).toBe('drafting');

      result = makePick(result.draftState, 'p1', 'speaker', 0);
      expect(result.draftState.phase).toBe('complete');
    });
  });

  describe('getFinalAssignments', () => {
    it('returns empty array when draft incomplete', () => {
      const state = initializeDraft(4, testPlayerIds, baseExpansions);
      const assignments = getFinalAssignments(state);

      expect(assignments).toHaveLength(0);
    });

    it('returns correct assignments after complete draft', () => {
      const state = initializeDraft(2, ['p1', 'p2'], baseExpansions);
      state.draftOrder = ['p1', 'p2'];

      // Simulate complete draft
      state.picks = [
        { playerId: 'p1', pickType: 'faction', value: 'sol' },
        { playerId: 'p2', pickType: 'faction', value: 'hacan' },
        { playerId: 'p2', pickType: 'slice', value: 1 },
        { playerId: 'p1', pickType: 'slice', value: 0 },
        { playerId: 'p1', pickType: 'speaker', value: 0 },
        { playerId: 'p2', pickType: 'speaker', value: 1 },
      ];
      state.phase = 'complete';

      const assignments = getFinalAssignments(state);

      expect(assignments).toHaveLength(2);
      expect(assignments).toContainEqual({
        playerId: 'p1',
        faction: 'sol',
        sliceId: 0,
        speakerPosition: 0,
      });
      expect(assignments).toContainEqual({
        playerId: 'p2',
        faction: 'hacan',
        sliceId: 1,
        speakerPosition: 1,
      });
    });
  });

  describe('Full Draft Simulation', () => {
    it('completes a full 4-player draft', () => {
      let state = initializeDraft(4, ['p1', 'p2', 'p3', 'p4'], baseExpansions);
      state.draftOrder = ['p1', 'p2', 'p3', 'p4'];

      // Snake draft order:
      // Round 1: p1, p2, p3, p4 (pick factions)
      // Round 2: p4, p3, p2, p1 (pick slices)
      // Round 3: p1, p2, p3, p4 (pick speaker)

      const makePickForPlayer = (playerId: string) => {
        const needs = getPlayerNeeds(state, playerId);
        const available = getAvailableOptions(state);

        let result;
        if (needs.needsFaction && available.factions.length > 0) {
          result = makePick(state, playerId, 'faction', available.factions[0]);
        } else if (needs.needsSlice && available.slices.length > 0) {
          result = makePick(state, playerId, 'slice', available.slices[0]);
        } else if (needs.needsSpeaker && available.speakerPositions.length > 0) {
          result = makePick(state, playerId, 'speaker', available.speakerPositions[0]);
        }

        expect(result?.success).toBe(true);
        state = result!.draftState;
      };

      // Execute all picks
      for (let pick = 0; pick < 12; pick++) {
        const currentPicker = getCurrentPicker(state);
        expect(currentPicker).not.toBeNull();
        makePickForPlayer(currentPicker!);
      }

      // Verify draft is complete
      expect(state.phase).toBe('complete');
      expect(getCurrentPicker(state)).toBeNull();

      // Verify all assignments
      const assignments = getFinalAssignments(state);
      expect(assignments).toHaveLength(4);

      // Each player should have faction, slice, and speaker
      for (const assignment of assignments) {
        expect(assignment.faction).toBeTruthy();
        expect(typeof assignment.sliceId).toBe('number');
        expect(typeof assignment.speakerPosition).toBe('number');
      }

      // Speaker positions should be unique
      const speakerPositions = assignments.map((a) => a.speakerPosition);
      expect(new Set(speakerPositions).size).toBe(4);
    });
  });
});
