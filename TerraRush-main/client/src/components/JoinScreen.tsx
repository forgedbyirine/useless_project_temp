import { useState, useEffect } from 'react';
import Panel from './Panel';
import type { Game } from '../types';

const AVATARS = ['🦊', '🐺', '🦁', '🐯', '🦅', '🐉', '🦄', '🐻', '🐼', '🦋', '🐸', '🐧'];

interface Props {
  onBack: () => void;
  onJoin: (code: string, username: string, avatar: string) => void;
  onSetPlayerId: (id: string) => void;
  game: Game | null;
}

export default function JoinScreen({ onBack, onJoin, onSetPlayerId, game }: Props) {
  const [code, setCode]         = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar]     = useState('🦊');

  // When game state arrives after joining, infer our player id
  useEffect(() => {
    if (!game || !username) return;
    const found = Object.values(game.players).find(
      p => p.username.toLowerCase() === username.toLowerCase()
    );
    if (found) onSetPlayerId(found.id);
  }, [game, username, onSetPlayerId]);

  const canJoin = code.length >= 4 && username.trim().length >= 1;

  return (
    <Panel title="JOIN GAME" onBack={onBack}>
      <label style={lbl}>Game Code</label>
      <input
        placeholder="ENTER CODE"
        value={code}
        maxLength={8}
        onChange={e => setCode(e.target.value.toUpperCase())}
        style={{ ...inp, fontSize: 24, fontWeight: 800, letterSpacing: '0.2em', textAlign: 'center' }}
      />

      <label style={lbl}>Username</label>
      <input
        placeholder="Your name"
        value={username}
        maxLength={18}
        onChange={e => setUsername(e.target.value)}
        style={inp}
      />

      <label style={lbl}>Avatar</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        {AVATARS.map(av => (
          <button
            key={av}
            onClick={() => setAvatar(av)}
            style={{
              width: 44,
              height: 44,
              fontSize: 22,
              background: avatar === av ? 'rgba(0,229,255,0.15)' : 'rgba(30,38,56,0.5)',
              border: avatar === av ? '1px solid #00e5ff' : '1px solid #1e2638',
              borderRadius: 8,
            }}
          >
            {av}
          </button>
        ))}
      </div>

      <button
        disabled={!canJoin}
        onClick={() => onJoin(code, username.trim(), avatar)}
        style={{
          marginTop: 20,
          width: '100%',
          padding: '16px',
          fontSize: 15,
          background: canJoin
            ? 'linear-gradient(135deg, #00e5ff, #00aacc)'
            : '#1e2638',
          color: canJoin ? '#001018' : '#6b7280',
          fontWeight: 800,
          letterSpacing: '0.08em',
          borderRadius: 10,
        }}
      >
        JOIN GAME →
      </button>
    </Panel>
  );
}

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  letterSpacing: '0.12em',
  color: '#6b7280',
  marginBottom: 6,
  marginTop: 16,
  textTransform: 'uppercase',
};
const inp: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 15,
};
