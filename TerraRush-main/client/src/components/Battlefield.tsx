import { useRef, useEffect, useMemo } from 'react';
import type { Game, Player, Position, SpecialZone } from '../types';

interface Props {
  game: Game;
  myPlayerId: string | null;
  localPos: Position; // client-side interpolated position
}

export default function Battlefield({ game, myPlayerId, localPos }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const sizeRef      = useRef({ w: 800, h: 600 });

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        sizeRef.current = { w: e.contentRect.width, h: e.contentRect.height };
        const canvas = canvasRef.current;
        if (canvas) { canvas.width = e.contentRect.width; canvas.height = e.contentRect.height; }
        const svg = svgRef.current;
        if (svg) {
          svg.setAttribute('width', String(e.contentRect.width));
          svg.setAttribute('height', String(e.contentRect.height));
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const players = Object.values(game.players);

  function toScreen(pos: Position) {
    const { w, h } = sizeRef.current;
    return { sx: pos.x * w, sy: pos.y * h };
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#080c14' }}
    >
      {/* Grid canvas background */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* SVG for territories, paths, zones, players */}
      <svg
        ref={svgRef}
        style={{ position: 'absolute', inset: 0 }}
        width={sizeRef.current.w}
        height={sizeRef.current.h}
      >
        <defs>
          {players.map(p => (
            <filter key={`glow-${p.id}`} id={`glow-${p.id}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          <filter id="zone-glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        <GridLines w={sizeRef.current.w} h={sizeRef.current.h} />

        {/* Special zones */}
        {game.specialZones.filter(z => z.active).map(zone => (
          <ZoneCircle key={zone.id} zone={zone} w={sizeRef.current.w} h={sizeRef.current.h} />
        ))}

        {/* Territories */}
        {players.map(player => (
          <PlayerTerritory
            key={player.id}
            player={player}
            isMe={player.id === myPlayerId}
            w={sizeRef.current.w}
            h={sizeRef.current.h}
          />
        ))}

        {/* Active paths */}
        {players.map(player => player.pathState === 'ACTIVE' && player.path.length >= 2 ? (
          <PlayerPath
            key={`path-${player.id}`}
            player={player}
            isMe={player.id === myPlayerId}
            w={sizeRef.current.w}
            h={sizeRef.current.h}
          />
        ) : null)}

        {/* Player avatars */}
        {players.map(player => {
          const pos = player.id === myPlayerId ? localPos : player.position;
          const { sx, sy } = { sx: pos.x * sizeRef.current.w, sy: pos.y * sizeRef.current.h };
          const isMe = player.id === myPlayerId;

          return (
            <g key={`avatar-${player.id}`} filter={`url(#glow-${player.id})`}>
              <circle
                cx={sx} cy={sy} r={isMe ? 14 : 11}
                fill={player.color}
                opacity={player.active ? 1 : 0.3}
                stroke={isMe ? '#ffffff' : player.color}
                strokeWidth={isMe ? 2 : 1}
              />
              <text
                x={sx} y={sy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isMe ? 14 : 12}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {player.avatar}
              </text>
              {/* Username label */}
              <text
                x={sx} y={sy - 20}
                textAnchor="middle"
                fontSize={10}
                fill={player.color}
                fontWeight="700"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {player.username}
              </text>
            </g>
          );
        })}

        {/* Arena border */}
        <rect
          x={2} y={2}
          width={sizeRef.current.w - 4}
          height={sizeRef.current.h - 4}
          fill="none"
          stroke="#00e5ff22"
          strokeWidth={2}
          rx={4}
        />
      </svg>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function GridLines({ w, h }: { w: number; h: number }) {
  const lines: React.ReactNode[] = [];
  const step = 60;
  for (let x = step; x < w; x += step) {
    lines.push(<line key={`vl${x}`} x1={x} y1={0} x2={x} y2={h} stroke="rgba(255,255,255,0.025)" strokeWidth={1} />);
  }
  for (let y = step; y < h; y += step) {
    lines.push(<line key={`hl${y}`} x1={0} y1={y} x2={w} y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth={1} />);
  }
  return <>{lines}</>;
}

function ZoneCircle({ zone, w, h }: { zone: SpecialZone; w: number; h: number }) {
  const cx = zone.center.x * w;
  const cy = zone.center.y * h;
  const r  = zone.radius * Math.min(w, h);

  return (
    <g filter="url(#zone-glow)">
      <circle cx={cx} cy={cy} r={r} fill={zone.color + '18'} stroke={zone.color} strokeWidth={1.5} strokeDasharray="6 4">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
      </circle>
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize={12} fontWeight="700" fill={zone.color} style={{ userSelect: 'none' }}>
        {zone.label}
      </text>
    </g>
  );
}

function PlayerTerritory({ player, isMe, w, h }: {
  player: Player;
  isMe: boolean;
  toScreen?: (p: Position) => { sx: number; sy: number };
  polygonToSVGPoints?: (ring: Position[]) => string;
  w: number;
  h: number;
}) {
  if (!player.territory || player.territory.length === 0) return null;

  return (
    <g>
      {player.territory.map((ring, ri) => {
        if (!ring || ring.length < 3) return null;
        const pts = ring.map(p => `${p.x * w},${p.y * h}`).join(' ');
        return (
          <g key={ri}>
            <polygon
              points={pts}
              fill={player.color + '28'}
              stroke={player.color}
              strokeWidth={isMe ? 2 : 1.5}
              strokeLinejoin="round"
            />
            {/* Home territory indicator */}
            {ri === 0 && (
              <polygon
                points={pts}
                fill="none"
                stroke={player.color + '66'}
                strokeWidth={3}
                strokeDasharray="4 3"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

function PlayerPath({ player, isMe, w, h }: {
  player: Player;
  isMe: boolean;
  w: number;
  h: number;
}) {
  if (player.path.length < 2) return null;
  const pts = player.path.map(p => `${p.x * w},${p.y * h}`).join(' ');

  return (
    <g>
      {/* Trail dots */}
      {player.path.map((p, i) => (
        <circle
          key={i}
          cx={p.x * w} cy={p.y * h}
          r={isMe ? 3 : 2}
          fill={player.color}
          opacity={0.5 + (i / player.path.length) * 0.5}
        />
      ))}
      {/* Path line */}
      <polyline
        points={pts}
        fill="none"
        stroke={player.color}
        strokeWidth={isMe ? 2.5 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={isMe ? 'none' : '5 3'}
        opacity={0.85}
      >
        {isMe && (
          <animate attributeName="strokeDashoffset" from="0" to="-10" dur="0.4s" repeatCount="indefinite" />
        )}
      </polyline>
    </g>
  );
}
