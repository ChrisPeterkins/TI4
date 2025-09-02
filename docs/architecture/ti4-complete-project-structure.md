# TI4 Web App - Complete Project Directory Structure v2.0

```
ti4-web-app/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Continuous integration
│   │   ├── deploy-staging.yml        # Staging deployment
│   │   ├── deploy-production.yml     # Production deployment
│   │   └── dependency-update.yml     # Automated dependency updates
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── balance_issue.md          # Game balance reports
│   └── PULL_REQUEST_TEMPLATE.md
│
├── client/                            # Frontend Application (React + TypeScript + Three.js)
│   ├── public/
│   │   ├── assets/                   # [EXTRACTED from AsyncTI4/ti4_web_new]
│   │   │   ├── factions/             # 25+ faction assets
│   │   │   │   ├── base/             # Base game factions
│   │   │   │   │   ├── arborec/
│   │   │   │   │   ├── barony/
│   │   │   │   │   ├── saar/
│   │   │   │   │   └── ... (17 factions)
│   │   │   │   └── pok/              # PoK factions
│   │   │   │       ├── argent/
│   │   │   │       ├── empyrean/
│   │   │   │       ├── mahact/
│   │   │   │       └── ... (7 factions)
│   │   │   ├── cards/
│   │   │   │   ├── action/
│   │   │   │   ├── agenda/
│   │   │   │   ├── exploration/      # [NEW] PoK exploration cards
│   │   │   │   │   ├── cultural/
│   │   │   │   │   ├── hazardous/
│   │   │   │   │   └── industrial/
│   │   │   │   ├── objective/
│   │   │   │   ├── promissory/
│   │   │   │   ├── relic/
│   │   │   │   ├── secret/
│   │   │   │   └── strategy/
│   │   │   ├── leaders/               # [NEW] PoK leaders
│   │   │   │   ├── agents/
│   │   │   │   ├── commanders/
│   │   │   │   └── heroes/
│   │   │   ├── tokens/
│   │   │   │   ├── command/
│   │   │   │   ├── control/
│   │   │   │   ├── frontier/         # [NEW] PoK exploration tokens
│   │   │   │   ├── trade_goods/
│   │   │   │   └── commodities/
│   │   │   ├── units/
│   │   │   │   ├── ships/
│   │   │   │   ├── ground/
│   │   │   │   ├── structures/
│   │   │   │   └── mechs/            # [NEW] PoK mechs
│   │   │   ├── planets/
│   │   │   ├── systems/
│   │   │   ├── tiles/
│   │   │   └── icons/
│   │   ├── models/                   # 3D models for Three.js
│   │   │   ├── ships/
│   │   │   │   ├── carrier.glb
│   │   │   │   ├── cruiser.glb
│   │   │   │   ├── destroyer.glb
│   │   │   │   ├── dreadnought.glb
│   │   │   │   ├── fighter.glb
│   │   │   │   ├── flagship/         # Faction-specific flagships
│   │   │   │   └── warsun.glb
│   │   │   ├── structures/
│   │   │   │   ├── pds.glb
│   │   │   │   ├── space_dock.glb
│   │   │   │   └── mecatol_structures.glb
│   │   │   ├── ground/
│   │   │   │   ├── infantry.glb
│   │   │   │   └── mech/             # [NEW] Faction-specific mechs
│   │   │   ├── board/
│   │   │   │   ├── hex_tile.glb
│   │   │   │   ├── planet_tile.glb
│   │   │   │   ├── anomaly/          # [NEW]
│   │   │   │   └── mecatol_rex.glb
│   │   │   └── effects/              # [NEW]
│   │   │       ├── explosions/
│   │   │       └── wormholes/
│   │   ├── fonts/
│   │   ├── sounds/
│   │   │   ├── effects/
│   │   │   ├── music/
│   │   │   ├── voice/                # [NEW] Voice lines
│   │   │   └── ambient/              # [NEW] Ambient sounds
│   │   ├── locales/                  # [NEW] Internationalization
│   │   │   ├── en-US.json
│   │   │   ├── es-ES.json
│   │   │   ├── fr-FR.json
│   │   │   ├── de-DE.json
│   │   │   └── zh-CN.json
│   │   ├── manifest.json             # [NEW] PWA manifest
│   │   ├── service-worker.js         # [NEW] PWA service worker
│   │   ├── offline.html              # [NEW] Offline page
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── game/                     # Core Game Engine [40% NEW]
│   │   │   ├── engine/
│   │   │   │   ├── GameEngine.ts
│   │   │   │   ├── PhaseManager.ts
│   │   │   │   ├── TurnManager.ts
│   │   │   │   ├── StateManager.ts
│   │   │   │   ├── TimingWindows.ts  # [NEW]
│   │   │   │   └── SimultaneousActions.ts # [NEW]
│   │   │   ├── phases/
│   │   │   │   ├── StrategyPhase.ts
│   │   │   │   ├── ActionPhase.ts
│   │   │   │   ├── StatusPhase.ts
│   │   │   │   └── AgendaPhase.ts
│   │   │   ├── actions/
│   │   │   │   ├── TacticalAction.ts
│   │   │   │   ├── StrategicAction.ts
│   │   │   │   ├── ComponentAction.ts
│   │   │   │   ├── PassAction.ts
│   │   │   │   └── ReactionWindow.ts # [NEW]
│   │   │   ├── validation/
│   │   │   │   ├── ActionValidator.ts
│   │   │   │   ├── MovementValidator.ts
│   │   │   │   ├── BuildValidator.ts
│   │   │   │   ├── CombatValidator.ts
│   │   │   │   ├── TechValidator.ts
│   │   │   │   ├── TradeValidator.ts # [NEW]
│   │   │   │   └── TimingValidator.ts # [NEW]
│   │   │   ├── combat/                # [EXTRACTED from ti4calc + NEW]
│   │   │   │   ├── CombatEngine.ts
│   │   │   │   ├── SpaceCombat.ts
│   │   │   │   ├── GroundCombat.ts
│   │   │   │   ├── SpaceCannon.ts    # [NEW]
│   │   │   │   │   ├── OffenseResolver.ts
│   │   │   │   │   └── DefenseResolver.ts
│   │   │   │   ├── Bombardment.ts    # [NEW]
│   │   │   │   ├── AFBarrage.ts      # [NEW]
│   │   │   │   ├── Retreat.ts        # [NEW]
│   │   │   │   ├── SustainDamage.ts  # [NEW]
│   │   │   │   ├── DiceRoller.ts
│   │   │   │   ├── CombatModifiers.ts
│   │   │   │   ├── CombatAbilities.ts # [NEW]
│   │   │   │   └── ProbabilityCalculator.ts
│   │   │   ├── movement/              # [NEW]
│   │   │   │   ├── WormholeNetwork.ts
│   │   │   │   ├── AnomalyEffects.ts
│   │   │   │   ├── MovementCalculator.ts
│   │   │   │   ├── FleetSupply.ts
│   │   │   │   ├── Capacity.ts
│   │   │   │   └── Pathfinding.ts    # [EXTRACTED from von-grid]
│   │   │   ├── exploration/           # [NEW] PoK Feature
│   │   │   │   ├── ExplorationManager.ts
│   │   │   │   ├── RelicFragments.ts
│   │   │   │   ├── ExplorationDecks.ts
│   │   │   │   ├── Attachments.ts
│   │   │   │   └── FrontierTokens.ts
│   │   │   ├── leaders/               # [NEW] PoK Feature
│   │   │   │   ├── LeaderManager.ts
│   │   │   │   ├── Agents.ts
│   │   │   │   ├── Commanders.ts
│   │   │   │   ├── Heroes.ts
│   │   │   │   ├── Alliance.ts
│   │   │   │   └── LeaderAbilities.ts
│   │   │   ├── mechs/                 # [NEW] PoK Feature
│   │   │   │   ├── MechManager.ts
│   │   │   │   ├── MechAbilities.ts
│   │   │   │   ├── MechDeployment.ts
│   │   │   │   └── FactionMechs.ts
│   │   │   ├── factions/
│   │   │   │   ├── FactionManager.ts
│   │   │   │   ├── abilities/        # Faction-specific abilities
│   │   │   │   │   ├── base/         # Base game factions
│   │   │   │   │   └── pok/          # PoK factions
│   │   │   │   ├── starting/         # Starting setups
│   │   │   │   └── technologies/     # Faction technologies
│   │   │   ├── objectives/
│   │   │   │   ├── ObjectiveManager.ts
│   │   │   │   ├── PublicObjectives.ts
│   │   │   │   ├── SecretObjectives.ts
│   │   │   │   ├── Scoring.ts
│   │   │   │   └── Revealed.ts       # [NEW] Revealed objectives
│   │   │   ├── politics/
│   │   │   │   ├── VotingSystem.ts
│   │   │   │   ├── AgendaResolver.ts
│   │   │   │   ├── LawManager.ts
│   │   │   │   ├── Riders.ts         # [NEW]
│   │   │   │   └── SpeakerSelection.ts
│   │   │   ├── trade/
│   │   │   │   ├── TradeSystem.ts
│   │   │   │   ├── Commodities.ts
│   │   │   │   ├── TransactionBuilder.ts
│   │   │   │   ├── PromissoryNotes.ts
│   │   │   │   └── TradeAgreements.ts # [NEW]
│   │   │   ├── relics/                # [NEW]
│   │   │   │   ├── RelicManager.ts
│   │   │   │   ├── RelicEffects.ts
│   │   │   │   └── RelicFragments.ts
│   │   │   └── boardgame-io/
│   │   │       ├── TI4Game.ts        # Main game definition
│   │   │       ├── moves.ts
│   │   │       ├── plugins.ts
│   │   │       ├── events.ts
│   │   │       └── flow.ts
│   │   │
│   │   ├── components/                # UI Components [EXTENDED]
│   │   │   ├── board/
│   │   │   │   ├── Board3D.tsx       # [NEW] Three.js board
│   │   │   │   ├── Board2D.tsx       # [EXTRACTED] 2D fallback
│   │   │   │   ├── HexTile3D.tsx     # [NEW]
│   │   │   │   ├── SystemTile.tsx
│   │   │   │   ├── PlanetTile.tsx
│   │   │   │   ├── AnomalyTile.tsx   # [NEW]
│   │   │   │   ├── WormholeTile.tsx  # [NEW]
│   │   │   │   ├── HyperlaneOverlay.tsx # [NEW]
│   │   │   │   └── MecatolRex.tsx
│   │   │   ├── units/
│   │   │   │   ├── Unit3D.tsx        # [NEW]
│   │   │   │   ├── Ship3D.tsx        # [NEW]
│   │   │   │   ├── GroundForce3D.tsx # [NEW]
│   │   │   │   ├── Structure3D.tsx   # [NEW]
│   │   │   │   ├── Mech3D.tsx        # [NEW] PoK
│   │   │   │   ├── Leader3D.tsx      # [NEW] PoK
│   │   │   │   ├── UnitSelector.tsx
│   │   │   │   └── FleetComposition.tsx
│   │   │   ├── lobby/                 # [NEW] Complete lobby system
│   │   │   │   ├── GameLobby.tsx
│   │   │   │   ├── PlayerSlots.tsx
│   │   │   │   ├── GameSettings.tsx
│   │   │   │   │   ├── BasicSettings.tsx
│   │   │   │   │   ├── AdvancedSettings.tsx
│   │   │   │   │   └── HouseRules.tsx
│   │   │   │   ├── MapSelection.tsx
│   │   │   │   ├── DraftMode.tsx
│   │   │   │   │   ├── SnakeDraft.tsx
│   │   │   │   │   ├── MiltyDraft.tsx
│   │   │   │   │   └── RandomDraft.tsx
│   │   │   │   ├── ReadyCheck.tsx
│   │   │   │   └── GameBrowser.tsx   # Public game browser
│   │   │   ├── map/                   # [EXTRACTED from KeeganW/ti4]
│   │   │   │   ├── MapGenerator.tsx
│   │   │   │   ├── MapBalancer.tsx
│   │   │   │   ├── MapPresets.tsx
│   │   │   │   ├── MapStringParser.tsx
│   │   │   │   └── MapEditor.tsx     # [NEW]
│   │   │   ├── player/
│   │   │   │   ├── PlayerDashboard.tsx
│   │   │   │   ├── PlayerArea.tsx
│   │   │   │   ├── ResourceTracker.tsx
│   │   │   │   ├── TechTree.tsx
│   │   │   │   ├── HandManager.tsx
│   │   │   │   ├── LeaderPanel.tsx   # [NEW] PoK
│   │   │   │   ├── ExplorationPanel.tsx # [NEW] PoK
│   │   │   │   ├── RelicPanel.tsx    # [NEW]
│   │   │   │   └── ActionBar.tsx     # [NEW]
│   │   │   ├── ui/
│   │   │   │   ├── ActionMenu.tsx
│   │   │   │   ├── PhaseIndicator.tsx
│   │   │   │   ├── TurnOrder.tsx
│   │   │   │   ├── ObjectiveDisplay.tsx
│   │   │   │   ├── ScoreBoard.tsx
│   │   │   │   ├── NotificationSystem.tsx
│   │   │   │   ├── TimerDisplay.tsx  # [NEW]
│   │   │   │   ├── SaveLoadMenu.tsx  # [NEW]
│   │   │   │   ├── SettingsMenu.tsx  # [NEW]
│   │   │   │   └── HelpButton.tsx    # [NEW]
│   │   │   ├── communication/         # [NEW] Complete chat/voice system
│   │   │   │   ├── ChatSystem.tsx
│   │   │   │   │   ├── PublicChat.tsx
│   │   │   │   │   ├── TeamChat.tsx
│   │   │   │   │   └── WhisperChat.tsx
│   │   │   │   ├── VoiceChat.tsx
│   │   │   │   ├── VideoChat.tsx
│   │   │   │   ├── EmoteWheel.tsx
│   │   │   │   ├── TransactionNegotiator.tsx
│   │   │   │   └── QuickMessages.tsx
│   │   │   ├── cards/
│   │   │   │   ├── CardDisplay.tsx
│   │   │   │   ├── CardHand.tsx
│   │   │   │   ├── CardEffects.tsx
│   │   │   │   ├── ExplorationCard.tsx # [NEW] PoK
│   │   │   │   ├── RelicCard.tsx     # [NEW]
│   │   │   │   └── CardZoom.tsx      # [NEW]
│   │   │   ├── combat/
│   │   │   │   ├── CombatDialog.tsx
│   │   │   │   ├── DiceRollAnimation.tsx
│   │   │   │   ├── CombatLog.tsx
│   │   │   │   ├── RetreatDialog.tsx # [NEW]
│   │   │   │   ├── BombardmentUI.tsx # [NEW]
│   │   │   │   ├── SpaceCannonUI.tsx # [NEW]
│   │   │   │   └── CombatPreview.tsx # [NEW]
│   │   │   ├── trade/
│   │   │   │   ├── TradeInterface.tsx
│   │   │   │   ├── TransactionBuilder.tsx
│   │   │   │   ├── PromissoryNotes.tsx
│   │   │   │   ├── CommodityExchange.tsx
│   │   │   │   └── TradeHistory.tsx  # [NEW]
│   │   │   ├── politics/
│   │   │   │   ├── VotingInterface.tsx
│   │   │   │   ├── AgendaCard.tsx
│   │   │   │   ├── SpeakerToken.tsx
│   │   │   │   ├── RiderDialog.tsx   # [NEW]
│   │   │   │   └── VotingResults.tsx # [NEW]
│   │   │   ├── companion/             # [NEW] Companion app mode
│   │   │   │   ├── CompanionMode.tsx
│   │   │   │   ├── PhysicalGameTracker.tsx
│   │   │   │   ├── MoveAdvisor.tsx
│   │   │   │   ├── SimplifiedUI.tsx
│   │   │   │   ├── QRScanner.tsx
│   │   │   │   ├── PhotoCapture.tsx
│   │   │   │   └── AdviceEngine.tsx
│   │   │   ├── spectator/             # [NEW] Spectator & replay
│   │   │   │   ├── SpectatorMode.tsx
│   │   │   │   ├── ReplayViewer.tsx
│   │   │   │   ├── ReplayControls.tsx
│   │   │   │   ├── GameTimeline.tsx
│   │   │   │   ├── AnalysisPanel.tsx
│   │   │   │   └── ShareReplay.tsx
│   │   │   ├── tutorial/              # [NEW] Tutorial system
│   │   │   │   ├── InteractiveTutorial.tsx
│   │   │   │   ├── TutorialScenarios.tsx
│   │   │   │   ├── HintSystem.tsx
│   │   │   │   ├── RulesReference.tsx
│   │   │   │   ├── VideoGuides.tsx
│   │   │   │   └── PracticeMode.tsx
│   │   │   ├── tournament/            # [NEW] Tournament support
│   │   │   │   ├── TournamentLobby.tsx
│   │   │   │   ├── BracketView.tsx
│   │   │   │   ├── SwissRounds.tsx
│   │   │   │   ├── TournamentTimer.tsx
│   │   │   │   ├── Standings.tsx
│   │   │   │   └── TournamentAdmin.tsx
│   │   │   ├── admin/                 # [NEW] Admin panel
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── UserManagement.tsx
│   │   │   │   ├── GameModeration.tsx
│   │   │   │   ├── Reports.tsx
│   │   │   │   ├── Analytics.tsx
│   │   │   │   └── SystemHealth.tsx
│   │   │   └── shared/
│   │   │       ├── Modal.tsx
│   │   │       ├── Tooltip.tsx
│   │   │       ├── ContextMenu.tsx
│   │   │       ├── LoadingScreen.tsx
│   │   │       ├── ErrorBoundary.tsx # [NEW]
│   │   │       ├── AccessibilityMenu.tsx # [NEW]
│   │   │       └── Notifications.tsx # [NEW]
│   │   │
│   │   ├── three/                     # [NEW] Three.js rendering
│   │   │   ├── scene/
│   │   │   │   ├── SceneManager.ts
│   │   │   │   ├── CameraController.ts
│   │   │   │   ├── LightingSetup.ts
│   │   │   │   ├── PostProcessing.ts
│   │   │   │   ├── LODManager.ts     # Level of detail
│   │   │   │   └── RenderPipeline.ts
│   │   │   ├── geometry/              # [EXTRACTED from von-grid]
│   │   │   │   ├── HexGrid.ts
│   │   │   │   ├── HexMath.ts
│   │   │   │   ├── Pathfinding.ts
│   │   │   │   ├── GridHelpers.ts
│   │   │   │   └── CoordinateSystems.ts
│   │   │   ├── animations/
│   │   │   │   ├── ShipMovement.ts
│   │   │   │   ├── CombatEffects.ts
│   │   │   │   ├── BuildAnimation.ts
│   │   │   │   ├── ExplosionEffects.ts
│   │   │   │   ├── WormholeEffects.ts
│   │   │   │   └── TransitionEffects.ts
│   │   │   ├── materials/
│   │   │   │   ├── FactionMaterials.ts
│   │   │   │   ├── PlanetMaterials.ts
│   │   │   │   ├── EffectMaterials.ts
│   │   │   │   ├── ShaderLibrary.ts
│   │   │   │   └── TextureAtlas.ts
│   │   │   ├── loaders/
│   │   │   │   ├── ModelLoader.ts
│   │   │   │   ├── TextureLoader.ts
│   │   │   │   ├── AssetManager.ts
│   │   │   │   └── LazyLoader.ts
│   │   │   ├── performance/
│   │   │   │   ├── Instancing.ts
│   │   │   │   ├── Culling.ts
│   │   │   │   ├── TextureAtlas.ts
│   │   │   │   └── GeometryBatching.ts
│   │   │   └── effects/
│   │   │       ├── ParticleSystem.ts
│   │   │       ├── ShaderEffects.ts
│   │   │       └── EnvironmentEffects.ts
│   │   │
│   │   ├── data/                      # [CONVERTED from multiple sources]
│   │   │   ├── factions/              # [From TwilightImperiumUltimate]
│   │   │   │   ├── base/
│   │   │   │   ├── pok/
│   │   │   │   ├── abilities.ts
│   │   │   │   ├── starting.ts
│   │   │   │   └── index.ts
│   │   │   ├── cards/                 # [From TwilightImperiumUltimate]
│   │   │   │   ├── action/
│   │   │   │   ├── agenda/
│   │   │   │   ├── exploration/      # PoK
│   │   │   │   ├── objective/
│   │   │   │   ├── promissory/
│   │   │   │   ├── relic/
│   │   │   │   ├── secret/
│   │   │   │   └── strategy/
│   │   │   ├── technologies/          # [From TwilightImperiumUltimate]
│   │   │   │   ├── base/
│   │   │   │   ├── faction/
│   │   │   │   ├── unitUpgrades/
│   │   │   │   └── tree.ts
│   │   │   ├── leaders/               # [NEW] PoK
│   │   │   │   ├── agents/
│   │   │   │   ├── commanders/
│   │   │   │   ├── heroes/
│   │   │   │   └── abilities.ts
│   │   │   ├── tiles/                 # [From TwilightImperiumUltimate]
│   │   │   │   ├── systems/
│   │   │   │   ├── planets/
│   │   │   │   ├── anomalies/
│   │   │   │   ├── wormholes/
│   │   │   │   └── hyperlanes/
│   │   │   ├── units/
│   │   │   │   ├── stats/
│   │   │   │   ├── costs/
│   │   │   │   ├── abilities/
│   │   │   │   └── mechs/            # PoK
│   │   │   └── rules/
│   │   │       ├── constants/
│   │   │       ├── references/
│   │   │       ├── errata/
│   │   │       └── timing/
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── game/
│   │   │   │   ├── useGameState.ts
│   │   │   │   ├── usePlayer.ts
│   │   │   │   ├── useBoardgameIO.ts
│   │   │   │   ├── useGameActions.ts
│   │   │   │   └── useGamePhase.ts
│   │   │   ├── ui/
│   │   │   │   ├── useThree.ts
│   │   │   │   ├── useAnimation.ts
│   │   │   │   ├── useSound.ts
│   │   │   │   ├── useKeyboard.ts
│   │   │   │   └── useTouch.ts       # Mobile support
│   │   │   ├── features/
│   │   │   │   ├── useCompanionMode.ts
│   │   │   │   ├── useChat.ts
│   │   │   │   ├── useVoice.ts
│   │   │   │   ├── useTournament.ts
│   │   │   │   └── useSpectator.ts
│   │   │   └── utils/
│   │   │       ├── useLocalStorage.ts
│   │   │       ├── useWebSocket.ts
│   │   │       ├── useMediaQuery.ts
│   │   │       └── useNetwork.ts     # Network status
│   │   │
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   ├── GameAPI.ts
│   │   │   │   ├── AuthAPI.ts
│   │   │   │   ├── StatsAPI.ts
│   │   │   │   ├── TournamentAPI.ts
│   │   │   │   ├── SaveAPI.ts
│   │   │   │   ├── ReplayAPI.ts      # [NEW]
│   │   │   │   └── SocialAPI.ts      # [NEW]
│   │   │   ├── websocket/
│   │   │   │   ├── SocketManager.ts
│   │   │   │   ├── ReconnectionHandler.ts
│   │   │   │   ├── HeartbeatManager.ts
│   │   │   │   └── MessageQueue.ts   # [NEW]
│   │   │   ├── webrtc/                # [NEW]
│   │   │   │   ├── PeerConnection.ts
│   │   │   │   ├── MediaManager.ts
│   │   │   │   ├── SignalingClient.ts
│   │   │   │   └── StreamManager.ts
│   │   │   ├── storage/
│   │   │   │   ├── LocalStorage.ts
│   │   │   │   ├── IndexedDB.ts
│   │   │   │   ├── CloudSave.ts
│   │   │   │   ├── CacheManager.ts
│   │   │   │   └── OfflineStorage.ts # [NEW]
│   │   │   ├── audio/
│   │   │   │   ├── AudioManager.ts
│   │   │   │   ├── SoundEffects.ts
│   │   │   │   ├── MusicPlayer.ts
│   │   │   │   └── VoiceLines.ts    # [NEW]
│   │   │   ├── notifications/         # [NEW]
│   │   │   │   ├── PushNotifications.ts
│   │   │   │   ├── InAppNotifications.ts
│   │   │   │   ├── EmailNotifications.ts
│   │   │   │   └── DesktopNotifications.ts
│   │   │   └── analytics/             # [NEW]
│   │   │       ├── GameAnalytics.ts
│   │   │       ├── UserTracking.ts
│   │   │       ├── PerformanceMonitor.ts
│   │   │       └── ErrorTracking.ts
│   │   │
│   │   ├── store/                     # State management (Zustand)
│   │   │   ├── slices/
│   │   │   │   ├── gameSlice.ts
│   │   │   │   ├── playerSlice.ts
│   │   │   │   ├── boardSlice.ts
│   │   │   │   ├── uiSlice.ts
│   │   │   │   ├── settingsSlice.ts
│   │   │   │   ├── chatSlice.ts      # [NEW]
│   │   │   │   ├── tournamentSlice.ts # [NEW]
│   │   │   │   ├── companionSlice.ts # [NEW]
│   │   │   │   └── socialSlice.ts    # [NEW]
│   │   │   ├── middleware/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── sync.ts
│   │   │   │   └── devtools.ts       # [NEW]
│   │   │   ├── store.ts
│   │   │   └── persistConfig.ts
│   │   │
│   │   ├── types/                     # TypeScript definitions
│   │   │   ├── game/
│   │   │   │   ├── game.d.ts
│   │   │   │   ├── board.d.ts
│   │   │   │   ├── units.d.ts
│   │   │   │   ├── cards.d.ts
│   │   │   │   ├── factions.d.ts
│   │   │   │   ├── exploration.d.ts  # PoK
│   │   │   │   ├── leaders.d.ts      # PoK
│   │   │   │   └── mechs.d.ts        # PoK
│   │   │   ├── api/
│   │   │   │   ├── requests.d.ts
│   │   │   │   ├── responses.d.ts
│   │   │   │   └── websocket.d.ts
│   │   │   ├── three.d.ts
│   │   │   ├── vendor.d.ts           # [NEW]
│   │   │   └── global.d.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── gameLogic/
│   │   │   │   ├── ActionResolver.ts
│   │   │   │   ├── PhaseHelpers.ts
│   │   │   │   ├── RuleHelpers.ts
│   │   │   │   └── TimingHelpers.ts
│   │   │   ├── math/
│   │   │   │   ├── HexMath.ts
│   │   │   │   ├── Vector3Math.ts
│   │   │   │   ├── RandomGenerators.ts
│   │   │   │   └── Probability.ts
│   │   │   ├── validation/
│   │   │   │   ├── InputValidation.ts
│   │   │   │   ├── DataValidation.ts
│   │   │   │   └── RuleValidation.ts
│   │   │   ├── helpers/
│   │   │   │   ├── ArrayHelpers.ts
│   │   │   │   ├── ObjectHelpers.ts
│   │   │   │   ├── StringHelpers.ts
│   │   │   │   └── DateHelpers.ts
│   │   │   ├── accessibility/         # [NEW]
│   │   │   │   ├── ColorBlind.ts
│   │   │   │   ├── ScreenReader.ts
│   │   │   │   ├── KeyboardNav.ts
│   │   │   │   └── FontScaling.ts
│   │   │   ├── localization/          # [NEW]
│   │   │   │   ├── i18n.ts
│   │   │   │   ├── translator.ts
│   │   │   │   └── dateFormatter.ts
│   │   │   └── performance/           # [NEW]
│   │   │       ├── debounce.ts
│   │   │       ├── throttle.ts
│   │   │       └── memoize.ts
│   │   │
│   │   ├── workers/                   # [NEW] Web Workers
│   │   │   ├── gameWorker.ts         # Game calculations
│   │   │   ├── pathfindingWorker.ts  # Pathfinding
│   │   │   ├── aiWorker.ts           # AI calculations
│   │   │   └── renderWorker.ts       # Offscreen rendering
│   │   │
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── themes/
│   │   │   │   ├── default.css
│   │   │   │   ├── dark.css
│   │   │   │   └── faction/          # Faction themes
│   │   │   ├── components/
│   │   │   ├── accessibility/        # [NEW]
│   │   │   │   ├── colorblind.css
│   │   │   │   └── highcontrast.css
│   │   │   └── animations.css
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── vite-env.d.ts
│   │   └── service-worker.ts         # [NEW] PWA service worker
│   │
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── engine/
│   │   │   ├── validation/
│   │   │   ├── combat/
│   │   │   └── components/
│   │   ├── integration/
│   │   │   ├── phases/
│   │   │   ├── actions/
│   │   │   └── multiplayer/
│   │   ├── e2e/
│   │   │   ├── gameplay/
│   │   │   ├── lobby/
│   │   │   └── tournament/
│   │   ├── visual/                   # [NEW] Visual regression
│   │   │   ├── percy.config.js
│   │   │   └── snapshots/
│   │   ├── performance/              # [NEW] Performance tests
│   │   │   ├── lighthouse.config.js
│   │   │   └── load-tests/
│   │   └── accessibility/            # [NEW] A11y tests
│   │       └── axe.config.js
│   │
│   ├── .storybook/                   # [NEW] Component documentation
│   │   ├── main.js
│   │   ├── preview.js
│   │   └── stories/
│   │
│   ├── cypress/                      # [NEW] E2E testing
│   │   ├── e2e/
│   │   ├── fixtures/
│   │   └── support/
│   │
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── vitest.config.ts              # [NEW]
│
├── server/                            # Backend Application
│   ├── src/
│   │   ├── game/                     # Boardgame.io server
│   │   │   ├── TI4Game.ts           # Game definition
│   │   │   ├── GameServer.ts        # Server setup
│   │   │   ├── StorageAdapter.ts    # Custom storage
│   │   │   ├── GameValidator.ts     # [NEW] Validation
│   │   │   └── GameEvents.ts        # [NEW] Event handling
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── games.ts
│   │   │   │   ├── stats.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── companion.ts
│   │   │   │   ├── tournament.ts     # [NEW]
│   │   │   │   ├── saves.ts          # [NEW]
│   │   │   │   ├── replays.ts        # [NEW]
│   │   │   │   ├── social.ts         # [NEW]
│   │   │   │   └── admin.ts          # [NEW]
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── cors.ts
│   │   │   │   ├── rateLimit.ts
│   │   │   │   ├── validation.ts     # [NEW]
│   │   │   │   ├── errorHandler.ts   # [NEW]
│   │   │   │   └── logging.ts        # [NEW]
│   │   │   └── controllers/
│   │   │       ├── GameController.ts
│   │   │       ├── UserController.ts
│   │   │       ├── StatsController.ts
│   │   │       ├── TournamentController.ts # [NEW]
│   │   │       └── AdminController.ts # [NEW]
│   │   ├── lobby/                     # [NEW] Lobby management
│   │   │   ├── LobbyManager.ts
│   │   │   ├── GameCreation.ts
│   │   │   ├── DraftSystem.ts
│   │   │   ├── MatchMaking.ts
│   │   │   └── ReadyCheck.ts
│   │   ├── tournament/                # [NEW] Tournament system
│   │   │   ├── TournamentManager.ts
│   │   │   ├── SwissSystem.ts
│   │   │   ├── BracketSystem.ts
│   │   │   ├── Scheduler.ts
│   │   │   └── Pairings.ts
│   │   ├── webrtc/                    # [NEW] Voice/video
│   │   │   ├── SignalingServer.ts
│   │   │   ├── MediasoupServer.ts
│   │   │   ├── RoomManager.ts
│   │   │   └── StreamRouter.ts
│   │   ├── chat/                      # [NEW] Chat system
│   │   │   ├── ChatServer.ts
│   │   │   ├── MessageHistory.ts
│   │   │   ├── Moderation.ts
│   │   │   └── Commands.ts
│   │   ├── db/
│   │   │   ├── schema.prisma         # Complete schema
│   │   │   ├── migrations/
│   │   │   ├── seed.ts
│   │   │   ├── client.ts
│   │   │   └── repositories/         # [NEW]
│   │   │       ├── UserRepository.ts
│   │   │       ├── GameRepository.ts
│   │   │       └── StatsRepository.ts
│   │   ├── services/
│   │   │   ├── GameService.ts
│   │   │   ├── MatchmakingService.ts
│   │   │   ├── ReplayService.ts
│   │   │   ├── NotificationService.ts
│   │   │   ├── SaveService.ts        # [NEW]
│   │   │   ├── AnalyticsService.ts   # [NEW]
│   │   │   ├── EmailService.ts       # [NEW]
│   │   │   ├── StorageService.ts     # [NEW] S3
│   │   │   └── CacheService.ts       # [NEW] Redis
│   │   ├── admin/                     # [NEW] Admin tools
│   │   │   ├── AdminPanel.ts
│   │   │   ├── UserManagement.ts
│   │   │   ├── GameModeration.ts
│   │   │   ├── ReportHandler.ts
│   │   │   └── SystemMonitor.ts
│   │   ├── ai/                        # [NEW] AI system (future)
│   │   │   ├── AIPlayer.ts
│   │   │   ├── DecisionEngine.ts
│   │   │   ├── Personalities.ts
│   │   │   └── Difficulty.ts
│   │   ├── jobs/                      # [NEW] Background jobs
│   │   │   ├── QueueManager.ts
│   │   │   ├── workers/
│   │   │   │   ├── EmailWorker.ts
│   │   │   │   ├── AnalyticsWorker.ts
│   │   │   │   └── CleanupWorker.ts
│   │   │   └── schedulers/
│   │   │       ├── DailyScheduler.ts
│   │   │       └── TournamentScheduler.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── validator.ts
│   │   │   ├── crypto.ts
│   │   │   ├── monitoring.ts         # [NEW]
│   │   │   ├── rateLimiter.ts        # [NEW]
│   │   │   └── errorReporter.ts      # [NEW]
│   │   └── index.ts
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── load/                     # [NEW] Load testing
│   │
│   ├── .env.example
│   ├── .env.development
│   ├── .env.staging                  # [NEW]
│   ├── .env.production               # [NEW]
│   ├── .eslintrc.json
│   ├── jest.config.js
│   ├── nodemon.json
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                            # Shared code between client/server
│   ├── types/
│   │   ├── Game.ts
│   │   ├── Player.ts
│   │   ├── Board.ts
│   │   ├── Actions.ts
│   │   ├── Messages.ts
│   │   ├── Tournament.ts             # [NEW]
│   │   └── Social.ts                 # [NEW]
│   ├── constants/
│   │   ├── GameConstants.ts
│   │   ├── PhaseConstants.ts
│   │   ├── ErrorCodes.ts
│   │   └── TimingWindows.ts          # [NEW]
│   ├── utils/
│   │   ├── GameStateValidator.ts
│   │   ├── ActionSerializer.ts
│   │   └── RuleEngine.ts             # [NEW]
│   └── package.json
│
├── scripts/                           # Automation scripts
│   ├── extraction/
│   │   ├── extract-all.js            # Master extraction script
│   │   ├── extract-ultimate-data.js  # TwilightImperiumUltimate
│   │   ├── extract-asyncti4-data.js  # AsyncTI4 repos
│   │   ├── convert-java-to-ts.js     # Java to TypeScript
│   │   ├── port-combat-engine.js     # ti4calc port
│   │   ├── extract-map-generator.js  # KeeganW/ti4
│   │   ├── install-von-grid.js       # von-grid integration
│   │   ├── merge-data-sources.js     # Data merger
│   │   └── validate-data.js          # Data validation
│   ├── generation/
│   │   ├── generate-types.js         # TypeScript types
│   │   ├── generate-cards.js         # Card components
│   │   ├── generate-tests.js         # Test generation
│   │   ├── generate-docs.js          # Documentation
│   │   └── generate-api.js           # API client
│   ├── deployment/
│   │   ├── deploy-staging.sh
│   │   ├── deploy-production.sh
│   │   ├── rollback.sh
│   │   ├── health-check.sh
│   │   └── backup.sh                 # [NEW]
│   ├── setup/
│   │   ├── setup-dev.sh              # Complete dev setup
│   │   ├── setup-database.sh         # Database init
│   │   ├── download-assets.sh        # Asset download
│   │   ├── install-deps.sh           # Dependencies
│   │   └── setup-docker.sh           # [NEW] Docker setup
│   └── maintenance/                   # [NEW]
│       ├── backup-db.sh
│       ├── clean-storage.sh
│       ├── update-deps.sh
│       └── migrate-data.sh
│
├── docs/                              # Documentation
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── game-engine.md
│   │   ├── multiplayer.md
│   │   ├── companion-mode.md
│   │   └── data-flow.md              # [NEW]
│   ├── api/
│   │   ├── rest-api.md
│   │   ├── websocket-api.md
│   │   └── graphql-schema.md         # [NEW] Future
│   ├── game-rules/
│   │   ├── phases.md
│   │   ├── actions.md
│   │   ├── combat.md
│   │   ├── factions.md
│   │   ├── pok-content.md            # [NEW]
│   │   └── timing-windows.md         # [NEW]
│   ├── development/
│   │   ├── setup.md
│   │   ├── testing.md
│   │   ├── deployment.md
│   │   ├── contributing.md           # [NEW]
│   │   └── code-style.md             # [NEW]
│   ├── extraction/
│   │   ├── data-sources.md
│   │   ├── extraction-guide.md
│   │   └── repository-map.md         # [NEW]
│   ├── deployment/                   # [NEW]
│   │   ├── infrastructure.md
│   │   ├── scaling.md
│   │   └── monitoring.md
│   └── user-guide/                   # [NEW]
│       ├── getting-started.md
│       ├── tutorial.md
│       └── faq.md
│
├── docker/
│   ├── client/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── server/
│   │   ├── Dockerfile
│   │   └── entrypoint.sh
│   ├── nginx/                        # [NEW]
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── redis/                        # [NEW]
│   │   └── redis.conf
│   ├── postgres/                     # [NEW]
│   │   └── init.sql
│   └── docker-compose.yml
│
├── nginx/
│   ├── nginx.conf
│   ├── ssl/
│   │   ├── cert.pem
│   │   └── key.pem
│   ├── sites/                        # [NEW]
│   │   ├── api.conf
│   │   └── app.conf
│   └── security/                     # [NEW]
│       └── headers.conf
│
├── monitoring/                        # [NEW] Monitoring & analytics
│   ├── sentry.config.ts
│   ├── datadog.config.ts
│   ├── plausible.config.ts
│   ├── grafana/
│   │   └── dashboards/
│   └── prometheus/
│       └── config.yml
│
├── .vscode/                           # [NEW] VSCode configuration
│   ├── settings.json
│   ├── launch.json
│   ├── tasks.json
│   └── extensions.json
│
├── .husky/                           # [NEW] Git hooks
│   ├── pre-commit
│   └── pre-push
│
├── config/                           # [NEW] Configuration files
│   ├── webpack.config.js            # If needed for specific builds
│   ├── babel.config.js              # If needed
│   └── jest.config.shared.js        # Shared test config
│
├── .env.example
├── .gitignore
├── .nvmrc
├── .dockerignore                    # [NEW]
├── .editorconfig                    # [NEW]
├── LICENSE
├── README.md
├── CHANGELOG.md                      # [NEW]
├── CONTRIBUTING.md                   # [NEW]
├── SECURITY.md                       # [NEW]
├── CODE_OF_CONDUCT.md                # [NEW]
├── package.json                      # Root package.json
├── lerna.json                        # Monorepo configuration
├── yarn.lock                         # Or package-lock.json
├── Makefile                          # [NEW] Build commands
├── renovate.json                     # [NEW] Dependency updates
└── vercel.json                       # [NEW] Or netlify.toml
```

## Directory Legend

### 🏷️ Source Indicators
- `[EXTRACTED]` - Directly copied from existing repositories
- `[CONVERTED]` - Data extracted and converted to TypeScript
- `[MODIFIED]` - Based on existing code but significantly changed
- `[NEW]` - Must be built from scratch
- `[EXTENDED]` - Existing code enhanced with new features

### 📊 Extraction Sources
- **AsyncTI4/ti4_web_new** → UI components, types, basic structure
- **TwilightImperiumUltimate** → All game data (factions, cards, tiles)
- **ti4calc** → Combat engine and probability calculations
- **KeeganW/ti4** → Map generation algorithms
- **von-grid** → Hexagonal grid mathematics and pathfinding
- **AsyncTI4/TI4_map_generator_bot** → Reference for game logic (Java)

### 🎮 Major Components by Source

#### From Existing Repos (60%):
- Complete data models (cards, factions, tiles, etc.)
- Combat probability calculations
- Map generation and balancing
- Hexagonal grid mathematics
- UI component structure
- Asset pipeline

#### New Development (40%):
- Game rules engine
- Boardgame.io integration
- 3D visualization with Three.js
- Prophecy of Kings mechanics
- Advanced combat (space cannon, bombardment)
- Movement and wormhole systems
- Social features (chat, voice, tournaments)
- Companion app mode
- Tutorial and help system
- Admin and moderation tools

### 📁 Key Directories

#### `/client/src/game/` - Game Engine
The heart of the application. Most needs to be built by studying AsyncTI4's Java bot.

#### `/client/src/three/` - 3D Rendering
New Three.js implementation with von-grid integration for hexagonal board.

#### `/client/src/components/` - UI Components
Extended from AsyncTI4/ti4_web_new with new 3D components and features.

#### `/server/` - Backend Services
Boardgame.io server with tournament support, chat, and WebRTC signaling.

#### `/scripts/extraction/` - Data Pipeline
Automated extraction from all source repositories.

### 🚀 Implementation Priority

1. **Core Game** (Weeks 1-15)
2. **PoK Content** (Weeks 11-13)
3. **3D Visualization** (Weeks 16-18)
4. **Multiplayer** (Weeks 19-21)
5. **Social Features** (Weeks 22-23)
6. **Companion Mode** (Weeks 24-25)
7. **Polish** (Weeks 26-28)
8. **Post-Launch** (Weeks 29+)