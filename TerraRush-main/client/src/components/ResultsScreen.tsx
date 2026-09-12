import type { Game, Player } from '../types';

interface Props {
  game: Game | null;
  myPlayerId: string | null;
  onPlayAgain: () => void;
}

export default function ResultsScreen({ game, myPlayerId, onPlayAgain }: Props) {
  if (!game) return null;

  const players = Object.values(game.players).sort((a, b) => b.score - a.score);
  const winner  = players[0];
  const isWinner = winner?.id === myPlayerId;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #0d1424 0%, #05070d 70%)',
      padding: 20,
      gap: 0,
      overflowY: 'auto',
    }}>
      {/* Trophy */}
      <div style={{ fontSize: 72, animation: 'fadeIn 0.5s ease', marginBottom: 8 }}>🏆</div>

      {/* Winner */}
      {winner && (
        <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeIn 0.6s ease' }}>
          <div style={{ fontSize: 13, letterSpacing: '0.2em', color: '#6b7280', marginBottom: 6 }}>
            WINNER
          </div>
          <div style={{
            fontSize: 'clamp(28px, 6vw, 52px)',
            fontWeight: 900,
            color: winner.color,
            textShadow: `0 0 30px ${winner.color}`,
            letterSpacing: '0.05em',
          }}>
            {winner.avatar} {winner.username}
          </div>
          {isWinner && (
            <div style={{ fontSize: 14, color: '#ffd43b', marginTop: 6, animation: 'pulse 1s infinite' }}>
              ★ THAT'S YOU! ★
            </div>
          )}
          <div style={{ fontSize: 16, color: '#e8eaf0', marginTop: 8 }}>
            {(winner.territoryPercentage * 100).toFixed(1)}% territory · {winner.score} pts
          </div>
        </div>
      )}

      {/* Rankings table */}
      <div style={{
        width: Math.min(500, window.innerWidth - 32),
        background: '#0b0f1a',
        border: '1px solid #1e2638',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 28,
        animation: 'fadeIn 0.8s ease',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2638' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#6b7280' }}>FINAL STANDINGS</span>
        </div>
        {players.map((p, i) => (
          <div key={p.id} style={{
            display: 'grid',
            gridTemplateColumns: '40px 32px 1fr 60px 60px 60px',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderBottom: '1px solid #111827',
            background: p.id === myPlayerId ? `${p.color}0f` : 'transparent',
          }}>
            <span style={{ fontSize: 18, textAlign: 'center' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
            </span>
            <span style={{ fontSize: 20, textAlign: 'center' }}>{p.avatar}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.username}</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{(p.territoryPercentage * 100).toFixed(1)}% territory</div>
            </div>
            <StatCell label="Score"    value={p.score} color="#e8eaf0" />
            <StatCell label="Captures" value={p.captures} color="#7cff4f" />
            <StatCell label="Cuts"     value={p.interruptedPaths} color="#ff3b6b" />
          </div>
        ))}
      </div>

      {/* Team results */}
      {game.teamMode && Object.values(game.teams).length > 0 && (
        <div style={{
          width: Math.min(500, window.innerWidth - 32),
          marginBottom: 24,
          animation: 'fadeIn 1s ease',
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#6b7280', marginBottom: 10 }}>
            TEAM STANDINGS
          </div>
          {Object.values(game.teams).sort((a, b) => b.score - a.score).map((team, i) => (
            <div key={team.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              marginBottom: 6,
              background: '#0b0f1a',
              border: `1px solid ${team.color}44`,
              borderRadius: 8,
            }}>
              <span style={{ fontSize: 16 }}>{i === 0 ? '🏆' : `#${i + 1}`}</span>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: team.color, flexShrink: 0,
              }} />
              <span style={{ flex: 1, fontWeight: 700, color: team.color }}>{team.name}</span>
              <span style={{ color: '#e8eaf0', fontWeight: 700 }}>{team.score} pts</span>
              <span style={{ color: '#6b7280', fontSize: 12 }}>
                {(team.territoryPercentage * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onPlayAgain}
        style={{
          padding: '16px 48px',
          fontSize: 16,
          background: 'linear-gradient(135deg, #00e5ff, #00aacc)',
          color: '#001018',
          fontWeight: 800,
          letterSpacing: '0.1em',
          borderRadius: 10,
          animation: 'fadeIn 1.2s ease',
        }}
      >
        PLAY AGAIN
      </button>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: '0.06em' }}>{label.toUpperCase()}</div>
    </div>
  );
}
