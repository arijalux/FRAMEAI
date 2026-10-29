import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export interface RotatingCard {
  src: string;
  alt: string;
}

interface RotatingCardsProps {
  cards: RotatingCard[];
  /** Card width in px before fitting to the container */
  cardWidth?: number;
  /** Width / height */
  aspectRatio?: number;
  /** Auto-rotation speed in degrees per second (negative turns the other way) */
  speed?: number;
  /** Ring tilt in degrees; negative looks down onto the ring */
  tilt?: number;
  onCardClick?: (index: number) => void;
}

const DRAG_THRESHOLD = 6;
const PERSPECTIVE = 1600;
const TO_RAD = Math.PI / 180;

/**
 * A ring of image cards rotating in 3D. Auto-rotates, can be dragged or flicked
 * (with inertia that eases back into the auto speed), pauses on hover, and turns a
 * card to the front on click. Built with CSS 3D transforms and a single rAF loop.
 */
export const RotatingCards: React.FC<RotatingCardsProps> = ({
  cards,
  cardWidth = 220,
  aspectRatio = 0.75,
  speed = 12,
  tilt = -8,
  onCardClick,
}) => {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [fit, setFit] = useState(1);
  // Set when a pointer gesture turned out to be a drag, so the click that follows is ignored
  const suppressClick = useRef(false);

  const count = Math.max(cards.length, 1);
  const step = 360 / count;
  const cardHeight = cardWidth / aspectRatio;
  // Radius that leaves a small gap between neighbouring cards around the ring
  const radius = Math.max((cardWidth * 1.15) / (2 * Math.sin(Math.PI / Math.max(count, 3))), cardWidth);

  // Mutable animation state lives in a ref so the loop never re-renders React
  const motionState = useRef({ angle: 0, velocity: 0, hover: false, drag: null as null | { x: number; angle: number; moved: boolean; lastX: number; lastT: number }, target: null as number | null });

  // Scale the whole ring down when the container is narrower than the ring
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Projected size: the front card is magnified by perspective, and the tilt spreads the ring vertically
      const frontScale = PERSPECTIVE / (PERSPECTIVE - radius);
      const ringWidth = (radius * 2 + cardWidth) * 1.02;
      const ringHeight = cardHeight * frontScale + 2 * radius * Math.sin(Math.abs(tilt) * TO_RAD);
      setFit(Math.min(1, (width * 0.98) / ringWidth, (height * 0.95) / ringHeight));
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [radius, cardWidth, cardHeight, tilt]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const auto = reduceMotion ? 0 : speed;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = motionState.current;

      if (s.target !== null) {
        // Ease toward a clicked card
        const diff = s.target - s.angle;
        s.angle += diff * Math.min(1, dt * 6);
        if (Math.abs(diff) < 0.05) s.target = null;
      } else if (!s.drag) {
        // Inertia blends back into the auto speed (or to a stop while hovered)
        const cruise = s.hover ? 0 : auto;
        s.velocity += (cruise - s.velocity) * Math.min(1, dt * 1.6);
        s.angle += s.velocity * dt;
      }

      const ring = ringRef.current;
      if (ring) ring.style.transform = `rotateX(${tilt}deg) rotateY(${s.angle}deg)`;

      // Dim and shrink cards as they turn away from the viewer
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const world = ((((i * step + s.angle) % 360) + 540) % 360) - 180;
        const facing = (Math.cos(world * TO_RAD) + 1) / 2; // 1 = front, 0 = back
        card.style.opacity = String(0.18 + facing * 0.82);
        card.style.filter = `saturate(${0.4 + facing * 0.6})`;
        card.style.pointerEvents = facing > 0.5 ? 'auto' : 'none';
      });

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, speed, step, tilt]);

  const onPointerDown = (e: React.PointerEvent) => {
    const s = motionState.current;
    suppressClick.current = false;
    s.target = null;
    s.drag = { x: e.clientX, angle: s.angle, moved: false, lastX: e.clientX, lastT: performance.now() };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = motionState.current;
    if (!s.drag) return;
    const dx = e.clientX - s.drag.x;
    if (!s.drag.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    if (!s.drag.moved) {
      s.drag.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    // Map horizontal pixels to degrees around the (scaled) ring
    const degPerPx = 180 / (Math.PI * radius * fit);
    s.angle = s.drag.angle + dx * degPerPx;
    const now = performance.now();
    const dtMs = Math.max(now - s.drag.lastT, 1);
    s.velocity = ((e.clientX - s.drag.lastX) * degPerPx * 1000) / dtMs;
    s.drag.lastX = e.clientX;
    s.drag.lastT = now;
  };

  const endDrag = () => {
    const s = motionState.current;
    if (!s.drag) return;
    // Keep flick momentum within sensible bounds
    s.velocity = Math.max(-600, Math.min(600, s.velocity));
    if (s.drag.moved) suppressClick.current = true;
    s.drag = null;
  };

  const turnToFront = (index: number) => {
    const s = motionState.current;
    const wanted = -index * step;
    // Shortest way round from the current angle
    s.target = wanted + 360 * Math.round((s.angle - wanted) / 360);
    s.velocity = 0;
  };

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full flex items-center justify-center select-none touch-pan-y cursor-grab active:cursor-grabbing"
      style={{ perspective: PERSPECTIVE }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') motionState.current.hover = true;
      }}
      onPointerLeave={(e) => {
        endDrag();
        if (e.pointerType === 'mouse') motionState.current.hover = false;
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Koleksi frame"
    >
      {/* Lift the ring by its tilt offset so the visible cards sit centred in the box */}
      <div
        style={{
          transform: `translateY(${-radius * Math.sin(Math.abs(tilt) * TO_RAD) * fit}px) scale(${fit})`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          ref={ringRef}
          className="relative"
          style={{ width: cardWidth, height: cardHeight, transformStyle: 'preserve-3d' }}
        >
          {cards.map((card, i) => (
            <button
              key={card.src + i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              type="button"
              aria-label={card.alt}
              onClick={(e) => {
                // A drag that ends over a card shouldn't count as a click
                if (suppressClick.current) return;
                e.stopPropagation();
                turnToFront(i);
                onCardClick?.(i);
              }}
              className="absolute inset-0 rounded-[24px] overflow-hidden bg-soft shadow-card focus-visible:outline-2 focus-visible:outline-ink"
              style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px)` }}
            >
              <img src={card.src} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
