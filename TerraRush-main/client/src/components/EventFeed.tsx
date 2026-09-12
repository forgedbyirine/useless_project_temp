import type { GameEvent } from '../types';

interface Props {
  events: GameEvent[];
}

const EVENT_COLORS: Record<string, string> = {
  CAPTURE:      '#7cff4f',
  INTERRUPT:    '#ff3b6b',
  DEFENSE:      '#00e5ff',
  PHASE_CHANGE: '#ffd43b',
  ZONE_SPAWN:   '#b86bff',
  GAME_START:   '#00e5ff',
  GAME_END:     '#ffd43b',
};

export default function EventFeed({ events }: Props) {
  const recent = events.slice(0, 5);

  return (
    <div style={{
      position: 'absolute',
      bottom: 12,
      left: 12,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 6,
      pointerEvents: 'none',
      zIndex: 5,
      maxWidth: 320,
    }}>
      {recent.map(ev => (
        <div
          key={ev.id}
          style={{
            background: 'rgba(5,7,13,0.88)',
            border: `1px solid ${EVENT_COLORS[ev.type] ?? '#1e2638'}44`,
            color: EVENT_COLORS[ev.type] ?? '#e8eaf0',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            animation: 'slideIn 0.3s ease',
            backdropFilter: 'blur(4px)',
          }}
        >
          {ev.message}
        </div>
      ))}
    </div>
  );
}
