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

  // Bot internal state
  _botTarget?: Position;
  _botPhase?: string;
  _botCooldown?: number;
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
