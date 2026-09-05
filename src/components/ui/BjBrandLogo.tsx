import React from 'react';
import bjLogoBlack from '../../assets/images/bj-logo.png';
import bjLogoWhite from '../../assets/images/bj-logo-white.png';

export interface BjBrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  size?: number;
  color?: string;
  variant?: 'mark' | 'full';
}

/**
 * Authentic BJ Homemade Brand Logo
 * Displays the authentic image uploaded by the user:
 * - Solid black with transparent background for light backgrounds
 * - Solid white with transparent background for dark backgrounds
 * - Rendered as a high-performance native image tag
 */
export const BjBrandLogo: React.FC<BjBrandLogoProps> = ({
  className = 'h-8 w-auto',
  size,
  color = '#000000',
  variant = 'mark',
  alt = 'BJ Homemade',
  style,
  ...props
}) => {
  const isWhite =
    color === '#FFFFFF' ||
    color === '#fff' ||
    color === 'white' ||
    (typeof className === 'string' && (className.includes('text-white') || className.includes('brightness-0 invert')));

  const src = isWhite ? bjLogoWhite : bjLogoBlack;

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none shrink-0 ${className}`}
      style={{
        height: size ? `${size}px` : undefined,
        aspectRatio: '1350 / 1050',
        ...style,
      }}
      draggable={false}
      {...props}
    />
  );
};

export default BjBrandLogo;
