import { useState } from 'react';
import Panel from './Panel';

interface Props {
  onBack: () => void;
  onCreate: (opts: { duration: number; teamMode: boolean }) => void;
}

export default function CreateScreen({ onBack, onCreate }: Props) {
  const [duration, setDuration] = useState(420);
  const [teamMode, setTeamMode] = useState(false);

  return (
    <Panel title="CREATE GAME" onBack={onBack}>
      <label style={labelStyle}>Game Duration</label>
      <select
        value={duration}
        onChange={e => setDuration(Number(e.target.value))}
        style={inputStyle}
      >
        <option value={180}>3 minutes (Quick)</option>
        <option value={300}>5 minutes</option>
        <option value={420}>7 minutes (Standard)</option>
        <option value={600}>10 minutes (Extended)</option>
      </select>

      <label style={labelStyle}>Game Mode</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <ModeBtn active={!teamMode} onClick={() => setTeamMode(false)}>
          👤 Individual
        </ModeBtn>
        <ModeBtn active={teamMode} onClick={() => setTeamMode(true)}>
          👥 Team Mode
        </ModeBtn>
      </div>

      <div style={{ marginTop: 8, color: '#6b7280', fontSize: 13, textAlign: 'center' }}>
        {teamMode
          ? 'Players split into colored teams. Teammates share territory.'
          : 'Every player competes independently for dominance.'}
      </div>

      <button
        onClick={() => onCreate({ duration, teamMode })}
        style={{
          marginTop: 24,
          width: '100%',
          padding: '16px',
          fontSize: 16,
          background: 'linear-gradient(135deg, #00e5ff, #00aacc)',
          color: '#001018',
          fontWeight: 800,
          letterSpacing: '0.08em',
          borderRadius: 10,
        }}
      >
        CREATE GAME →
      </button>
    </Panel>
  );
}

function ModeBtn({ children, active, onClick }: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 8px',
        fontSize: 14,
        background: active ? 'rgba(0,229,255,0.15)' : 'rgba(30,38,56,0.6)',
        color: active ? '#00e5ff' : '#6b7280',
        border: active ? '1px solid #00e5ff44' : '1px solid #1e2638',
        borderRadius: 8,
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  letterSpacing: '0.1em',
  color: '#6b7280',
  marginBottom: 6,
  marginTop: 16,
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 15,
};
