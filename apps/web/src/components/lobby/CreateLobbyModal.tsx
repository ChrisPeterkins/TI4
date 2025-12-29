'use client';

import { useState } from 'react';
import { useLobbyStore } from '@/stores/lobby-store';
import type { LobbySettings } from '@ti4/shared';

interface CreateLobbyModalProps {
  onClose: () => void;
}

const EXPANSIONS = [
  { id: 'pok', name: 'Prophecy of Kings' },
  { id: 'codex1', name: 'Codex Volume I' },
  { id: 'codex2', name: 'Codex Volume II' },
  { id: 'codex3', name: 'Codex Volume III' },
];

export default function CreateLobbyModal({ onClose }: CreateLobbyModalProps) {
  const { createLobby, isLoading, error } = useLobbyStore();

  const [settings, setSettings] = useState<LobbySettings>({
    playerCount: 6,
    victoryPoints: 10,
    expansions: ['base', 'pok'], // 'base' is always required
    miltyDraft: false,
    privateGame: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLobby(settings);
      // Router redirect will happen via the lobby page effect
    } catch (err) {
      console.error('Failed to create lobby:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Create New Lobby</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Count */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Players
            </label>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, playerCount: count }))}
                  className={`flex-1 py-2 rounded-lg border ${
                    settings.playerCount === count
                      ? 'bg-blue-600 border-blue-500'
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Victory Points */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Victory Points
            </label>
            <div className="flex gap-2">
              {([10, 12, 14] as const).map((vp) => (
                <button
                  key={vp}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, victoryPoints: vp }))}
                  className={`flex-1 py-2 rounded-lg border ${
                    settings.victoryPoints === vp
                      ? 'bg-blue-600 border-blue-500'
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {vp} VP
                </button>
              ))}
            </div>
          </div>

          {/* Expansions */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Expansions
            </label>
            <div className="space-y-2">
              {EXPANSIONS.map((exp) => (
                <label
                  key={exp.id}
                  className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
                >
                  <input
                    type="checkbox"
                    checked={settings.expansions.includes(exp.id)}
                    onChange={(e) => {
                      setSettings((s) => ({
                        ...s,
                        expansions: e.target.checked
                          ? [...s.expansions, exp.id]
                          : s.expansions.filter((id) => id !== exp.id),
                      }));
                    }}
                    className="w-4 h-4 rounded border-gray-600"
                  />
                  <span>{exp.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Milty Draft */}
          <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
            <input
              type="checkbox"
              checked={settings.miltyDraft}
              onChange={(e) =>
                setSettings((s) => ({ ...s, miltyDraft: e.target.checked }))
              }
              className="w-4 h-4 rounded border-gray-600"
            />
            <div>
              <div className="font-medium">Milty Draft</div>
              <div className="text-sm text-gray-400">
                Draft factions and map positions
              </div>
            </div>
          </label>

          {/* Private Game */}
          <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
            <input
              type="checkbox"
              checked={settings.privateGame}
              onChange={(e) =>
                setSettings((s) => ({ ...s, privateGame: e.target.checked }))
              }
              className="w-4 h-4 rounded border-gray-600"
            />
            <div>
              <div className="font-medium">Private Game</div>
              <div className="text-sm text-gray-400">
                Only accessible via code
              </div>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Lobby'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
