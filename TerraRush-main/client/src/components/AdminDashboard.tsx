import { useState } from 'react';
import type { Game } from '../types';

interface Props {
  game: Game | null;
  onBack: () => void;
  onCreateGame: (opts: { duration: number; teamMode: boolean }) => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onSwitchProjector: () => void;
}

export default function AdminDashboard({
  game, onBack, onCreateGame, onPause, onResume, onEnd, onSwitchProjector
}: Props) {
  const [duration, setDuration] = useState(420);
  const [teamMode, setTeamMode] = useState(false);

  const players = game ? Object.values(game.players) : [];
  const active  = players.filter(p => p.active);

  function formatTime(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#05070d',
      overflowY: 'auto',
      padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={onBack} style={ghostBtn}>← Back</button>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.1em', color: '#00e5ff' }}>
          ⚙️ ADMIN DASHBOARD
        </h1>
        <button onClick={onSwitchProjector} style={{ ...ghostBtn, marginLeft: 'auto' }}>
          📺 Projector View
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Create game panel */}
        <Card title="CREATE GAME">
          <label style={lbl}>Duration</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={sel}>
            <option value={180}>3 min (Quick)</option>
            <option value={300}>5 min</option>
            <option value={420}>7 min (Standard)</option>
            <option value={600}>10 min</option>
          </select>
          <label style={lbl}>Mode</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <ModeBtn active={!teamMode} onClick={() => setTeamMode(false)}>Individual</ModeBtn>
            <ModeBtn active={teamMode}  onClick={() => setTeamMode(true)}>Team Mode</ModeBtn>
          </div>
          <button onClick={() => onCreateGame({ duration, teamMode })} style={primaryBtn}>
            CREATE GAME
          </button>
        </Card>

        {/* Game controls */}
        {game && (
          <Card title="GAME CONTROLS">
            <StatRow label="Status"    value={game.status} />
            <StatRow label="Phase"     value={game.currentPhase} />
            <StatRow label="Join Code" value={game.joinCode} highlight />
            <StatRow label="Players"   value={`${active.length} active`} />
            {game.endTime && (
              <StatRow label="Time Left" value={formatTime(game.endTime - Date.now())} />
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {!game.paused ? (
                <button onClick={onPause} style={{ ...actionBtn, background: '#ffd43b', color: '#001018' }}>
                  ⏸ Pause
                </button>
              ) : (
                <button onClick={onResume} style={{ ...actionBtn, background: '#7cff4f', color: '#001018' }}>
                  ▶ Resume
                </button>
              )}
              <button onClick={onEnd} style={{ ...actionBtn, background: '#ff3b6b', color: '#fff' }}>
                ⏹ End Game
              </button>
            </div>
          </Card>
        )}

        {/* Live player monitor */}
        {game && (
          <Card title={`PLAYERS (${players.length})`}>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {Object.values(game.players).sort((a, b) => b.score - a.score).map(p => (
                <div key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 4px',
                  borderBottom: '1px solid #111827',
                }}>
                  <span style={{ fontSize: 16 }}>{p.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.username}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>
                      {p.isBot ? `🤖 ${p.botType}` : '👤 Human'}
                      {p.suspiciousFlags > 0 && <span style={{ color: '#ff3b6b', marginLeft: 4 }}>⚠️ {p.suspiciousFlags}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#e8eaf0' }}>{p.score}pts</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{(p.territoryPercentage * 100).toFixed(1)}%</div>
                  </div>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: p.active ? '#7cff4f' : '#374151',
                    flexShrink: 0,
                  }} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Special zones */}
        {game && (
          <Card title="SPECIAL ZONES">
            {game.specialZones.filter(z => z.active).length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: 13 }}>No active zones</div>
            ) : (
              game.specialZones.filter(z => z.active).map(z => (
                <div key={z.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 4px',
                  borderBottom: '1px solid #111827',
                }}>
                  <span style={{ fontSize: 16 }}>{z.label.split(' ')[0]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: z.color }}>{z.type}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>
                      {Math.max(0, Math.round((z.expiresAt - Date.now()) / 1000))}s remaining
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>
        )}

        {/* Suspicious activity */}
        {game && (
          <Card title="ANTI-CHEAT LOG">
            {players.filter(p => p.suspiciousFlags > 0).length === 0 ? (
              <div style={{ color: '#7cff4f', fontSize: 13 }}>✓ No suspicious activity</div>
            ) : (
              players.filter(p => p.suspiciousFlags > 0).map(p => (
                <div key={p.id} style={{ color: '#ff3b6b', fontSize: 12, marginBottom: 6 }}>
                  ⚠️ {p.username}: {p.suspiciousFlags} flag(s)
                </div>
              ))
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#0b0f1a',
      border: '1px solid #1e2638',
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#6b7280', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 700, color: highlight ? '#00e5ff' : '#e8eaf0' }}>{value}</span>
    </div>
  );
}

function ModeBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px', fontSize: 13,
      background: active ? 'rgba(0,229,255,0.12)' : '#111827',
      color: active ? '#00e5ff' : '#6b7280',
      border: active ? '1px solid #00e5ff33' : '1px solid #1e2638',
      borderRadius: 6, fontWeight: 700,
    }}>{children}</button>
  );
}

const ghostBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #1e2638',
  color: '#6b7280', padding: '7px 14px', fontSize: 13,
  borderRadius: 8, fontWeight: 600, cursor: 'pointer',
};

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '12px', fontSize: 14,
  background: 'linear-gradient(135deg, #00e5ff, #00aacc)',
  color: '#001018', fontWeight: 800, letterSpacing: '0.05em', borderRadius: 8,
};

const actionBtn: React.CSSProperties = {
  flex: 1, padding: '10px 12px', fontSize: 13,
  fontWeight: 700, letterSpacing: '0.05em', borderRadius: 8,
};

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, letterSpacing: '0.1em',
  color: '#6b7280', marginBottom: 6, marginTop: 10, textTransform: 'uppercase',
};

const sel: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14, marginBottom: 4,
};
