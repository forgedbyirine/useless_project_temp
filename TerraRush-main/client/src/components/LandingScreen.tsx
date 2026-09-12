interface Props {
  onCreate: () => void;
  onJoin: () => void;
  onDemo: () => void;
  onAdmin: () => void;
  onProjector: () => void;
}

export default function LandingScreen({ onCreate, onJoin, onDemo, onAdmin, onProjector }: Props) {
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
      {/* Background grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ animation: 'fadeIn 0.6s ease', textAlign: 'center', marginBottom: 12 }}>
        <div style={{
          fontSize: 'clamp(42px, 10vw, 100px)',
          fontWeight: 900,
          letterSpacing: '0.12em',
          background: 'linear-gradient(135deg, #00e5ff, #b86bff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: 'none',
          lineHeight: 1,
        }}>
          TERRARUSH
        </div>
        <div style={{
          fontSize: 13,
          letterSpacing: '0.35em',
          color: '#6b7280',
          marginTop: 10,
          textTransform: 'uppercase',
        }}>
          CLAIM · ATTACK · DOMINATE
        </div>
      </div>

      {/* Menu */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 44,
        width: 260,
        animation: 'fadeIn 0.8s ease',
      }}>
        <Btn primary onClick={onCreate}>🗺️ CREATE GAME</Btn>
        <Btn onClick={onJoin}>🎮 JOIN GAME</Btn>
        <Btn onClick={onDemo}>🤖 DEMO MODE</Btn>
      </div>

      {/* Bottom row */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginTop: 20,
        animation: 'fadeIn 1s ease',
      }}>
        <Btn small onClick={onAdmin}>⚙️ ADMIN</Btn>
        <Btn small onClick={onProjector}>📺 PROJECTOR</Btn>
      </div>

      <div style={{ position: 'absolute', bottom: 20, color: '#374151', fontSize: 12 }}>
        TerraRush v1.0 · Multiplayer Territory Conquest
      </div>
    </div>
  );
}

function Btn({ children, onClick, primary, small }: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: small ? 'auto' : '100%',
        padding: small ? '10px 20px' : '16px',
        fontSize: small ? 13 : 15,
        background: primary ? 'linear-gradient(135deg, #00e5ff, #00aacc)' : 'rgba(30,38,56,0.9)',
        color: primary ? '#001018' : '#e8eaf0',
        border: primary ? 'none' : '1px solid #1e2638',
        letterSpacing: '0.08em',
      }}
    >
      {children}
    </button>
  );
}
