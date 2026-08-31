import React from 'react';
import { FrameShape } from '../../types';

interface FrameViewerProps {
  shape: FrameShape;
  colorHex?: string;
  lensTintHex?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  wireframeOnly?: boolean;
  scale?: number;
  highlightBridge?: boolean;
}

export const FrameViewer: React.FC<FrameViewerProps> = ({
  shape,
  colorHex = '#1A1A1A',
  lensTintHex = 'rgba(0, 0, 0, 0.08)',
  width = '100%',
  height = '100%',
  className = '',
  wireframeOnly = false,
  scale = 1,
  highlightBridge = false,
}) => {
  const strokeWidth = wireframeOnly ? 2.5 : 4.5;

  const renderFrameSvg = () => {
    switch (shape) {
      case 'Rectangle':
        return (
          <g>
            {/* Left Lens */}
            <rect
              x="30"
              y="55"
              width="100"
              height="65"
              rx="14"
              ry="14"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={strokeWidth}
            />
            {/* Right Lens */}
            <rect
              x="170"
              y="55"
              width="100"
              height="65"
              rx="14"
              ry="14"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={strokeWidth}
            />
            {/* Bridge */}
            <path
              d="M 130 75 Q 150 68 170 75"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : colorHex}
              strokeWidth={highlightBridge ? 5 : strokeWidth * 0.9}
              strokeLinecap="round"
            />
            {/* Temples */}
            <path d="M 30 65 L 10 60" stroke={colorHex} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M 270 65 L 290 60" stroke={colorHex} strokeWidth={strokeWidth} strokeLinecap="round" />
            {/* Rivets */}
            {!wireframeOnly && (
              <>
                <circle cx="38" cy="65" r="1.5" fill="#D4AF37" />
                <circle cx="262" cy="65" r="1.5" fill="#D4AF37" />
              </>
            )}
          </g>
        );

      case 'Round':
        return (
          <g>
            {/* Left Lens */}
            <circle
              cx="80"
              cy="88"
              r="46"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={strokeWidth}
            />
            {/* Right Lens */}
            <circle
              cx="220"
              cy="88"
              r="46"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={strokeWidth}
            />
            {/* Bridge with keyhole arch */}
            <path
              d="M 126 80 Q 150 68 174 80"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : colorHex}
              strokeWidth={highlightBridge ? 5 : strokeWidth * 0.9}
              strokeLinecap="round"
            />
            {/* Temples */}
            <path d="M 34 85 L 12 80" stroke={colorHex} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M 266 85 L 288 80" stroke={colorHex} strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        );

      case 'Browline':
        return (
          <g>
            {/* Left Lower Thin Wire */}
            <path
              d="M 35 70 Q 35 125 80 125 Q 125 125 128 70"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={2}
            />
            {/* Right Lower Thin Wire */}
            <path
              d="M 172 70 Q 175 125 220 125 Q 265 125 265 70"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={2}
            />
            {/* Left Thick Brow Bar */}
            <path
              d="M 28 66 Q 80 50 132 64 Q 130 76 126 76 Q 80 66 35 78 Z"
              fill={colorHex}
              stroke={colorHex}
              strokeWidth={1}
            />
            {/* Right Thick Brow Bar */}
            <path
              d="M 168 64 Q 220 50 272 66 Q 265 78 220 66 Q 174 76 168 76 Z"
              fill={colorHex}
              stroke={colorHex}
              strokeWidth={1}
            />
            {/* Bridge */}
            <path
              d="M 128 72 Q 150 66 172 72"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : '#888'}
              strokeWidth={highlightBridge ? 5 : 3}
              strokeLinecap="round"
            />
            {/* Temples */}
            <path d="M 28 66 L 10 62" stroke={colorHex} strokeWidth={4} strokeLinecap="round" />
            <path d="M 272 66 L 290 62" stroke={colorHex} strokeWidth={4} strokeLinecap="round" />
          </g>
        );

      case 'Cat-Eye':
        return (
          <g>
            {/* Left Lens with lifted sweep */}
            <path
              d="M 25 50 Q 85 45 130 68 Q 120 120 75 120 Q 30 115 25 50 Z"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Right Lens */}
            <path
              d="M 275 50 Q 215 45 170 68 Q 180 120 225 120 Q 270 115 275 50 Z"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Bridge */}
            <path
              d="M 130 68 Q 150 62 170 68"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : colorHex}
              strokeWidth={highlightBridge ? 5 : strokeWidth * 0.9}
              strokeLinecap="round"
            />
            {/* Cat ear tips */}
            <path d="M 25 50 L 8 44" stroke={colorHex} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M 275 50 L 292 44" stroke={colorHex} strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        );

      case 'Aviator':
        return (
          <g>
            {/* Left Teardrop */}
            <path
              d="M 32 60 Q 85 52 130 60 Q 132 110 95 128 Q 40 128 32 60 Z"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={2.5}
            />
            {/* Right Teardrop */}
            <path
              d="M 268 60 Q 215 52 170 60 Q 168 110 205 128 Q 260 128 268 60 Z"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={2.5}
            />
            {/* Top Brow Bar */}
            <path d="M 38 52 L 262 52" stroke={colorHex} strokeWidth={2.5} strokeLinecap="round" />
            {/* Center Bridge */}
            <path
              d="M 130 65 Q 150 60 170 65"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : colorHex}
              strokeWidth={highlightBridge ? 4 : 2}
            />
            {/* Temples */}
            <path d="M 32 60 L 10 56" stroke={colorHex} strokeWidth={2.5} strokeLinecap="round" />
            <path d="M 268 60 L 290 56" stroke={colorHex} strokeWidth={2.5} strokeLinecap="round" />
          </g>
        );

      case 'Geometric':
      case 'Square':
        return (
          <g>
            {/* Left Octa-facet */}
            <polygon
              points="45,55 115,55 130,75 130,110 115,125 45,125 30,110 30,75"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Right Octa-facet */}
            <polygon
              points="185,55 255,55 270,75 270,110 255,125 185,125 170,110 170,75"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Bridge */}
            <path
              d="M 130 75 Q 150 68 170 75"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : colorHex}
              strokeWidth={highlightBridge ? 5 : strokeWidth * 0.9}
              strokeLinecap="round"
            />
            {/* Temples */}
            <path d="M 30 75 L 10 70" stroke={colorHex} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M 270 75 L 290 70" stroke={colorHex} strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        );

      case 'Oval':
      default:
        return (
          <g>
            {/* Left Oval */}
            <ellipse
              cx="80"
              cy="88"
              rx="48"
              ry="36"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={strokeWidth}
            />
            {/* Right Oval */}
            <ellipse
              cx="220"
              cy="88"
              rx="48"
              ry="36"
              fill={wireframeOnly ? 'none' : lensTintHex}
              stroke={colorHex}
              strokeWidth={strokeWidth}
            />
            {/* Bridge */}
            <path
              d="M 128 82 Q 150 72 172 82"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : colorHex}
              strokeWidth={highlightBridge ? 5 : strokeWidth * 0.9}
              strokeLinecap="round"
            />
            {/* Temples */}
            <path d="M 32 85 L 10 80" stroke={colorHex} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M 268 85 L 290 80" stroke={colorHex} strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      <svg
        viewBox="0 0 300 175"
        className="w-full h-full drop-shadow-sm transition-transform duration-300"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {renderFrameSvg()}
      </svg>
    </div>
  );
};
