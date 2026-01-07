'use client';

import { useState } from 'react';
import { useLobbyStore } from '@/stores/lobby-store';
import ThemedPanel from '@/components/ui/ThemedPanel';
import { PowerCoreButton, GlassButton } from '@/components/ui/ThemedButton';
import type { LobbySettings } from '@ti4/shared';

interface CreateLobbyModalProps {
  onClose: () => void;
}

const EXPANSIONS = [
  { id: 'pok', name: 'Prophecy of Kings' },
  { id: 'codex1', name: 'Codex Volume I' },
  { id: 'codex2', name: 'Codex Volume II' },
  { id: 'codex3', name: 'Codex Volume III' },
  { id: 'thunders_edge', name: "Thunder's Edge" },
];

export default function CreateLobbyModal({ onClose }: CreateLobbyModalProps) {
  const { createLobby, isLoading, error } = useLobbyStore();

  const [settings, setSettings] = useState<LobbySettings>({
    playerCount: 6,
    victoryPoints: 10,
    expansions: ['base', 'pok'],
    miltyDraft: false,
    privateGame: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLobby(settings);
    } catch (err) {
      console.error('Failed to create lobby:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <ThemedPanel glow className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
          Create New Lobby
        </h2>

        {error && (
          <ThemedPanel variant="error" className="mb-4 p-3">
            <span className="text-rose-300 text-sm">{error}</span>
          </ThemedPanel>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Count */}
          <div>
            <label className="block text-sm font-medium mb-2 text-cyan-300">
              Number of Players
            </label>
            <div className="flex gap-2">
              {[3, 4, 5, 6, 7, 8].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, playerCount: count }))}
                  className={`flex-1 py-2 rounded-lg border transition-all ${
                    settings.playerCount === count
                      ? 'bg-cyan-600/40 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                      : 'bg-cyan-950/30 border-cyan-400/20 text-slate-400 hover:border-cyan-400/40'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Victory Points */}
          <div>
            <label className="block text-sm font-medium mb-2 text-cyan-300">
              Victory Points
            </label>
            <div className="flex gap-2">
              {([10, 12, 14] as const).map((vp) => (
                <button
                  key={vp}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, victoryPoints: vp }))}
                  className={`flex-1 py-2 rounded-lg border transition-all ${
                    settings.victoryPoints === vp
                      ? 'bg-cyan-600/40 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                      : 'bg-cyan-950/30 border-cyan-400/20 text-slate-400 hover:border-cyan-400/40'
                  }`}
                >
                  {vp} VP
                </button>
              ))}
            </div>
          </div>

          {/* Expansions */}
          <div>
            <label className="block text-sm font-medium mb-2 text-cyan-300">
              Expansions
            </label>
            <div className="space-y-2">
              {EXPANSIONS.map((exp) => (
                <label
                  key={exp.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                    settings.expansions.includes(exp.id)
                      ? 'bg-cyan-600/20 border-cyan-400/40'
                      : 'bg-cyan-950/20 border-cyan-400/10 hover:border-cyan-400/30'
                  }`}
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
                    className="w-4 h-4 rounded border-cyan-400/40 bg-cyan-950/50 text-cyan-500 focus:ring-cyan-400/50"
                  />
                  <span className="text-slate-300">{exp.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Milty Draft */}
          <label
            className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border ${
              settings.miltyDraft
                ? 'bg-amber-600/20 border-amber-400/40'
                : 'bg-cyan-950/20 border-cyan-400/10 hover:border-cyan-400/30'
            }`}
          >
            <input
              type="checkbox"
              checked={settings.miltyDraft}
              onChange={(e) =>
                setSettings((s) => ({ ...s, miltyDraft: e.target.checked }))
              }
              className="w-4 h-4 rounded border-cyan-400/40 bg-cyan-950/50 text-amber-500 focus:ring-amber-400/50"
            />
            <div>
              <div className="font-medium text-white">Milty Draft</div>
              <div className="text-sm text-slate-400">
                Draft factions and map positions
              </div>
            </div>
          </label>

          {/* Private Game */}
          <label
            className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border ${
              settings.privateGame
                ? 'bg-purple-600/20 border-purple-400/40'
                : 'bg-cyan-950/20 border-cyan-400/10 hover:border-cyan-400/30'
            }`}
          >
            <input
              type="checkbox"
              checked={settings.privateGame}
              onChange={(e) =>
                setSettings((s) => ({ ...s, privateGame: e.target.checked }))
              }
              className="w-4 h-4 rounded border-cyan-400/40 bg-cyan-950/50 text-purple-500 focus:ring-purple-400/50"
            />
            <div>
              <div className="font-medium text-white">Private Game</div>
              <div className="text-sm text-slate-400">
                Only accessible via code
              </div>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <GlassButton
              onClick={onClose}
              color="cyan"
              fullWidth
            >
              Cancel
            </GlassButton>
            <PowerCoreButton
              type="submit"
              disabled={isLoading}
              color="emerald"
              fullWidth
            >
              {isLoading ? 'Creating...' : 'Create Lobby'}
            </PowerCoreButton>
          </div>
        </form>
      </ThemedPanel>
    </div>
  );
}
