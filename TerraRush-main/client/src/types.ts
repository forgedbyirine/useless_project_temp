export type GameStatus =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'EXPANSION'
  | 'BATTLE'
  | 'CHAOS'
  | 'FINAL_DOMINATION'
  | 'FINISHED';

export type PathState = 'NONE' | 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED';

export type BotType = 'EXPANDER' | 'ATTACKER' | 'DEFENDER' | 'BALANCED';

export interface Position {
  x: number;
  y: number;
}

export interface SpecialZone {
  id: string;
  type: 'HOT' | 'RECOVERY' | 'BONUS' | 'SPEED';
  center: Position;
  radius: number;
  active: boolean;
  expiresAt: number;
  label: string;
  color: string;
  multiplier: number;
}

export interface Player {
  id: string;
  username: string;
  avatar: string;
  color: string;
  teamId: string | null;

  position: Position;

  // territory is an array of polygon rings: each ring is Position[]
  territory: Position[][];
  startingTerritory: Position[];

  score: number;
  territoryPercentage: number;

  captures: number;
  defenses: number;
  interruptedPaths: number;
  completedPaths: number;
  distanceTraveled: number;

  active: boolean;
  isBot: boolean;
  botType?: BotType;

  path: Position[];
  pathState: PathState;

  speedBoost: boolean;
  speedBoostUntil: number;

  lastMoveTime: number;
  suspiciousFlags: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  playerIds: string[];
  score: number;
  territoryPercentage: number;
}

export interface HallConfig {
  width: number;
  height: number;
  boundary: Position[];
  obstacles: Position[][];
}

export interface GameEvent {
  id: string;
  timestamp: number;
  type: 'CAPTURE' | 'INTERRUPT' | 'DEFENSE' | 'PHASE_CHANGE' | 'ZONE_SPAWN' | 'GAME_START' | 'GAME_END';
  message: string;
  playerIds: string[];
}

export interface Game {
  id: string;
  joinCode: string;

  status: GameStatus;
  currentPhase: GameStatus;

  duration: number;
  startTime: number | null;
  endTime: number | null;
  phaseEndTime: number | null;

  players: Record<string, Player>;
  teams: Record<string, Team>;

  hallConfig: HallConfig;
  specialZones: SpecialZone[];

  events: GameEvent[];

  teamMode: boolean;
  minCapturePct: number;
  maxCapturePct: number;

  hostId: string | null;
  paused: boolean;
  pausedAt: number | null;
}

// Client-side socket events
export interface ServerToClientEvents {
  'game-created': (data: { gameId: string; joinCode: string }) => void;
  'game-state': (game: Game) => void;
  'game-started': (game: Game) => void;
  'error-message': (msg: string) => void;
  'countdown': (count: number) => void;
  'game-event': (event: GameEvent) => void;
  'player-interrupted': (data: { victimId: string; attackerId: string }) => void;
}

export interface ClientToServerEvents {
  'create-game': (opts: { duration?: number; teamMode?: boolean }) => void;
  'join-game': (data: { code: string; username: string; avatar: string }) => void;
  'start-game': () => void;
  'player-move': (pos: Position) => void;
  'start-demo': () => void;
  'admin-pause': () => void;
  'admin-resume': () => void;
  'admin-end': () => void;
}
