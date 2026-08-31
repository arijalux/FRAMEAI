import React from 'react';

interface ARMarkerTargetProps {
  sizeMm?: number; // default 100
  pixelSize?: number; // display size in px, defaults to 240
  showRuler?: boolean;
  className?: string;
  id?: string;
}

/**
 * FRAMEAI Calibrated 100mm x 100mm Optical AR Reference Target.
 * Used for real-world computer vision marker tracking and 1:1 scale anchoring.
 */
export const ARMarkerTarget: React.FC<ARMarkerTargetProps> = ({
  sizeMm = 100,
  pixelSize = 240,
  showRuler = true,
  className = '',
  id = 'frameai-ar-marker-svg',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none bg-white p-3 rounded-2xl shadow-md border border-neutral-200 ${className}`}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
      }}
      id={id}
    >
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer White Card Background */}
        <rect x="0" y="0" width="400" height="400" fill="#FFFFFF" />

        {/* Outer Heavy Black Square Fiducial Border */}
        <rect
          x="30"
          y="30"
          width="340"
          height="340"
          fill="none"
          stroke="#111111"
          strokeWidth="32"
          rx="4"
        />

        {/* Inner White Separation Zone */}
        <rect
          x="62"
          y="62"
          width="276"
          height="276"
          fill="#FFFFFF"
        />

        {/* Corner Optical Alignment Markers */}
        <rect x="70" y="70" width="44" height="44" fill="#111111" rx="2" />
        <rect x="286" y="70" width="44" height="44" fill="#111111" rx="2" />
        <rect x="70" y="286" width="44" height="44" fill="#111111" rx="2" />
        <circle cx="308" cy="308" r="22" fill="#111111" />

        {/* Inner Concentric Target Rings */}
        <circle cx="200" cy="200" r="85" fill="none" stroke="#111111" strokeWidth="10" />
        <circle cx="200" cy="200" r="50" fill="none" stroke="#EA580C" strokeWidth="6" />
        <circle cx="200" cy="200" r="24" fill="#111111" />
        <circle cx="200" cy="200" r="8" fill="#EA580C" />

        {/* Optical Crosshair Axis */}
        <line x1="90" y1="200" x2="165" y2="200" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
        <line x1="235" y1="200" x2="310" y2="200" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
        <line x1="200" y1="90" x2="200" y2="165" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
        <line x1="200" y1="235" x2="200" y2="310" stroke="#111111" strokeWidth="4" strokeLinecap="round" />

        {/* 45-degree Alignment Dots */}
        <circle cx="140" cy="140" r="6" fill="#111111" />
        <circle cx="260" cy="140" r="6" fill="#111111" />
        <circle cx="140" cy="260" r="6" fill="#111111" />
        <circle cx="260" cy="260" r="6" fill="#111111" />

        {/* Millimeter Scale Ticks (Top & Bottom edges) */}
        {showRuler && (
          <g stroke="#111111" strokeWidth="2">
            {/* Top scale ticks */}
            {[...Array(11)].map((_, i) => (
              <line
                key={`t-${i}`}
                x1={50 + i * 30}
                y1={30}
                x2={50 + i * 30}
                y2={i % 5 === 0 ? 18 : 24}
              />
            ))}
            {/* Bottom scale ticks */}
            {[...Array(11)].map((_, i) => (
              <line
                key={`b-${i}`}
                x1={50 + i * 30}
                y1={370}
                x2={50 + i * 30}
                y2={i % 5 === 0 ? 382 : 376}
              />
            ))}
          </g>
        )}

        {/* Text Labels */}
        <text
          x="200"
          y="15"
          textAnchor="middle"
          fill="#111111"
          fontSize="11"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="bold"
          letterSpacing="2"
        >
          FRAMEAI 1:1 AR SCALE TARGET
        </text>

        <text
          x="200"
          y="392"
          textAnchor="middle"
          fill="#EA580C"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
          letterSpacing="1.5"
        >
          PRINT SIZE: {sizeMm} mm × {sizeMm} mm
        </text>
      </svg>
    </div>
  );
};
