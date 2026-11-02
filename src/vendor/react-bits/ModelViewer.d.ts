import type { CSSProperties, FC, Ref } from 'react';

// Types for the vendored React Bits ModelViewer (see the props table at reactbits.dev)
export interface ModelViewerProps {
  url: string;
  width?: number | string;
  height?: number | string;
  environment?: 'studio' | 'city' | 'sunset' | 'dawn' | 'warehouse' | 'apartment' | 'lobby' | 'night' | 'park' | 'forest' | 'none';
  environmentIntensity?: number;
  exposure?: number;
  intro?: 'rise' | 'spin' | 'fade' | 'none';
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  autoRotateDelay?: number;
  dragRotate?: boolean;
  turntable?: boolean;
  zoom?: boolean;
  minZoom?: number;
  maxZoom?: number;
  hoverTilt?: number;
  float?: number;
  shadow?: boolean;
  shadowOpacity?: number;
  fit?: number;
  offsetX?: number;
  offsetY?: number;
  startAngle?: number;
  tilt?: number;
  resetOnDoubleClick?: boolean;
  onModelLoaded?: () => void;
  ref?: Ref<{ capture: (type?: string) => string | null }>;
  className?: string;
  style?: CSSProperties;
}

declare const ModelViewer: FC<ModelViewerProps>;
export default ModelViewer;
