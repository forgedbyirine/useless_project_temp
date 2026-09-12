import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import {
  createGame, getGame, getGameByCode, addPlayer, startGame,
  updatePlayerPosition, tickGamePhase, tickBots, addBots,
  setupTeams, pauseGame, resumeGame, addEvent, recalcTerritory
} from './game';
import type { Game } from './types';

// In production, set CLIENT_ORIGIN to your Vercel URL, e.g. https://terrarush.vercel.app
// Leave unset (or set to *) for local dev.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'], credentials: true },
  // Needed for Railway / proxied deployments
  transports: ['websocket', 'polling'],
});

// ── REST endpoints ──────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({ name: 'TerraRush Server', status: 'online', version: '1.0.0' });
});

app.post('/api/games', (req, res) => {
  const { duration, teamMode } = req.body ?? {};
  const game = createGame({ duration, teamMode });
  res.json({ gameId: game.id, joinCode: game.joinCode });
});

app.get('/api/games/:id', (req, res) => {
  const game = getGame(req.params.id);
  if (!game) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(game);
});

// ── Socket.IO ───────────────────────────────────────────────────────────────

io.on('connection', socket => {
  console.log('[+] Connected:', socket.id);

  // ── create-game ─────────────────────────────────────────────────────────

  socket.on('create-game', (opts: { duration?: number; teamMode?: boolean } = {}) => {
    const game = createGame(opts);
    game.hostId = socket.id;
    socket.join(game.id);
    socket.data.gameId = game.id;
    socket.data.isHost = true;
    socket.emit('game-created', { gameId: game.id, joinCode: game.joinCode });
    console.log('[game] Created', game.joinCode);
  });

  // ── join-game ────────────────────────────────────────────────────────────

  socket.on('join-game', ({ code, username, avatar }: { code: string; username: string; avatar: string }) => {
    const game = getGameByCode(code);
    if (!game) { socket.emit('error-message', 'Game not found'); return; }
    if (game.status !== 'LOBBY') { socket.emit('error-message', 'Game already started'); return; }

    try {
      const player = addPlayer(game, username, avatar, false, socket.id);
      socket.join(game.id);
      socket.data.gameId = game.id;
      socket.data.playerId = player.id;
      if (!game.hostId) game.hostId = socket.id;
      io.to(game.id).emit('game-state', sanitize(game));
      console.log('[game] Joined:', username, '->', game.joinCode);
    } catch (e) {
      socket.emit('error-message', e instanceof Error ? e.message : 'Join failed');
    }
  });

  // ── start-game ───────────────────────────────────────────────────────────

  socket.on('start-game', () => {
    const game = getGameByCode(socket.data.gameId ?? '') 
      ?? getGame(socket.data.gameId ?? '');
    if (!game) return;
    if (game.status !== 'LOBBY') return;

    if (game.teamMode) setupTeams(game);

    startGame(game);
    io.to(game.id).emit('game-state', sanitize(game));

    // Countdown 3-2-1
    let count = 3;
    const ctInterval = setInterval(() => {
      io.to(game.id).emit('countdown', count);
      count--;
      if (count < 0) clearInterval(ctInterval);
    }, 1000);

    // Main game loop
    startGameLoop(game.id);
    console.log('[game] Started:', game.joinCode);
  });

  // ── start-demo ───────────────────────────────────────────────────────────

  socket.on('start-demo', () => {
    const game = createGame({ duration: 420 });
    game.hostId = socket.id;
    addBots(game, 6);
    socket.join(game.id);
    socket.data.gameId = game.id;
    socket.data.isHost = true;
    startGame(game);
    io.to(game.id).emit('game-created', { gameId: game.id, joinCode: game.joinCode });
    io.to(game.id).emit('game-state', sanitize(game));
    startGameLoop(game.id);
    console.log('[demo] Started:', game.joinCode);
  });

  // ── player-move ──────────────────────────────────────────────────────────

  socket.on('player-move', (pos: { x: number; y: number }) => {
    const gameId = socket.data.gameId;
    const playerId = socket.data.playerId;
    if (!gameId || !playerId) return;

    const game = getGame(gameId) ?? getGameByCode(gameId);
    if (!game) return;

    const result = updatePlayerPosition(game, playerId, pos);

    // If someone's path was cut, emit event
    if (result.interrupted && result.interrupted.length > 0) {
      io.to(game.id).emit('player-interrupted', {
        victimId: result.interrupted[0],
        attackerId: playerId,
      });
    }

    io.to(game.id).emit('game-state', sanitize(game));
  });

  // ── admin controls ───────────────────────────────────────────────────────

  socket.on('admin-pause', () => {
    const game = getGame(socket.data.gameId ?? '');
    if (!game) return;
    pauseGame(game);
    io.to(game.id).emit('game-state', sanitize(game));
  });

  socket.on('admin-resume', () => {
    const game = getGame(socket.data.gameId ?? '');
    if (!game) return;
    resumeGame(game);
    io.to(game.id).emit('game-state', sanitize(game));
  });

  socket.on('admin-end', () => {
    const game = getGame(socket.data.gameId ?? '');
    if (!game) return;
    game.endTime = Date.now(); // Force end on next tick
    io.to(game.id).emit('game-state', sanitize(game));
  });

  // ── disconnect ───────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    const gameId = socket.data.gameId;
    const playerId = socket.data.playerId;
    if (gameId && playerId) {
      const game = getGame(gameId);
      if (game && game.players[playerId]) {
        game.players[playerId].active = false;
      }
    }
    console.log('[-] Disconnected:', socket.id);
  });
});

// ── Game loop ────────────────────────────────────────────────────────────────

const gameLoops = new Map<string, ReturnType<typeof setInterval>>();

function startGameLoop(gameId: string) {
  if (gameLoops.has(gameId)) return;

  const interval = setInterval(() => {
    const game = getGame(gameId);
    if (!game) {
      clearInterval(interval);
      gameLoops.delete(gameId);
      return;
    }

    // Tick bots
    const botChanged = tickBots(game);

    // Tick phase
    const phaseChanged = tickGamePhase(game);

    // Always broadcast (bots move every tick)
    if (botChanged || phaseChanged) {
      recalcTerritory(game);
      io.to(gameId).emit('game-state', sanitize(game));
    }

    if (game.status === 'FINISHED') {
      clearInterval(interval);
      gameLoops.delete(gameId);
      io.to(gameId).emit('game-state', sanitize(game));
    }
  }, 100); // 10Hz game loop

  gameLoops.set(gameId, interval);
}

// Sanitize game state for transmission (strip internal bot fields)
function sanitize(game: Game): Game {
  const g = { ...game };
  g.players = {};
  for (const [id, p] of Object.entries(game.players)) {
    const { _botTarget, _botPhase, _botCooldown, ...rest } = p as any;
    g.players[id] = rest;
  }
  return g;
}

// ── Start server ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`TerraRush server running at http://0.0.0.0:${PORT}`);
});
