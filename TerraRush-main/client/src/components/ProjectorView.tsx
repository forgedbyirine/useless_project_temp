import type { Game, Player } from '../types';
import { useRef } from 'react';

interface Props {
  game: Game | null;
  onBack: () => void;
}

const PHASE_COLORS: Record<string, string> = {
  EXPANSION: '#00e5ff', BATTLE: '#ff3b6b', CHAOS: '#ffd43b',
  FINAL_DOMINATION: '#b86bff', COUNTDOWN: '#7cff4f', FINISHED: '#6b7280',
};

function formatTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function ProjectorView({ game, onBack }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  if (!game) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#05070d', gap: 20,
      }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#00e5ff', letterSpacing: '0.15em' }}>TERRARUSH</div>
        <div style={{ color: '#6b7280', fontSize: 16 }}>Waiting for game to start...</div>
        <button onClick={onBack} style={{ marginTop: 20, padding: '10px 24px', background: '#111827', color: '#6b7280', border: '1px solid #1e2638', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          ← Back
        </button>
      </div>
    );
  }

  const players = Object.values(game.players).sort((a, b) => b.score - a.score);
  const remaining = game.endTime ? game.endTime - Date.now() : 0;
  const phaseColor = PHASE_COLORS[game.currentPhase] ?? '#00e5ff';
  const W = 1920, H = 1080;
  const bfW = W - 320, bfH = H - 80;

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#05070d',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <header style={{
        height: 68, background: 'rgba(5,7,13,0.97)', borderBottom: '1px solid #1e2638',
        display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20, flexShrink: 0,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>←</button>
        <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.15em', color: '#00e5ff' }}>
          TERRARUSH
        </span>
        <div style={{
          padding: '6px 16px', borderRadius: 6,
          background: phaseColor + '22', border: `1px solid ${phaseColor}44`,
          color: phaseColor, fontSize: 14, fontWeight: 700, letterSpacing: '0.1em',
          animation: game.currentPhase === 'FINAL_DOMINATION' ? 'pulse 1s infinite' : 'none',
        }}>
          {game.currentPhase.replace('_', ' ')}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          fontSize: 36, fontWeight: 900,
          color: remaining < 30000 ? '#ff3b6b' : '#e8eaf0',
          animation: remaining < 30000 ? 'pulse 1s infinite' : 'none',
        }}>
          {formatTime(remaining)}
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Battlefield SVG — fills all available space */}
        <div style={{ flex: 1, position: 'relative', background: '#080c14', overflow: 'hidden' }}>
          <svg
            ref={svgRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            viewBox={`0 0 1 1`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="0.05" height="0.05" patternUnits="userSpaceOnUse">
                <path d="M 0.05 0 L 0 0 0 0.05" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.001"/>
              </pattern>
            </defs>
            <rect width="1" height="1" fill="url(#grid)" />

            {/* Territories */}
            {players.map(player =>
              player.territory.map((ring, ri) => ring && ring.length >= 3 ? (
                <polygon
                  key={`t-${player.id}-${ri}`}
                  points={ring.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={player.color + '33'}
                  stroke={player.color}
                  strokeWidth={0.003}
                  strokeLinejoin="round"
                />
              ) : null)
            )}

            {/* Active paths */}
            {players.filter(p => p.pathState === 'ACTIVE' && p.path.length >= 2).map(player => (
              <polyline
                key={`path-${player.id}`}
                points={player.path.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={player.color}
                strokeWidth={0.005}
                strokeLinecap="round"
                opacity={0.9}
              />
            ))}

            {/* Special zones */}
            {game.specialZones.filter(z => z.active).map(z => (
              <g key={z.id}>
                <circle cx={z.center.x} cy={z.center.y} r={z.radius}
                  fill={z.color + '18'} stroke={z.color} strokeWidth={0.003} />
                <text x={z.center.x} y={z.center.y} textAnchor="middle"
                  dominantBaseline="central" fontSize={0.025}
                  fill={z.color} fontWeight="bold" style={{ userSelect: 'none' }}>
                  {z.label}
                </text>
              </g>
            ))}

            {/* Player markers */}
            {players.map(player => (
              <g key={`pm-${player.id}`}>
                <circle cx={player.position.x} cy={player.position.y} r={0.022}
                  fill={player.color} opacity={player.active ? 1 : 0.3} />
                <text x={player.position.x} y={player.position.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={0.022} style={{ userSelect: 'none' }}>
                  {player.avatar}
                </text>
                <text x={player.position.x} y={player.position.y - 0.038}
                  textAnchor="middle" fontSize={0.016}
                  fill={player.color} fontWeight="bold" style={{ userSelect: 'none' }}>
                  {player.username}
                </text>
              </g>
            ))}
          </svg>

          {/* Event feed overlay */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            display: 'flex', flexDirection: 'column-reverse', gap: 8, maxWidth: 400,
          }}>
            {game.events.slice(0, 4).map(ev => (
              <div key={ev.id} style={{
                background: 'rgba(5,7,13,0.9)', border: '1px solid #1e2638',
                padding: '8px 16px', borderRadius: 8,
                fontSize: 15, fontWeight: 700, color: '#e8eaf0',
                animation: 'slideIn 0.3s ease',
              }}>
                {ev.message}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel: leaderboard */}
        <aside style={{
          width: 280, background: '#0b0f1a', borderLeft: '1px solid #1e2638',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e2638' }}>
            <span style={{ fontSize: 12, letterSpacing: '0.12em', color: '#6b7280' }}>LEADERBOARD</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {players.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderBottom: '1px solid #111827',
              }}>
                <span style={{ fontSize: 18 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                <span style={{ fontSize: 22 }}>{p.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: p.color }}>{p.username}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    {(p.territoryPercentage * 100).toFixed(1)}%
                    {p.pathState === 'ACTIVE' && <span style={{ color: '#ffd43b', marginLeft: 6 }}>ACTIVE PATH</span>}
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#e8eaf0' }}>{p.score}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
