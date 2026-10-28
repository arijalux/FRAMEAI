import React, { Suspense, lazy } from 'react';
import type { ThreeFrameCanvas as ThreeFrameCanvasType } from './ThreeFrameCanvas';

// three.js is most of the bundle; load it only when a 3D view is actually opened
const ThreeFrameCanvasLazy = lazy(() =>
  import('./ThreeFrameCanvas').then((m) => ({ default: m.ThreeFrameCanvas }))
);

export const LazyThreeFrameCanvas: typeof ThreeFrameCanvasType = (props) => (
  <Suspense
    fallback={
      <div className="aspect-[4/3] w-full rounded-2xl bg-white flex items-center justify-center text-xs text-faint">
        Memuat tampilan 3D...
      </div>
    }
  >
    <ThreeFrameCanvasLazy {...props} />
  </Suspense>
);
