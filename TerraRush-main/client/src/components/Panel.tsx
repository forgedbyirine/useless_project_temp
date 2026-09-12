interface Props {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
  width?: number;
}

export default function Panel({ title, onBack, children, width = 340 }: Props) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #0d1424 0%, #05070d 70%)',
    }}>
      <div style={{
        width: Math.min(width, window.innerWidth - 32),
        background: '#0b0f1a',
        border: '1px solid #1e2638',
        borderRadius: 14,
        padding: '28px 24px',
        animation: 'fadeIn 0.3s ease',
      }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: 13,
              padding: '4px 0',
              marginBottom: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back
          </button>
        )}
        <h1 style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '0.1em',
          marginBottom: 20,
          color: '#00e5ff',
        }}>
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
