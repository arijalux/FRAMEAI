import React from 'react';

// Line drawings for the six "Cara kami mewujudkannya" points, one per entry and in the same order.
// All share a 240×140 canvas, ink lines from currentColor and a sage accent, with the glasses as motif.
const ACCENT = 'var(--color-sage)';

const Glasses: React.FC<{ x: number; y: number; w?: number; accent?: boolean }> = ({ x, y, w = 72, accent }) => {
  const s = w / 72;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeWidth={2 / s}>
      <rect x="0" y="0" width="30" height="22" rx="7" fill={accent ? ACCENT : 'none'} fillOpacity={accent ? 0.18 : undefined} />
      <rect x="42" y="0" width="30" height="22" rx="7" fill={accent ? ACCENT : 'none'} fillOpacity={accent ? 0.18 : undefined} />
      <path d="M30 8c3-3 9-3 12 0" />
    </g>
  );
};

const Canvas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    viewBox="0 0 240 140"
    aria-hidden="true"
    className="w-full h-full text-ink"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

/** Celah energi: a delivery truck going back, with fuel and material lost along the way */
const EnergyGap = () => (
  <Canvas>
    <path d="M28 108h184" strokeOpacity=".3" />
    <path d="M158 62h-78v44h78z" />
    <path d="M80 72H56L42 88v18h38" />
    <path d="M58 80v10H44" />
    <circle cx="60" cy="108" r="9" fill="var(--color-canvas, #fff)" />
    <circle cx="136" cy="108" r="9" fill="var(--color-canvas, #fff)" />
    <Glasses x={96} y={74} w={48} />
    <path d="M186 50c-14-20-46-26-68-12" stroke={ACCENT} />
    <path d="M124 26l-8 13 15 2" stroke={ACCENT} />
    <path d="M186 74l-9 13h9l-9 13" stroke={ACCENT} />
  </Canvas>
);

/** Model bisnis: an order for a frame becoming income, with the 3D scan beside it */
const BusinessModel = () => (
  <Canvas>
    <rect x="30" y="36" width="82" height="68" rx="10" />
    <Glasses x={43} y={50} w={56} />
    <path d="M44 82h30M44 92h18" strokeOpacity=".5" />
    <path d="M122 70h20" stroke={ACCENT} />
    <path d="M136 62l8 8-8 8" stroke={ACCENT} />
    <circle cx="178" cy="62" r="26" fill={ACCENT} fillOpacity=".18" stroke={ACCENT} />
    <text x="178" y="68" textAnchor="middle" fontSize="17" fontFamily="inherit" fill={ACCENT} stroke="none">
      Rp
    </text>
    <path d="M178 94l11 6v13l-11 6-11-6v-13zM167 100l11 6 11-6M178 106v13" strokeWidth="1.5" />
  </Canvas>
);

/** Efisiensi: the frame measured against a ruler before anything is made */
const Efficiency = () => (
  <Canvas>
    <Glasses x={64} y={32} w={112} accent />
    <path d="M64 76h112" stroke={ACCENT} strokeDasharray="4 4" />
    <rect x="36" y="88" width="168" height="24" rx="4" />
    {[52, 68, 84, 100, 116, 132, 148, 164, 180].map((x, i) => (
      <path key={x} d={`M${x} 88v${i % 2 ? 7 : 12}`} strokeWidth="1.5" />
    ))}
    <circle cx="196" cy="42" r="12" />
    <path d="M190 42l4 4 8-8" stroke={ACCENT} />
  </Canvas>
);

/** Dampak lokal: a map pin in Semarang over a workshop, where the frames are made */
const LocalImpact = () => (
  <Canvas>
    <path d="M26 112h188" strokeOpacity=".3" />
    <path d="M44 112V70l28-18 28 18v42" />
    <path d="M62 112V88h20v24" />
    <path d="M122 112V78h72v34" />
    <path d="M122 78l12-14h48l12 14" />
    <Glasses x={136} y={88} w={44} />
    <path d="M72 50C60 36 53 29 53 22a19 19 0 0 1 38 0c0 7-7 14-19 28z" fill={ACCENT} fillOpacity=".18" stroke={ACCENT} />
    <circle cx="72" cy="22" r="6" stroke={ACCENT} />
  </Canvas>
);

/** Digitalisasi: a phone scanning a face in the browser, sending a file to the cutter */
const Digital = () => (
  <Canvas>
    <rect x="42" y="14" width="66" height="112" rx="12" />
    <path d="M68 24h14" />
    <ellipse cx="75" cy="72" rx="20" ry="27" />
    <Glasses x={59} y={62} w={32} accent />
    <path d="M50 46v-8h8M100 46v-8h-8M50 98v8h8M100 98v8h-8" stroke={ACCENT} />
    <path d="M122 70h22" stroke={ACCENT} strokeDasharray="4 4" />
    <path d="M138 62l8 8-8 8" stroke={ACCENT} />
    <path d="M158 40h28l14 14v46h-42z" />
    <path d="M186 40v14h14" />
    <Glasses x={164} y={68} w={30} />
  </Canvas>
);

/** Dirancang bersama: two people working out one frame on the same sketch */
const CoDesign = () => (
  <Canvas>
    <circle cx="48" cy="48" r="13" />
    <path d="M24 112c0-24 10-38 24-38s24 14 24 38" />
    <circle cx="192" cy="48" r="13" />
    <path d="M168 112c0-24 10-38 24-38s24 14 24 38" />
    <rect x="84" y="28" width="72" height="84" rx="6" />
    <Glasses x={96} y={46} w={48} accent />
    <path d="M96 76h48M96 88h30" strokeOpacity=".5" />
    <path d="M128 108l18-22 7 6-18 22-9 3z" fill="var(--color-canvas, #fff)" stroke={ACCENT} />
  </Canvas>
);

export const PRINCIPLE_ILLUSTRATIONS: React.FC[] = [EnergyGap, BusinessModel, Efficiency, LocalImpact, Digital, CoDesign];
