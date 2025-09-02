#!/bin/bash

echo "=== Restructuring TI4 Architecture ==="
echo "Moving game logic from client to server..."

# Move game directories from client to server
echo "1. Moving core game engine to server..."
mv client/src/game/engine server/src/game/
mv client/src/game/phases server/src/game/
mv client/src/game/actions server/src/game/
mv client/src/game/validation server/src/game/
mv client/src/game/combat server/src/game/
mv client/src/game/movement server/src/game/
mv client/src/game/exploration server/src/game/
mv client/src/game/leaders server/src/game/
mv client/src/game/mechs server/src/game/
mv client/src/game/factions server/src/game/
mv client/src/game/objectives server/src/game/
mv client/src/game/politics server/src/game/
mv client/src/game/trade server/src/game/
mv client/src/game/relics server/src/game/
mv client/src/game/boardgame-io server/src/game/

# Move map generation to server (from components)
echo "2. Moving map generation to server..."
mkdir -p server/src/game/map
mv client/src/components/map/* server/src/game/map/ 2>/dev/null || echo "Map components will need manual migration"

# Create new client game-client directory
echo "3. Creating client game interface..."
mkdir -p client/src/game-client
touch client/src/game-client/.gitkeep

# Create visualizers directory for client
echo "4. Creating client visualizers..."
mkdir -p client/src/visualizers
touch client/src/visualizers/.gitkeep

# Create server game subdirectories
echo "5. Creating additional server game directories..."
mkdir -p server/src/game/state
mkdir -p server/src/game/rules
mkdir -p server/src/game/systems
touch server/src/game/state/.gitkeep
touch server/src/game/rules/.gitkeep
touch server/src/game/systems/.gitkeep

# Clean up empty client/src/game directory if it exists
if [ -d "client/src/game" ] && [ -z "$(ls -A client/src/game)" ]; then
    rmdir client/src/game
    echo "6. Removed empty client/src/game directory"
fi

# Create placeholder files for new architecture
echo "7. Creating placeholder files..."

cat > client/src/game-client/BoardgameIOClient.ts << 'EOF'
// Client connection to Boardgame.io server
import { Client } from 'boardgame.io/client';

export class BoardgameIOClient {
  // TODO: Implement client connection to server
}
EOF

cat > client/src/game-client/GameStateSync.ts << 'EOF'
// Synchronizes game state from server
export class GameStateSync {
  // TODO: Implement state synchronization
}
EOF

cat > server/src/game/TI4Game.ts << 'EOF'
// Main Boardgame.io game definition
import { Game } from 'boardgame.io';

export const TI4Game: Game = {
  name: 'twilight-imperium-4',
  
  setup: () => {
    // TODO: Initialize game state
    return {};
  },
  
  moves: {
    // TODO: Define all game moves
  },
  
  phases: {
    // TODO: Define game phases
  }
};
EOF

echo "8. Updating .gitkeep files..."
find server/src/game -type d -empty -exec touch {}/.gitkeep \;
find client/src -type d -empty -exec touch {}/.gitkeep \;

echo ""
echo "=== Restructuring Complete ==="
echo ""
echo "Summary of changes:"
echo "- Moved all game logic from client/src/game/ to server/src/game/"
echo "- Created client/src/game-client/ for client-server connection"
echo "- Created client/src/visualizers/ for visual effects only"
echo "- Added server/src/game/state/, rules/, and systems/ directories"
echo ""
echo "Next steps:"
echo "1. Update all imports in moved files"
echo "2. Implement BoardgameIOClient.ts"
echo "3. Configure Boardgame.io server"
echo "4. Update components to use server state"
echo ""
echo "IMPORTANT: Review ARCHITECTURE_RESTRUCTURE.md for complete migration guide"