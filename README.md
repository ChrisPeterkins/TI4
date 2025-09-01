# TI4 Web App

A complete digital implementation of Twilight Imperium 4th Edition with Prophecy of Kings expansion.

##  Features

- Full TI4 base game implementation
- Complete Prophecy of Kings expansion
- 3D board visualization using Three.js
- Real-time multiplayer via Boardgame.io
- Voice and text chat
- Tournament support
- Companion app mode for physical games
- Save/load functionality
- Replay system

##  Tech Stack

- **Frontend**: React 18, TypeScript, Three.js, Zustand
- **Backend**: Node.js, Express, Boardgame.io, Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Monorepo**: Lerna
- **Build**: Vite

##  Project Structure

```
ti4-web-app/
├── client/          # React frontend application
├── server/          # Node.js backend server
├── shared/          # Shared types and utilities
├── scripts/         # Build and extraction scripts
├── docs/            # Documentation
└── docker/          # Docker configuration
```

##  Getting Started

### Prerequisites

- Node.js 20+ 
- npm 10+
- PostgreSQL 15+
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ChrisPeterkins/TI4.git
cd TI4
```

2. Install dependencies:
```bash
npm install
npm run bootstrap
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
cd server
npx prisma migrate dev
```

5. Start development servers:
```bash
npm run dev
```

The client will be available at http://localhost:5173
The server will be running at http://localhost:3001

## 🎮 Development

### Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

### Project Phases

Following the implementation plan from `ti4-implementation-plan.md`:

1. **Phase 1**: Foundation & Data Extraction (Weeks 1-4) ✅ In Progress
2. **Phase 2**: Game Engine Core (Weeks 5-10)
3. **Phase 3**: Prophecy of Kings (Weeks 11-13)
4. **Phase 4**: Advanced Combat & Movement (Weeks 14-15)
5. **Phase 5**: 3D Visualization (Weeks 16-18)
6. **Phase 6**: Multiplayer Infrastructure (Weeks 19-21)
7. **Phase 7**: Social Features (Weeks 22-23)
8. **Phase 8**: Companion & Mobile (Weeks 24-25)
9. **Phase 9**: Polish & Launch Prep (Weeks 26-28)

##  Data Sources

This project leverages and builds upon several open-source TI4 projects:

- [AsyncTI4/ti4_web_new](https://github.com/AsyncTI4/ti4_web_new) - UI components and structure
- [TwilightImperiumUltimate](https://github.com/Lazik10/TwilightImperiumUltimate) - Game data
- [ti4calc](https://github.com/alpha-mouse/ti4calc) - Combat calculations
- [KeeganW/ti4](https://github.com/KeeganW/ti4) - Map generation
- [von-grid](https://github.com/vonWolfehaus/von-grid) - Hexagonal grid math

##  Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

##  License

MIT License - see LICENSE file for details

##  Acknowledgments

- Fantasy Flight Games for creating Twilight Imperium
- The TI4 community for their passion and support
- All the open-source projects that made this possible

##  Contact

- GitHub: [@ChrisPeterkins](https://github.com/ChrisPeterkins)
- Project Link: [https://github.com/ChrisPeterkins/TI4](https://github.com/ChrisPeterkins/TI4)

---

*The galaxy awaits its new digital emperor.*