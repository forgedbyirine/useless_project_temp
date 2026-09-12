import { useRef, useCallback, useEffect } from 'react';

interface Props {
  onMove: (dx: number, dy: number) => void;
}

const RADIUS = 60;
const KNOB   = 24;

export default function VirtualJoystick({ onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef      = useRef<HTMLDivElement>(null);
  const activeTouch  = useRef<number | null>(null);
  const centerRef    = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef       = useRef<number>(0);
  const dirRef       = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  useEffect(() => {
    const tick = () => {
      const { dx, dy } = dirRef.current;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        onMove(dx, dy);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onMove]);

  const updateKnob = useCallback((clientX: number, clientY: number) => {
    const { x: cx, y: cy } = centerRef.current;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, RADIUS);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${kx}px, ${ky}px)`;
    }

    dirRef.current = {
      dx: kx / RADIUS,
      dy: ky / RADIUS,
    };
  }, []);

  const resetKnob = useCallback(() => {
    if (knobRef.current) knobRef.current.style.transform = 'translate(0,0)';
    dirRef.current = { dx: 0, dy: 0 };
    activeTouch.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    activeTouch.current = touch.identifier;
    const rect = containerRef.current!.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateKnob(touch.clientX, touch.clientY);
  }, [updateKnob]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === activeTouch.current) {
        updateKnob(touch.clientX, touch.clientY);
      }
    }
  }, [updateKnob]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === activeTouch.current) {
        resetKnob();
      }
    }
  }, [resetKnob]);

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      style={{
        width:  RADIUS * 2 + KNOB,
        height: RADIUS * 2 + KNOB,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: KNOB * 2,
          height: KNOB * 2,
          borderRadius: '50%',
          background: 'rgba(0,229,255,0.7)',
          border: '2px solid #00e5ff',
          transition: 'none',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
