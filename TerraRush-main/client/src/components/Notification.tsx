interface Props {
  text: string;
  color?: string;
}

export default function Notification({ text, color = '#00e5ff' }: Props) {
  return (
    <div style={{
      position: 'fixed',
      top: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(5,7,13,0.95)',
      border: `1px solid ${color}`,
      color,
      padding: '12px 28px',
      borderRadius: 10,
      fontWeight: 700,
      fontSize: 15,
      letterSpacing: '0.05em',
      zIndex: 9999,
      animation: 'slideIn 0.3s ease',
      pointerEvents: 'none',
      maxWidth: '90vw',
      textAlign: 'center',
      boxShadow: `0 0 20px ${color}44`,
    }}>
      {text}
    </div>
  );
}
