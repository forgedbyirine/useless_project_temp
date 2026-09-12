# TerraRush 🏴

**Multiplayer territory conquest game — Claim · Attack · Dominate**

---

## Quick Start

Open **two terminals** in VS Code:

**Terminal 1 — Backend**
```
cd server
npm run dev
```
→ Server runs at http://localhost:3001

**Terminal 2 — Frontend**
```
cd client
npm run dev
```
→ Client runs at http://localhost:5173

---

## How to Play

### Create a game
1. Open http://localhost:5173
2. Click **CREATE GAME**
3. Configure duration & mode, click **CREATE GAME**
4. Share the 5-letter code with other players

### Join a game
1. Click **JOIN GAME**
2. Enter the game code + pick a username & avatar
3. Wait in lobby

### Demo Mode
Click **DEMO MODE** from the landing page — 6 AI bots start immediately.

### Controls
- **Desktop**: WASD or Arrow keys
- **Mobile**: Virtual joystick (bottom-left)

### Core mechanics
- When you leave your territory, your **path is drawn** in real time
- Return to your own territory to **close the path and capture the enclosed area**
- If an enemy crosses your active path → **your path is cut** and expansion cancelled
- Cut enemy paths yourself to score interruption points

### Game Phases
| Phase | Duration | Effect |
|-------|----------|--------|
| EXPANSION | 2 min | Focus on growing territory |
| BATTLE | 3 min | Full invasions & path cutting |
| CHAOS | 1 min | Special zones spawn (HOT, SPEED, BONUS, RECOVERY) |
| FINAL DOMINATION | 1 min | 2× points for all captures |

---

## Views
- **Game screen** — your personal battlefield + HUD
- **Projector view** — full overview for large displays (📺 button)
- **Admin dashboard** — create games, pause/end, monitor players (⚙️ button)

---

## Project Structure
```
TerraRush/
├── client/          React + TypeScript + Vite frontend
│   └── src/
│       ├── App.tsx              Root with screen routing
│       ├── socket.ts            Socket.IO client
│       ├── types.ts             Shared types
│       └── components/
│           ├── Battlefield.tsx  SVG canvas renderer
│           ├── GameScreen.tsx   Main game screen + movement
│           ├── HUD.tsx          Header info bar
│           ├── Leaderboard.tsx  Right sidebar rankings
│           ├── VirtualJoystick  Touch controls
│           ├── ProjectorView    Spectator screen
│           ├── AdminDashboard   Organizer controls
│           ├── ResultsScreen    End-game results
│           └── ...screens
│
└── server/          Node.js + Express + Socket.IO backend
    └── src/
        ├── index.ts     Socket.IO server & REST API
        ├── game.ts      Game engine (phases, bots, path cutting)
        ├── geometry.ts  Polygon territory engine (Turf.js)
        └── types.ts     Server-side types
```

---

## Known Limitations
- Positions use normalized [0,1] coords — real GPS/positioning can replace the movement layer without touching game logic
- No persistent storage (in-memory only) — add PostgreSQL by persisting the `games` Map
- Bot pathfinding is heuristic, not optimal
