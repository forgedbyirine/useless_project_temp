import type { Player, Team } from '../types';

interface Props {
  players: Player[];
  teams: Record<string, Team>;
  teamMode: boolean;
  myPlayerId: string | null;
}

export default function Leaderboard({ players, teams, teamMode, myPlayerId }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: '#0b0f1a',
      borderLeft: '1px solid #1e2638',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e2638' }}>
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#6b7280' }}>LEADERBOARD</span>
      </div>

      {/* Team rankings */}
      {teamMode && Object.values(teams).length > 0 && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #111827' }}>
          {Object.values(teams)
            .sort((a, b) => b.score - a.score)
            .map((team, i) => (
              <div key={team.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 4px',
              }}>
                <span style={{ width: 16, fontSize: 11, color: '#6b7280' }}>#{i + 1}</span>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: team.color, flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: 12, color: team.color, fontWeight: 700 }}>{team.name}</span>
                <span style={{ fontSize: 11, color: '#e8eaf0' }}>{(team.territoryPercentage * 100).toFixed(0)}%</span>
              </div>
            ))}
        </div>
      )}

      {/* Player rankings */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {sorted.map((player, i) => {
          const isMe = player.id === myPlayerId;
          return (
            <div key={player.id} style={{
              display: 'grid',
              gridTemplateColumns: '24px 28px 1fr auto',
              alignItems: 'center',
              gap: 6,
              padding: '7px 10px',
              background: isMe ? `${player.color}11` : 'transparent',
              borderLeft: isMe ? `2px solid ${player.color}` : '2px solid transparent',
            }}>
              <span style={{ fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <span style={{ fontSize: 18, textAlign: 'center' }}>{player.avatar}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: player.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {player.username}{isMe ? ' ★' : ''}
                </div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>
                  {(player.territoryPercentage * 100).toFixed(1)}%
                  {player.pathState === 'ACTIVE' && <span style={{ color: '#ffd43b', marginLeft: 4 }}>●</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e8eaf0', textAlign: 'right' }}>
                {player.score}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats for hovered/me */}
      {sorted.find(p => p.id === myPlayerId) && (() => {
        const me = sorted.find(p => p.id === myPlayerId)!;
        return (
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid #1e2638',
            fontSize: 11,
            color: '#6b7280',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Captures</span><span style={{ color: '#7cff4f' }}>{me.captures}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Defenses</span><span style={{ color: '#00e5ff' }}>{me.defenses}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Paths cut</span><span style={{ color: '#ff3b6b' }}>{me.interruptedPaths}</span>
            </div>
          </div>
        );
      })()}
    </aside>
  );
}
