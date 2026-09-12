import { useEffect } from 'react';
import type { Game } from '../types';

interface Props {
  game: Game | null;
  joinCode: string;
  myPlayerId: string | null;
  onStart: () => void;
  onBack: () => void;
  onSetPlayerId: (id: string) => void;
}

export default function LobbyScreen({ game, joinCode, myPlayerId, onStart, onBack, onSetPlayerId }: Props) {
  const players = game ? Object.values(game.players).filter(p => !p.isBot) : [];
  const code = game?.joinCode ?? joinCode;

  // Try to resolve own player id if not yet set
  useEffect(() => {
    if (!myPlayerId && game) {
      const me = Object.values(game.players)[0];
      if (me) onSetPlayerId(me.id);
    }
  }, [game, myPlayerId, onSetPlayerId]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #0d1424 0%, #05070d 70%)',
      gap: 0,
    }}>
      {/* Code */}
      <div style={{
        fontSize: 'clamp(36px, 8vw, 64px)',
        fontWeight: 900,
        letterSpacing: '0.18em',
        color: '#00e5ff',
        textShadow: '0 0 30px #00e5ff66',
        animation: 'glow 2s infinite',
        marginBottom: 6,
      }}>
        {code}
      </div>
      <div style={{ fontSize: 12, letterSpacing: '0.15em', color: '#6b7280', marginBottom: 32 }}>
        SHARE THIS CODE TO JOIN
      </div>

      {/* Player list */}
      <div style={{
        width: 320,
        background: '#0b0f1a',
        border: '1px solid #1e2638',
        borderRadius: 12,
        padding: '16px',
        marginBottom: 24,
        minHeight: 80,
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 12 }}>
          PLAYERS ({players.length})
        </div>
        {players.length === 0 && (
          <div style={{ color: '#374151', fontSize: 14, textAlign: 'center', padding: '8px 0' }}>
            Waiting for players to join...
          </div>
        )}
        {players.map(p => (
          <div key={p.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 8px',
            borderRadius: 8,
            background: p.id === myPlayerId ? 'rgba(0,229,255,0.06)' : 'transparent',
            border: p.id === myPlayerId ? '1px solid #00e5ff22' : '1px solid transparent',
            marginBottom: 4,
          }}>
            <span style={{ fontSize: 22 }}>{p.avatar}</span>
            <span style={{ flex: 1, fontWeight: 700, color: p.color }}>{p.username}</span>
            {p.id === myPlayerId && (
              <span style={{ fontSize: 11, color: '#6b7280' }}>YOU</span>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, textAlign: 'center' }}>
        {game?.teamMode ? '👥 Team Mode enabled' : '👤 Individual Mode'}
        {' · '}
        {Math.round((game?.duration ?? 420) / 60)} min
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, width: 320 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: '14px',
            fontSize: 14,
            background: '#111827',
            color: '#6b7280',
            border: '1px solid #1e2638',
            borderRadius: 10,
            fontWeight: 700,
          }}
        >
          ← BACK
        </button>
        <button
          onClick={onStart}
          disabled={players.length === 0}
          style={{
            flex: 2,
            padding: '14px',
            fontSize: 15,
            background: 'linear-gradient(135deg, #00e5ff, #00aacc)',
            color: '#001018',
            fontWeight: 800,
            letterSpacing: '0.08em',
            borderRadius: 10,
          }}
        >
          START GAME ▶
        </button>
      </div>
    </div>
  );
}
