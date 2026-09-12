import { useEffect, useRef, useState, useCallback } from 'react';
import type { Game, Player, Position } from '../types';
import Battlefield from './Battlefield';
import Leaderboard from './Leaderboard';
import HUD from './HUD';
import VirtualJoystick from './VirtualJoystick';
import EventFeed from './EventFeed';

interface Props {
  game: Game | null;
  myPlayerId: string | null;
  onMove: (pos: Position) => void;
}

const isMobile = () => window.innerWidth < 768 || 'ontouchstart' in window;

export default function GameScreen({ game, myPlayerId, onMove }: Props) {
  const [mobile] = useState(isMobile);
  const posRef = useRef<Position>({ x: 0.5, y: 0.5 });
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);
  const lastSentRef = useRef<number>(0);

  const myPlayer: Player | null = game && myPlayerId
    ? (game.players[myPlayerId] ?? null)
    : null;

  // Initialise position from server
  useEffect(() => {
    if (myPlayer) posRef.current = { ...myPlayer.position };
  }, [myPlayer?.id]);

  // Keyboard controls
  useEffect(() => {
    if (mobile) return;
    const onDown = (e: KeyboardEvent) => { keysRef.current.add(e.key); e.preventDefault(); };
    const onUp   = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [mobile]);

  // Movement loop — runs at 20Hz, sends to server at 10Hz
  useEffect(() => {
    if (!myPlayerId || !game) return;
    if (game.status === 'FINISHED') return;

    const speed = myPlayer?.speedBoost ? 0.008 : 0.005;

    const tick = () => {
      const keys = keysRef.current;
      let dx = 0, dy = 0;

      if (keys.has('ArrowUp')    || keys.has('w') || keys.has('W')) dy -= 1;
      if (keys.has('ArrowDown')  || keys.has('s') || keys.has('S')) dy += 1;
      if (keys.has('ArrowLeft')  || keys.has('a') || keys.has('A')) dx -= 1;
      if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        posRef.current = {
          x: Math.max(0.01, Math.min(0.99, posRef.current.x + (dx / len) * speed)),
          y: Math.max(0.01, Math.min(0.99, posRef.current.y + (dy / len) * speed)),
        };

        const now = Date.now();
        if (now - lastSentRef.current >= 100) {
          onMove({ ...posRef.current });
          lastSentRef.current = now;
        }
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [myPlayerId, game?.status, myPlayer?.speedBoost, onMove]);

  const handleJoystick = useCallback((dx: number, dy: number) => {
    const speed = myPlayer?.speedBoost ? 0.009 : 0.006;
    posRef.current = {
      x: Math.max(0.01, Math.min(0.99, posRef.current.x + dx * speed)),
      y: Math.max(0.01, Math.min(0.99, posRef.current.y + dy * speed)),
    };
    const now = Date.now();
    if (now - lastSentRef.current >= 100) {
      onMove({ ...posRef.current });
      lastSentRef.current = now;
    }
  }, [myPlayer?.speedBoost, onMove]);

  if (!game) return <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Loading...</div>;

  const players = Object.values(game.players);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#05070d' }}>
      {/* HUD */}
      <HUD game={game} myPlayer={myPlayer} />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Battlefield */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Battlefield
            game={game}
            myPlayerId={myPlayerId}
            localPos={posRef.current}
          />
          <EventFeed events={game.events} />
        </div>

        {/* Right sidebar: leaderboard (desktop only) */}
        {!mobile && (
          <Leaderboard players={players} teams={game.teams} teamMode={game.teamMode} myPlayerId={myPlayerId} />
        )}
      </div>

      {/* Virtual joystick (mobile) */}
      {mobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '38vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(5,7,13,0.7)',
          zIndex: 20,
        }}>
          <VirtualJoystick onMove={handleJoystick} />

          {/* Stats for mobile */}
          <div style={{ textAlign: 'right', color: '#e8eaf0' }}>
            <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.1em' }}>TERRITORY</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: myPlayer?.color ?? '#00e5ff' }}>
              {((myPlayer?.territoryPercentage ?? 0) * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.1em', marginTop: 8 }}>SCORE</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{myPlayer?.score ?? 0}</div>
          </div>
        </div>
      )}
    </div>
  );
}
