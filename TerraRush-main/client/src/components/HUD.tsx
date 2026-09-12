import type { Game, Player } from '../types';

interface Props {
  game: Game;
  myPlayer: Player | null;
}

const PHASE_COLORS: Record<string, string> = {
  EXPANSION:        '#00e5ff',
  BATTLE:           '#ff3b6b',
  CHAOS:            '#ffd43b',
  FINAL_DOMINATION: '#b86bff',
  COUNTDOWN:        '#7cff4f',
  FINISHED:         '#6b7280',
};

function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function HUD({ game, myPlayer }: Props) {
  const remaining = game.endTime ? game.endTime - Date.now() : 0;
  const phaseRemaining = game.phaseEndTime ? game.phaseEndTime - Date.now() : 0;
  const phaseColor = PHASE_COLORS[game.currentPhase] ?? '#00e5ff';

  return (
    <header style={{
      height: 56,
      background: 'rgba(5,7,13,0.95)',
      borderBottom: '1px solid #1e2638',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 16,
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Logo */}
      <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '0.1em', color: '#00e5ff' }}>
        TERRARUSH
      </span>

      {/* Phase badge */}
      <div style={{
        padding: '4px 12px',
        borderRadius: 6,
        background: `${phaseColor}22`,
        border: `1px solid ${phaseColor}44`,
        color: phaseColor,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        animation: game.currentPhase === 'FINAL_DOMINATION' ? 'pulse 1s infinite' : 'none',
      }}>
        {game.currentPhase.replace('_', ' ')}
      </div>

      {/* Phase timer */}
      {phaseRemaining > 0 && (
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          phase {formatTime(phaseRemaining)}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* My stats */}
      {myPlayer && (
        <>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.08em' }}>TERRITORY</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: myPlayer.color }}>
              {(myPlayer.territoryPercentage * 100).toFixed(1)}%
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.08em' }}>SCORE</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{myPlayer.score}</div>
          </div>
          {myPlayer.speedBoost && (
            <div style={{ fontSize: 11, color: '#00aaff', fontWeight: 700, animation: 'pulse 0.5s infinite' }}>
              ⚡ SPEED
            </div>
          )}
        </>
      )}

      {/* Global timer */}
      <div style={{
        fontSize: 20,
        fontWeight: 900,
        color: remaining < 30000 ? '#ff3b6b' : '#e8eaf0',
        letterSpacing: '0.04em',
        minWidth: 56,
        textAlign: 'right',
        animation: remaining < 30000 ? 'pulse 1s infinite' : 'none',
      }}>
        {formatTime(remaining)}
      </div>

      {/* Paused */}
      {game.paused && (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#ffd43b', letterSpacing: '0.1em' }}>
          ⏸ PAUSED
        </div>
      )}
    </header>
  );
}
