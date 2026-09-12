import {
  Game, Player, Position, GameStatus, SpecialZone, GameEvent, Team
} from './types';
import {
  buildCapturePolygon, subtractTerritory, pointInPolygons,
  pointInPolygon, dist, totalArea, pathIntersectsPath,
  segmentIntersection, clamp, pointInCircle, ringArea
} from './geometry';

const games = new Map<string, Game>();

const PLAYER_COLORS = [
  '#00e5ff', '#ff3b6b', '#7cff4f', '#ffd43b',
  '#b86bff', '#ff8c42', '#00ff9d', '#ff5cff'
];

const AVATARS = ['🦊', '🐺', '🦁', '🐯', '🦅', '🐉', '🦄', '🐻'];

const BOT_NAMES = ['Nexus', 'Vortex', 'Blaze', 'Storm', 'Apex', 'Titan', 'Ghost', 'Nova'];

// Phase durations in seconds (for 420s default game)
const PHASE_DURATIONS = {
  EXPANSION: 120,
  BATTLE: 180,
  CHAOS: 60,
  FINAL_DOMINATION: 60,
};

function generateCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function generateId(): string {
  return crypto.randomUUID();
}

function makeStartingTerritory(cx: number, cy: number, size = 0.07): Position[] {
  return [
    { x: cx - size, y: cy - size },
    { x: cx + size, y: cy - size },
    { x: cx + size, y: cy + size },
    { x: cx - size, y: cy + size },
  ];
}

const STARTING_POSITIONS: Position[] = [
  { x: 0.15, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.15, y: 0.85 },
  { x: 0.85, y: 0.85 },
  { x: 0.50, y: 0.15 },
  { x: 0.50, y: 0.85 },
  { x: 0.15, y: 0.50 },
  { x: 0.85, y: 0.50 },
];

export function createGame(opts: { duration?: number; teamMode?: boolean } = {}): Game {
  const id = generateId();
  const game: Game = {
    id,
    joinCode: generateCode(),
    status: 'LOBBY',
    currentPhase: 'LOBBY',
    duration: opts.duration ?? 420,
    startTime: null,
    endTime: null,
    phaseEndTime: null,
    players: {},
    teams: {},
    hallConfig: {
      width: 1,
      height: 1,
      boundary: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }
      ],
      obstacles: []
    },
    specialZones: [],
    events: [],
    teamMode: opts.teamMode ?? false,
    minCapturePct: 0.001,
    maxCapturePct: 0.4,
    hostId: null,
    paused: false,
    pausedAt: null,
  };
  games.set(id, game);
  return game;
}

export function getGame(id: string): Game | undefined {
  return games.get(id);
}

export function getGameByCode(code: string): Game | undefined {
  return [...games.values()].find(g => g.joinCode === code.toUpperCase());
}

export function addPlayer(
  game: Game,
  username: string,
  avatar: string,
  isBot = false,
  socketId?: string
): Player {
  if (!isBot) {
    const dup = Object.values(game.players).find(
      p => p.username.toLowerCase() === username.toLowerCase()
    );
    if (dup) throw new Error('Username already taken');
  }

  const index = Object.keys(game.players).length;
  const pos = STARTING_POSITIONS[index % STARTING_POSITIONS.length];
  const startTerritory = makeStartingTerritory(pos.x, pos.y);

  const player: Player = {
    id: socketId ?? generateId(),
    username,
    avatar,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    teamId: null,
    position: { ...pos },
    territory: [startTerritory],
    startingTerritory: startTerritory,
    score: 0,
    territoryPercentage: ringArea(startTerritory),
    captures: 0,
    defenses: 0,
    interruptedPaths: 0,
    completedPaths: 0,
    distanceTraveled: 0,
    active: true,
    isBot,
    path: [],
    pathState: 'NONE',
    speedBoost: false,
    speedBoostUntil: 0,
    lastMoveTime: Date.now(),
    suspiciousFlags: 0,
    _botTarget: undefined,
    _botPhase: 'EXPAND',
    _botCooldown: 0,
  };

  game.players[player.id] = player;
  return player;
}

export function startGame(game: Game) {
  game.status = 'COUNTDOWN';
  game.currentPhase = 'COUNTDOWN';
  game.startTime = Date.now();
  game.endTime = Date.now() + game.duration * 1000;
  game.phaseEndTime = Date.now() + 3000; // countdown is 3s
  addEvent(game, 'GAME_START', '🎮 TerraRush has started!', []);
}

export function addEvent(game: Game, type: GameEvent['type'], message: string, playerIds: string[]) {
  const ev: GameEvent = {
    id: generateId(),
    timestamp: Date.now(),
    type,
    message,
    playerIds,
  };
  game.events.unshift(ev);
  if (game.events.length > 30) game.events.length = 30;
}

// ──────────────────────────────────────────────────────────────────────────────
// MOVEMENT + PATH ENGINE
// ──────────────────────────────────────────────────────────────────────────────

const MAX_SPEED = 0.012; // max normalized units per tick
const MOVE_INTERVAL_MS = 50;

export function updatePlayerPosition(
  game: Game,
  playerId: string,
  position: Position
): { interrupted?: string[] } {
  const player = game.players[playerId];
  if (!player || !player.active) return {};
  if (game.status === 'LOBBY' || game.status === 'FINISHED' || game.status === 'COUNTDOWN') return {};
  if (game.paused) return {};

  const now = Date.now();
  const dt = now - player.lastMoveTime;

  // Anti-cheat: max speed check
  const d = dist(player.position, position);
  const maxAllowed = MAX_SPEED * (dt / MOVE_INTERVAL_MS) * 3; // allow up to 3x for lag
  if (d > maxAllowed && dt < 2000) {
    player.suspiciousFlags++;
    // clamp movement
    const angle = Math.atan2(position.y - player.position.y, position.x - player.position.x);
    position = {
      x: player.position.x + Math.cos(angle) * maxAllowed,
      y: player.position.y + Math.sin(angle) * maxAllowed,
    };
  }

  position = clamp(position);
  player.distanceTraveled += dist(player.position, position);
  player.position = position;
  player.lastMoveTime = now;

  // Check speed boost expiry
  if (player.speedBoost && now > player.speedBoostUntil) {
    player.speedBoost = false;
  }

  // Check zone effects
  applyZoneEffects(game, player);

  // Update path state
  const result = updatePath(game, player);

  // Update scores
  recalcTerritory(game);

  return result;
}

function applyZoneEffects(game: Game, player: Player) {
  for (const zone of game.specialZones) {
    if (!zone.active) continue;
    if (pointInCircle(player.position, zone.center, zone.radius)) {
      if (zone.type === 'SPEED' && !player.speedBoost) {
        player.speedBoost = true;
        player.speedBoostUntil = Date.now() + 8000;
      }
    }
  }
}

function updatePath(
  game: Game,
  player: Player
): { interrupted?: string[] } {
  const inOwnTerritory = pointInPolygons(player.position, player.territory.map(r => [r]));

  if (inOwnTerritory) {
    if (player.pathState === 'ACTIVE' && player.path.length >= 3) {
      // Close the path — attempt territory capture
      player.path.push({ ...player.position });
      const captured = attemptCapture(game, player);
      player.path = [];
      player.pathState = 'NONE';
      return captured;
    } else if (player.pathState !== 'NONE') {
      player.path = [];
      player.pathState = 'NONE';
    }
  } else {
    // Outside own territory
    if (player.pathState === 'NONE') {
      player.pathState = 'ACTIVE';
      player.path = [{ ...player.position }];
    } else if (player.pathState === 'ACTIVE') {
      const last = player.path[player.path.length - 1];
      if (dist(last, player.position) > 0.004) {
        player.path.push({ ...player.position });
      }

      // Check if our path intersects any enemy path (we cut them)
      const interrupted: string[] = [];
      for (const other of Object.values(game.players)) {
        if (other.id === player.id || !other.active) continue;
        if (other.pathState !== 'ACTIVE' || other.path.length < 2) continue;
        // Don't interrupt teammates
        if (game.teamMode && other.teamId && other.teamId === player.teamId) continue;

        const myLast2 = player.path.slice(-2);
        if (myLast2.length < 2) continue;

        if (pathIntersectsPath(myLast2, other.path)) {
          // Cut their path
          other.pathState = 'INTERRUPTED';
          other.path = [];
          other.pathState = 'NONE';
          other.interruptedPaths++;
          player.interruptedPaths++;
          player.score += 50;
          interrupted.push(other.id);

          addEvent(game, 'INTERRUPT',
            `⚔️ ${player.username} cut ${other.username}'s path!`,
            [player.id, other.id]
          );
        }
      }

      // Check if our own path self-intersects (invalid)
      if (player.path.length >= 4) {
        const n = player.path.length;
        const a = player.path[n - 2];
        const b = player.path[n - 1];
        for (let i = 0; i < n - 3; i++) {
          if (segmentIntersection(a, b, player.path[i], player.path[i + 1])) {
            // Self-intersection — cancel path
            player.path = [];
            player.pathState = 'NONE';
            break;
          }
        }
      }

      if (interrupted.length > 0) return { interrupted };
    }
  }
  return {};
}

function attemptCapture(game: Game, player: Player): { interrupted?: string[] } {
  const newTerritories = buildCapturePolygon(player.path, player.territory.map(r => [r]));
  if (!newTerritories) return {};

  // Calculate newly captured area
  const oldArea = totalArea(player.territory.map(r => [r]));
  const newArea = totalArea(newTerritories);
  const diff = newArea - oldArea;

  if (diff < game.minCapturePct) return {};
  if (diff > game.maxCapturePct) return {}; // too large — prevent exploits

  // Check phase multiplier
  let multiplier = 1;
  if (game.currentPhase === 'FINAL_DOMINATION') multiplier = 2;

  // Check HOT zone
  for (const zone of game.specialZones) {
    if (!zone.active || zone.type !== 'HOT') continue;
    // If path passes through or near HOT zone
    if (player.path.some(p => pointInCircle(p, zone.center, zone.radius))) {
      multiplier *= zone.multiplier;
    }
  }

  // Subtract from enemies whose territory overlaps
  const captured: string[] = [];
  for (const other of Object.values(game.players)) {
    if (other.id === player.id || !other.active) continue;
    if (game.teamMode && other.teamId === player.teamId) continue;

    const beforeArea = totalArea(other.territory.map(r => [r]));
    other.territory = subtractFromTerritory(other.territory, newTerritories);
    const afterArea = totalArea(other.territory.map(r => [r]));

    const stolen = beforeArea - afterArea;
    if (stolen > 0.0001) {
      captured.push(other.id);
      player.captures++;
      other.defenses++;
      // Restore home if it was eaten
      ensureHomeTerritory(other);
      addEvent(game, 'CAPTURE',
        `🏴 ${player.username} captured ${(stolen * 100).toFixed(1)}% from ${other.username}!`,
        [player.id, other.id]
      );
    }
  }

  // Apply new territory
  player.territory = newTerritories.map(poly => poly[0]);
  player.completedPaths++;
  const points = Math.round(diff * 1000 * multiplier);
  player.score += points;

  addEvent(game, 'CAPTURE',
    `✅ ${player.username} claimed ${(diff * 100).toFixed(1)}% territory (+${points}pts)`,
    [player.id]
  );

  return {};
}

function subtractFromTerritory(territory: Position[][], subtractPolys: Position[][][]): Position[][] {
  // Convert formats
  const aPolys = territory.map(ring => [ring]);
  const bPolys = subtractPolys;
  const result = subtractTerritory(aPolys, bPolys);
  return result.map(poly => poly[0]);
}

function ensureHomeTerritory(player: Player) {
  // Check if home territory still exists
  const homeCenter = {
    x: (player.startingTerritory[0].x + player.startingTerritory[2].x) / 2,
    y: (player.startingTerritory[0].y + player.startingTerritory[2].y) / 2,
  };
  const inHome = player.territory.some(ring =>
    pointInPolygon(homeCenter, ring)
  );
  if (!inHome) {
    // Re-add a small home territory
    player.territory.push(makeStartingTerritory(homeCenter.x, homeCenter.y, 0.04));
  }
}

export function recalcTerritory(game: Game) {
  const total = 1; // 1x1 arena
  const teamTotals: Record<string, number> = {};

  for (const player of Object.values(game.players)) {
    const area = totalArea(player.territory.map(r => [r]));
    player.territoryPercentage = area / total;

    if (game.teamMode && player.teamId) {
      teamTotals[player.teamId] = (teamTotals[player.teamId] ?? 0) + area;
    }
  }

  // Update team scores
  for (const team of Object.values(game.teams)) {
    team.territoryPercentage = (teamTotals[team.id] ?? 0) / total;
    team.score = Object.values(game.players)
      .filter(p => p.teamId === team.id)
      .reduce((s, p) => s + p.score, 0);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// GAME PHASES
// ──────────────────────────────────────────────────────────────────────────────

export function tickGamePhase(game: Game): boolean {
  if (game.paused) return false;
  if (game.status === 'LOBBY' || game.status === 'FINISHED') return false;

  const now = Date.now();

  if (game.status === 'COUNTDOWN') {
    if (now >= (game.phaseEndTime ?? 0)) {
      transitionPhase(game, 'EXPANSION');
      return true;
    }
    return false;
  }

  if (game.endTime && now >= game.endTime) {
    endGame(game);
    return true;
  }

  if (game.phaseEndTime && now >= game.phaseEndTime) {
    const next = getNextPhase(game.currentPhase);
    if (next) {
      transitionPhase(game, next);
      return true;
    }
  }

  // Expire special zones
  let zoneChanged = false;
  for (const zone of game.specialZones) {
    if (zone.active && now >= zone.expiresAt) {
      zone.active = false;
      zoneChanged = true;
    }
  }

  // Spawn new zones in CHAOS
  if (game.currentPhase === 'CHAOS' || game.currentPhase === 'BATTLE') {
    const activeZones = game.specialZones.filter(z => z.active).length;
    if (activeZones < 3 && Math.random() < 0.005) {
      spawnSpecialZone(game);
      zoneChanged = true;
    }
  }

  return zoneChanged;
}

function getNextPhase(current: GameStatus): GameStatus | null {
  const order: GameStatus[] = ['EXPANSION', 'BATTLE', 'CHAOS', 'FINAL_DOMINATION'];
  const idx = order.indexOf(current);
  if (idx === -1 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

function transitionPhase(game: Game, phase: GameStatus) {
  game.status = phase;
  game.currentPhase = phase;

  const duration = PHASE_DURATIONS[phase as keyof typeof PHASE_DURATIONS];
  if (duration) {
    game.phaseEndTime = Date.now() + duration * 1000;
  }

  const messages: Record<string, string> = {
    EXPANSION: '🗺️ EXPANSION PHASE — Claim your territory!',
    BATTLE: '⚔️ BATTLE PHASE — Attack and defend!',
    CHAOS: '🔥 CHAOS PHASE — Special zones activated!',
    FINAL_DOMINATION: '👑 FINAL DOMINATION — 2× points!',
    FINISHED: '🏆 Game over! Calculating results...',
  };

  addEvent(game, 'PHASE_CHANGE', messages[phase] ?? phase, []);

  if (phase === 'CHAOS') {
    // Spawn 2 zones immediately
    spawnSpecialZone(game);
    spawnSpecialZone(game);
  }
}

function endGame(game: Game) {
  game.status = 'FINISHED';
  game.currentPhase = 'FINISHED';

  // Final territory score bonus
  for (const player of Object.values(game.players)) {
    const areaPts = Math.round(player.territoryPercentage * 5000);
    player.score += areaPts;
  }

  recalcTerritory(game);
  addEvent(game, 'GAME_END', '🏆 Game finished!', []);
}

function spawnSpecialZone(game: Game) {
  const types: SpecialZone['type'][] = ['HOT', 'RECOVERY', 'BONUS', 'SPEED'];
  const type = types[Math.floor(Math.random() * types.length)];
  const zone: SpecialZone = {
    id: generateId(),
    type,
    center: { x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8 },
    radius: 0.06 + Math.random() * 0.04,
    active: true,
    expiresAt: Date.now() + (20 + Math.random() * 30) * 1000,
    label: type === 'HOT' ? '🔥 HOT ZONE' :
           type === 'RECOVERY' ? '💚 RECOVERY' :
           type === 'BONUS' ? '⭐ BONUS' : '⚡ SPEED',
    color: type === 'HOT' ? '#ff4400' :
           type === 'RECOVERY' ? '#00ff88' :
           type === 'BONUS' ? '#ffdd00' : '#00aaff',
    multiplier: type === 'HOT' ? 2 : type === 'BONUS' ? 1.5 : 1,
  };
  game.specialZones.push(zone);
  addEvent(game, 'ZONE_SPAWN', `${zone.label} spawned!`, []);
}

// ──────────────────────────────────────────────────────────────────────────────
// DEMO BOTS
// ──────────────────────────────────────────────────────────────────────────────

export function addBots(game: Game, count = 4) {
  const botTypes: Array<Player['botType']> = ['EXPANDER', 'ATTACKER', 'DEFENDER', 'BALANCED'];
  for (let i = 0; i < count; i++) {
    const type = botTypes[i % botTypes.length];
    const name = BOT_NAMES[i % BOT_NAMES.length];
    const avatar = AVATARS[i % AVATARS.length];
    const player = addPlayer(game, name, avatar, true);
    player.botType = type;
    player._botPhase = 'EXPAND';
    player._botCooldown = 0;
  }
}

const BOT_SPEED = 0.006;

export function tickBots(game: Game): boolean {
  if (game.status === 'LOBBY' || game.status === 'FINISHED' || game.status === 'COUNTDOWN') return false;

  let changed = false;

  for (const player of Object.values(game.players)) {
    if (!player.isBot || !player.active) continue;
    tickBot(game, player);
    changed = true;
  }

  return changed;
}

function tickBot(game: Game, bot: Player) {
  const now = Date.now();
  if (bot._botCooldown && now < bot._botCooldown) return;

  const speed = bot.speedBoost ? BOT_SPEED * 1.5 : BOT_SPEED;

  switch (bot.botType) {
    case 'EXPANDER': tickBotExpander(game, bot, speed); break;
    case 'ATTACKER': tickBotAttacker(game, bot, speed); break;
    case 'DEFENDER': tickBotDefender(game, bot, speed); break;
    case 'BALANCED': tickBotBalanced(game, bot, speed); break;
  }
}

function moveToward(bot: Player, target: Position, speed: number) {
  const dx = target.x - bot.position.x;
  const dy = target.y - bot.position.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 0.005) return;
  const nx = dx / d, ny = dy / d;
  bot.position = clamp({
    x: bot.position.x + nx * speed,
    y: bot.position.y + ny * speed,
  });
}

function randomPointNearTerritory(bot: Player, radius = 0.25): Position {
  const cx = bot.territory[0] ? 
    (bot.territory[0][0].x + bot.territory[0][2].x) / 2 : bot.position.x;
  const cy = bot.territory[0] ?
    (bot.territory[0][0].y + bot.territory[0][2].y) / 2 : bot.position.y;
  const angle = Math.random() * Math.PI * 2;
  const r = radius * (0.3 + Math.random() * 0.7);
  return clamp({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
}

function tickBotExpander(game: Game, bot: Player, speed: number) {
  if (!bot._botTarget || dist(bot.position, bot._botTarget) < 0.02) {
    if (bot.pathState === 'ACTIVE' && bot.path.length > 5) {
      // Head back to territory
      const home = bot.territory[0]?.[0] ?? { x: 0.5, y: 0.5 };
      bot._botTarget = home;
    } else {
      bot._botTarget = randomPointNearTerritory(bot, 0.2);
    }
  }
  moveToward(bot, bot._botTarget, speed);
  updatePath(game, bot);
}

function tickBotAttacker(game: Game, bot: Player, speed: number) {
  // Find nearest enemy with active path to cut, else attack territory
  const enemies = Object.values(game.players).filter(
    p => p.id !== bot.id && p.active && !p.isBot && 
    (!game.teamMode || p.teamId !== bot.teamId)
  );

  if (enemies.length === 0) {
    tickBotExpander(game, bot, speed);
    return;
  }

  // Prefer enemies with active paths
  const activeEnemy = enemies.find(e => e.pathState === 'ACTIVE');
  const target = activeEnemy ?? enemies[Math.floor(Math.random() * enemies.length)];

  if (!bot._botTarget || dist(bot.position, bot._botTarget) < 0.02) {
    if (bot.pathState === 'ACTIVE' && bot.path.length > 8) {
      bot._botTarget = bot.territory[0]?.[0] ?? { x: 0.5, y: 0.5 };
    } else {
      // Head toward enemy
      bot._botTarget = { ...target.position };
    }
  }
  moveToward(bot, bot._botTarget, speed * 1.1);
  updatePath(game, bot);
}

function tickBotDefender(game: Game, bot: Player, speed: number) {
  // Stay near own territory, come back quickly when path is long
  if (bot.pathState === 'ACTIVE' && bot.path.length > 4) {
    const home = bot.territory[0]?.[0] ?? { x: 0.5, y: 0.5 };
    bot._botTarget = home;
  } else if (!bot._botTarget || dist(bot.position, bot._botTarget) < 0.02) {
    bot._botTarget = randomPointNearTerritory(bot, 0.12);
  }
  moveToward(bot, bot._botTarget, speed);
  updatePath(game, bot);
}

function tickBotBalanced(game: Game, bot: Player, speed: number) {
  const now = Date.now();
  if (!bot._botPhase) bot._botPhase = 'EXPAND';
  if (!bot._botCooldown || now > bot._botCooldown) {
    bot._botPhase = Math.random() < 0.6 ? 'EXPAND' : 'ATTACK';
    bot._botCooldown = now + 3000;
  }
  if (bot._botPhase === 'EXPAND') {
    tickBotExpander(game, bot, speed);
  } else {
    tickBotAttacker(game, bot, speed);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// TEAM SETUP
// ──────────────────────────────────────────────────────────────────────────────

export function setupTeams(game: Game) {
  const players = Object.values(game.players);
  const teamDefs = [
    { id: 't1', name: 'Blue', color: '#00e5ff' },
    { id: 't2', name: 'Red', color: '#ff3b6b' },
    { id: 't3', name: 'Green', color: '#7cff4f' },
    { id: 't4', name: 'Yellow', color: '#ffd43b' },
  ];

  // Assign players round-robin to teams
  players.forEach((p, i) => {
    const td = teamDefs[i % teamDefs.length];
    if (!game.teams[td.id]) {
      game.teams[td.id] = { id: td.id, name: td.name, color: td.color, playerIds: [], score: 0, territoryPercentage: 0 };
    }
    p.teamId = td.id;
    p.color = td.color;
    game.teams[td.id].playerIds.push(p.id);
  });
}

export function getGames() {
  return games;
}

export function pauseGame(game: Game) {
  if (!game.paused) {
    game.paused = true;
    game.pausedAt = Date.now();
  }
}

export function resumeGame(game: Game) {
  if (game.paused && game.pausedAt) {
    const pausedFor = Date.now() - game.pausedAt;
    if (game.endTime) game.endTime += pausedFor;
    if (game.phaseEndTime) game.phaseEndTime += pausedFor;
    game.paused = false;
    game.pausedAt = null;
  }
}
