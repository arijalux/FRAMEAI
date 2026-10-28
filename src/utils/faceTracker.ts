/**
 * Face and eye tracker for FrameAI AR Try-On, built on MediaPipe Face Landmarker.
 * Runs entirely in the browser (no frames leave the device) and returns pupil
 * positions already mapped into the on-screen canvas space.
 */
import type { FaceLandmarker } from '@mediapipe/tasks-vision';

export interface TrackedLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  center: { x: number; y: number };
  eyeDistance: number;
  angle: number; // in radians
  faceWidth: number;
  detected: boolean;
}

type Point = { x: number; y: number };

// Keep the wasm version in sync with @mediapipe/tasks-vision in package.json
const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// Face mesh indices: iris centers (needs the 478-point model) and the outer cheek contour
const IRIS_A = 468;
const IRIS_B = 473;
const CHEEK_A = 234;
const CHEEK_B = 454;

/**
 * How a source of srcW×srcH is laid out by CSS `object-fit: cover` inside dstW×dstH.
 */
export function coverTransform(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  return {
    scale,
    offsetX: (dstW - srcW * scale) / 2,
    offsetY: (dstH - srcH * scale) / 2,
  };
}

/**
 * Maps a normalized (0–1) point in the source image to the displayed canvas,
 * matching `object-fit: cover` and an optional horizontal mirror (selfie view).
 */
export function mapNormalizedPoint(
  p: Point,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  mirror: boolean
): Point {
  const { scale, offsetX, offsetY } = coverTransform(srcW, srcH, dstW, dstH);
  const x = offsetX + p.x * srcW * scale;
  const y = offsetY + p.y * srcH * scale;
  return { x: mirror ? dstW - x : x, y };
}

/** Builds landmarks from two eye points, ordering them left-to-right on screen. */
export function landmarksFromEyes(a: Point, b: Point, faceWidth: number, detected = true): TrackedLandmarks {
  const [leftEye, rightEye] = a.x <= b.x ? [a, b] : [b, a];
  return {
    leftEye,
    rightEye,
    center: { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 },
    eyeDistance: Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y),
    angle: Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x),
    faceWidth,
    detected,
  };
}

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

/** Loads the Face Landmarker once (wasm + model from CDN), preferring the GPU delegate. */
export function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      const create = (delegate: 'GPU' | 'CPU') =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO',
          numFaces: 1,
        });
      try {
        return await create('GPU');
      } catch {
        return await create('CPU');
      }
    })();
    // Allow a retry after a failed load (e.g. offline)
    landmarkerPromise.catch(() => {
      landmarkerPromise = null;
    });
  }
  return landmarkerPromise;
}

export class OpticalFaceTracker {
  private landmarker: FaceLandmarker | null = null;
  private prevResult: TrackedLandmarks | null = null;
  private lastTimestamp = 0;
  private smoothFactor = 0.5; // Exponential moving average; higher = more responsive

  async init(): Promise<void> {
    this.landmarker = await loadFaceLandmarker();
  }

  get isReady(): boolean {
    return this.landmarker !== null;
  }

  /**
   * Detects the face in the current frame and returns eye positions in canvas space
   * (dstW×dstH, CSS pixels), or null if not ready or no face is visible.
   */
  track(
    source: HTMLVideoElement | HTMLImageElement,
    dstW: number,
    dstH: number,
    mirror: boolean
  ): TrackedLandmarks | null {
    if (!this.landmarker) return null;

    const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
    if (!srcW || !srcH) return null;

    // MediaPipe requires strictly increasing timestamps in VIDEO mode
    const now = Math.max(performance.now(), this.lastTimestamp + 1);
    this.lastTimestamp = now;

    let face;
    try {
      face = this.landmarker.detectForVideo(source, now).faceLandmarks[0];
    } catch {
      return null;
    }
    if (!face || face.length <= IRIS_B) {
      this.prevResult = null;
      return null;
    }

    const map = (i: number) => mapNormalizedPoint(face[i], srcW, srcH, dstW, dstH, mirror);
    const faceWidth = Math.hypot(map(CHEEK_B).x - map(CHEEK_A).x, map(CHEEK_B).y - map(CHEEK_A).y);
    return this.smooth(landmarksFromEyes(map(IRIS_A), map(IRIS_B), faceWidth));
  }

  private smooth(current: TrackedLandmarks): TrackedLandmarks {
    const prev = this.prevResult;
    if (!prev) {
      this.prevResult = current;
      return current;
    }
    const a = this.smoothFactor;
    const mix = (c: number, p: number) => c * a + p * (1 - a);
    const smoothed: TrackedLandmarks = {
      leftEye: { x: mix(current.leftEye.x, prev.leftEye.x), y: mix(current.leftEye.y, prev.leftEye.y) },
      rightEye: { x: mix(current.rightEye.x, prev.rightEye.x), y: mix(current.rightEye.y, prev.rightEye.y) },
      center: { x: mix(current.center.x, prev.center.x), y: mix(current.center.y, prev.center.y) },
      eyeDistance: mix(current.eyeDistance, prev.eyeDistance),
      angle: mix(current.angle, prev.angle),
      faceWidth: mix(current.faceWidth, prev.faceWidth),
      detected: true,
    };
    this.prevResult = smoothed;
    return smoothed;
  }
}
