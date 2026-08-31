import React from 'react';
import { FrameShape, FrameMaterial, Product } from '../../types';

export interface EyewearRendererProps {
  product: Product;
  selectedColorHex?: string;
  selectedColorName?: string;
  scale?: number;
  width?: number;
  height?: number;
  yaw?: number; // head turn in degrees (-45 to 45)
  pitch?: number; // head tilt in degrees (-30 to 30)
  roll?: number; // head roll in degrees
  showTemples?: boolean;
  highlightBridge?: boolean;
  className?: string;
}

/**
 * Procedural Realistic Eyewear Render Engine
 * Handles 3D perspective distortion, material textures (acetate, teak, titanium),
 * anti-reflective lens sheen, and temple arm depth tracking.
 */
export const EyewearRenderer: React.FC<EyewearRendererProps> = ({
  product,
  selectedColorHex = '#1A1A1A',
  selectedColorName,
  scale = 1,
  width = 320,
  height = 160,
  yaw = 0,
  pitch = 0,
  roll = 0,
  showTemples = true,
  highlightBridge = false,
  className = '',
}) => {
  const shape = product.frameShape;
  const material = product.material;

  // Material-specific textures and gradients
  const isWood = material.includes('Teak') || material.includes('Bamboo') || material.includes('Wood');
  const isTitanium = material.includes('Titanium') || material.includes('Stainless') || material.includes('Steel');
  const isAcetate = !isWood && !isTitanium;

  // 3D perspective skew factors derived from head yaw and pitch
  const yawFactor = Math.sin((yaw * Math.PI) / 180);
  const pitchFactor = Math.sin((pitch * Math.PI) / 180);

  // Left vs Right lens scale asymmetry during head turn (yaw)
  const leftLensScale = 1 - yawFactor * 0.22;
  const rightLensScale = 1 + yawFactor * 0.22;

  // Dynamic temple arm depth (when head turns, one temple arm is visible going back towards ear)
  const leftTempleLength = Math.max(0, 15 - yawFactor * 55);
  const rightTempleLength = Math.max(0, 15 + yawFactor * 55);

  const strokeThickness = isTitanium ? 3.0 : 5.2;

  const renderFrameGeometry = () => {
    switch (shape) {
      case 'Rectangle':
        return (
          <g transform={`translate(0, ${pitchFactor * 10})`}>
            {/* Left Lens Frame */}
            <g transform={`translate(${150 - 150 * leftLensScale}, 0) scale(${leftLensScale}, 1)`}>
              <rect
                x="32"
                y="52"
                width="100"
                height="68"
                rx="14"
                ry="14"
                fill="url(#lensGradient)"
                stroke="url(#frameSurface)"
                strokeWidth={strokeThickness}
              />
              {/* Internal rim bevel */}
              <rect
                x="35"
                y="55"
                width="94"
                height="62"
                rx="11"
                ry="11"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
              />
              {/* Lens Glare Curve */}
              <path
                d="M 45 60 Q 90 62 115 85"
                fill="none"
                stroke="url(#glareGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Right Lens Frame */}
            <g transform={`translate(${150 - 150 * rightLensScale}, 0) scale(${rightLensScale}, 1)`}>
              <rect
                x="168"
                y="52"
                width="100"
                height="68"
                rx="14"
                ry="14"
                fill="url(#lensGradient)"
                stroke="url(#frameSurface)"
                strokeWidth={strokeThickness}
              />
              {/* Internal rim bevel */}
              <rect
                x="171"
                y="55"
                width="94"
                height="62"
                rx="11"
                ry="11"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
              />
              {/* Lens Glare Curve */}
              <path
                d="M 181 60 Q 226 62 251 85"
                fill="none"
                stroke="url(#glareGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Bridge */}
            <path
              d="M 132 72 Q 150 64 168 72"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : 'url(#frameSurface)'}
              strokeWidth={highlightBridge ? 6 : strokeThickness * 0.9}
              strokeLinecap="round"
            />

            {/* Nose Pads */}
            {isTitanium && (
              <>
                <ellipse cx="136" cy="84" rx="3.5" ry="7" fill="rgba(240,240,240,0.85)" stroke="#666" strokeWidth="0.8" />
                <ellipse cx="164" cy="84" rx="3.5" ry="7" fill="rgba(240,240,240,0.85)" stroke="#666" strokeWidth="0.8" />
              </>
            )}

            {/* 3D Temples (adapting to head yaw) */}
            {showTemples && (
              <>
                {leftTempleLength > 2 && (
                  <path
                    d={`M 32 64 L ${32 - leftTempleLength} ${58 + yawFactor * 12}`}
                    stroke="url(#frameSurface)"
                    strokeWidth={strokeThickness * 0.9}
                    strokeLinecap="round"
                  />
                )}
                {rightTempleLength > 2 && (
                  <path
                    d={`M 268 64 L ${268 + rightTempleLength} ${58 - yawFactor * 12}`}
                    stroke="url(#frameSurface)"
                    strokeWidth={strokeThickness * 0.9}
                    strokeLinecap="round"
                  />
                )}
              </>
            )}

            {/* Artisan Rivets */}
            <circle cx="40" cy="62" r="1.6" fill="url(#metalAccent)" />
            <circle cx="260" cy="62" r="1.6" fill="url(#metalAccent)" />
          </g>
        );

      case 'Round':
        return (
          <g transform={`translate(0, ${pitchFactor * 10})`}>
            {/* Left Lens */}
            <g transform={`translate(${150 - 150 * leftLensScale}, 0) scale(${leftLensScale}, 1)`}>
              <circle
                cx="82"
                cy="88"
                r="46"
                fill="url(#lensGradient)"
                stroke="url(#frameSurface)"
                strokeWidth={strokeThickness}
              />
              <circle cx="82" cy="88" r="43" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
              <path
                d="M 52 74 A 40 40 0 0 1 108 58"
                fill="none"
                stroke="url(#glareGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Right Lens */}
            <g transform={`translate(${150 - 150 * rightLensScale}, 0) scale(${rightLensScale}, 1)`}>
              <circle
                cx="218"
                cy="88"
                r="46"
                fill="url(#lensGradient)"
                stroke="url(#frameSurface)"
                strokeWidth={strokeThickness}
              />
              <circle cx="218" cy="88" r="43" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
              <path
                d="M 188 74 A 40 40 0 0 1 244 58"
                fill="none"
                stroke="url(#glareGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Keyhole Arch Bridge */}
            <path
              d="M 128 80 C 136 70, 144 65, 150 65 C 156 65, 164 70, 172 80 C 166 84, 160 82, 150 82 C 140 82, 134 84, 128 80 Z"
              fill={highlightBridge ? '#C2410C' : 'url(#frameSurface)'}
              stroke={highlightBridge ? '#C2410C' : 'url(#frameSurface)'}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Temples */}
            {showTemples && (
              <>
                {leftTempleLength > 2 && (
                  <path
                    d={`M 36 84 L ${36 - leftTempleLength} ${78 + yawFactor * 10}`}
                    stroke="url(#frameSurface)"
                    strokeWidth={strokeThickness * 0.9}
                    strokeLinecap="round"
                  />
                )}
                {rightTempleLength > 2 && (
                  <path
                    d={`M 264 84 L ${264 + rightTempleLength} ${78 - yawFactor * 10}`}
                    stroke="url(#frameSurface)"
                    strokeWidth={strokeThickness * 0.9}
                    strokeLinecap="round"
                  />
                )}
              </>
            )}
          </g>
        );

      case 'Browline':
        return (
          <g transform={`translate(0, ${pitchFactor * 10})`}>
            {/* Left Bottom Rim */}
            <g transform={`translate(${150 - 150 * leftLensScale}, 0) scale(${leftLensScale}, 1)`}>
              <path
                d="M 36 70 Q 36 128 82 128 Q 128 128 128 70"
                fill="url(#lensGradient)"
                stroke={isTitanium ? 'url(#metalAccent)' : '#666'}
                strokeWidth="2.2"
              />
              <path
                d="M 28 66 Q 80 50 134 64 Q 130 78 126 78 Q 80 66 36 80 Z"
                fill="url(#frameSurface)"
                stroke="url(#frameSurface)"
                strokeWidth="1"
              />
              <circle cx="36" cy="67" r="1.5" fill="url(#metalAccent)" />
            </g>

            {/* Right Bottom Rim */}
            <g transform={`translate(${150 - 150 * rightLensScale}, 0) scale(${rightLensScale}, 1)`}>
              <path
                d="M 172 70 Q 172 128 218 128 Q 264 128 264 70"
                fill="url(#lensGradient)"
                stroke={isTitanium ? 'url(#metalAccent)' : '#666'}
                strokeWidth="2.2"
              />
              <path
                d="M 166 64 Q 220 50 272 66 Q 264 80 220 66 Q 170 78 166 78 Z"
                fill="url(#frameSurface)"
                stroke="url(#frameSurface)"
                strokeWidth="1"
              />
              <circle cx="264" cy="67" r="1.5" fill="url(#metalAccent)" />
            </g>

            {/* Center Bridge */}
            <path
              d="M 130 73 Q 150 67 170 73"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : 'url(#metalAccent)'}
              strokeWidth={highlightBridge ? 5 : 3.2}
              strokeLinecap="round"
            />

            {/* Temples */}
            {showTemples && (
              <>
                {leftTempleLength > 2 && (
                  <path
                    d={`M 28 66 L ${28 - leftTempleLength} ${60 + yawFactor * 10}`}
                    stroke="url(#frameSurface)"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                  />
                )}
                {rightTempleLength > 2 && (
                  <path
                    d={`M 272 66 L ${272 + rightTempleLength} ${60 - yawFactor * 10}`}
                    stroke="url(#frameSurface)"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                  />
                )}
              </>
            )}
          </g>
        );

      case 'Cat-Eye':
        return (
          <g transform={`translate(0, ${pitchFactor * 10})`}>
            {/* Left Lens */}
            <g transform={`translate(${150 - 150 * leftLensScale}, 0) scale(${leftLensScale}, 1)`}>
              <path
                d="M 26 48 Q 86 44 130 68 Q 122 124 78 124 Q 30 118 26 48 Z"
                fill="url(#lensGradient)"
                stroke="url(#frameSurface)"
                strokeWidth={strokeThickness}
                strokeLinejoin="round"
              />
              <path
                d="M 38 56 Q 84 52 120 70"
                fill="none"
                stroke="url(#glareGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="34" cy="56" r="1.5" fill="url(#metalAccent)" />
            </g>

            {/* Right Lens */}
            <g transform={`translate(${150 - 150 * rightLensScale}, 0) scale(${rightLensScale}, 1)`}>
              <path
                d="M 274 48 Q 214 44 170 68 Q 178 124 222 124 Q 270 118 274 48 Z"
                fill="url(#lensGradient)"
                stroke="url(#frameSurface)"
                strokeWidth={strokeThickness}
                strokeLinejoin="round"
              />
              <path
                d="M 262 56 Q 216 52 180 70"
                fill="none"
                stroke="url(#glareGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="266" cy="56" r="1.5" fill="url(#metalAccent)" />
            </g>

            {/* Bridge */}
            <path
              d="M 130 68 Q 150 60 170 68"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : 'url(#frameSurface)'}
              strokeWidth={highlightBridge ? 5 : strokeThickness * 0.9}
              strokeLinecap="round"
            />

            {/* Temples */}
            {showTemples && (
              <>
                {leftTempleLength > 2 && (
                  <path
                    d={`M 26 48 L ${26 - leftTempleLength} ${42 + yawFactor * 12}`}
                    stroke="url(#frameSurface)"
                    strokeWidth={strokeThickness}
                    strokeLinecap="round"
                  />
                )}
                {rightTempleLength > 2 && (
                  <path
                    d={`M 274 48 L ${274 + rightTempleLength} ${42 - yawFactor * 12}`}
                    stroke="url(#frameSurface)"
                    strokeWidth={strokeThickness}
                    strokeLinecap="round"
                  />
                )}
              </>
            )}
          </g>
        );

      case 'Aviator':
        return (
          <g transform={`translate(0, ${pitchFactor * 10})`}>
            {/* Top Brow Bar */}
            <path d="M 36 50 L 264 50" stroke="url(#frameSurface)" strokeWidth="3" strokeLinecap="round" />

            {/* Left Teardrop */}
            <g transform={`translate(${150 - 150 * leftLensScale}, 0) scale(${leftLensScale}, 1)`}>
              <path
                d="M 32 60 Q 86 52 130 60 Q 132 112 96 130 Q 38 130 32 60 Z"
                fill="url(#lensGradient)"
                stroke="url(#frameSurface)"
                strokeWidth="2.8"
              />
              <path
                d="M 44 68 Q 86 60 120 68"
                fill="none"
                stroke="url(#glareGradient)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>

            {/* Right Teardrop */}
            <g transform={`translate(${150 - 150 * rightLensScale}, 0) scale(${rightLensScale}, 1)`}>
              <path
                d="M 268 60 Q 214 52 170 60 Q 168 112 204 130 Q 262 130 268 60 Z"
                fill="url(#lensGradient)"
                stroke="url(#frameSurface)"
                strokeWidth="2.8"
              />
              <path
                d="M 256 68 Q 214 60 180 68"
                fill="none"
                stroke="url(#glareGradient)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>

            {/* Center Bridge */}
            <path
              d="M 130 64 Q 150 58 170 64"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : 'url(#frameSurface)'}
              strokeWidth={highlightBridge ? 4.5 : 2.5}
            />

            {/* Temples */}
            {showTemples && (
              <>
                {leftTempleLength > 2 && (
                  <path
                    d={`M 32 60 L ${32 - leftTempleLength} ${56 + yawFactor * 10}`}
                    stroke="url(#frameSurface)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                )}
                {rightTempleLength > 2 && (
                  <path
                    d={`M 268 60 L ${268 + rightTempleLength} ${56 - yawFactor * 10}`}
                    stroke="url(#frameSurface)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                )}
              </>
            )}
          </g>
        );

      case 'Geometric':
      case 'Square':
      default:
        return (
          <g transform={`translate(0, ${pitchFactor * 10})`}>
            {/* Left Octagon */}
            <g transform={`translate(${150 - 150 * leftLensScale}, 0) scale(${leftLensScale}, 1)`}>
              <polygon
                points="46,52 116,52 132,74 132,112 116,128 46,128 30,112 30,74"
                fill="url(#lensGradient)"
                stroke="url(#frameSurface)"
                strokeWidth={strokeThickness}
                strokeLinejoin="round"
              />
              <path
                d="M 44 60 L 110 60"
                fill="none"
                stroke="url(#glareGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Right Octagon */}
            <g transform={`translate(${150 - 150 * rightLensScale}, 0) scale(${rightLensScale}, 1)`}>
              <polygon
                points="184,52 254,52 270,74 270,112 254,128 184,128 168,112 168,74"
                fill="url(#lensGradient)"
                stroke="url(#frameSurface)"
                strokeWidth={strokeThickness}
                strokeLinejoin="round"
              />
              <path
                d="M 190 60 L 256 60"
                fill="none"
                stroke="url(#glareGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Bridge */}
            <path
              d="M 132 74 Q 150 66 168 74"
              fill="none"
              stroke={highlightBridge ? '#C2410C' : 'url(#frameSurface)'}
              strokeWidth={highlightBridge ? 5 : strokeThickness * 0.9}
              strokeLinecap="round"
            />

            {/* Temples */}
            {showTemples && (
              <>
                {leftTempleLength > 2 && (
                  <path
                    d={`M 30 74 L ${30 - leftTempleLength} ${68 + yawFactor * 10}`}
                    stroke="url(#frameSurface)"
                    strokeWidth={strokeThickness}
                    strokeLinecap="round"
                  />
                )}
                {rightTempleLength > 2 && (
                  <path
                    d={`M 270 74 L ${270 + rightTempleLength} ${68 - yawFactor * 10}`}
                    stroke="url(#frameSurface)"
                    strokeWidth={strokeThickness}
                    strokeLinecap="round"
                  />
                )}
              </>
            )}
          </g>
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <svg
        viewBox="0 0 300 175"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        <defs>
          {/* Surface Material Shaders */}
          <linearGradient id="frameSurface" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={selectedColorHex} />
            <stop offset="45%" stopColor={isTitanium ? '#E8E8E8' : isWood ? '#C89D6D' : selectedColorHex} stopOpacity={isAcetate ? 0.9 : 0.8} />
            <stop offset="70%" stopColor={selectedColorHex} />
            <stop offset="100%" stopColor={isTitanium ? '#777' : '#0B0B0B'} />
          </linearGradient>

          {/* Metal Hinges & Screws */}
          <linearGradient id="metalAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2D6" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8C7322" />
          </linearGradient>

          {/* AR Anti-reflective & Polarized Lens Shader */}
          <linearGradient id="lensGradient" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="rgba(215, 235, 255, 0.16)" />
            <stop offset="60%" stopColor="rgba(10, 20, 30, 0.08)" />
            <stop offset="100%" stopColor="rgba(180, 220, 255, 0.12)" />
          </linearGradient>

          {/* Lens Specular Reflection Glare */}
          <linearGradient id="glareGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.75)" />
            <stop offset="40%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
        </defs>

        {renderFrameGeometry()}
      </svg>
    </div>
  );
};
