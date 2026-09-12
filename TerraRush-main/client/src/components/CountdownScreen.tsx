interface Props {
  count: number;
}

export default function CountdownScreen({ count }: Props) {
  const label = count <= 0 ? 'GO!' : String(count);
  const color = count <= 0 ? '#7cff4f' : '#00e5ff';

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#05070d',
    }}>
      <div style={{
        fontSize: 'clamp(100px, 25vw, 240px)',
        fontWeight: 900,
        color,
        textShadow: `0 0 80px ${color}`,
        animation: 'countPop 0.4s ease',
        lineHeight: 1,
      }}>
        {label}
      </div>
      {count > 0 && (
        <div style={{
          fontSize: 18,
          letterSpacing: '0.3em',
          color: '#6b7280',
          marginTop: 20,
        }}>
          GET READY
        </div>
      )}
    </div>
  );
}
