import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { FaceShape, FrameShape } from '../types';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface FaceTrackingPose {
  isDetected: boolean;
  faceCount: number;
  confidence: number;
  centerX: number; // in pixel coords relative to container
  centerY: number; // in pixel coords relative to container
  width: number; // in pixels
  height: number; // in pixels
  scale: number; // calculated scale factor
  roll: number; // in degrees
  yaw: number; // in degrees
  pitch: number; // in degrees
  pupillaryDistancePx: number;
  leftEyeCenter: Point3D;
  rightEyeCenter: Point3D;
  eyeCenter: Point3D;
  eyeDistance: number;
  noseBridge: Point3D;
  faceCenter: Point3D;
  leftTemple: Point3D;
  rightTemple: Point3D;
  faceShapeEstimate: FaceShape;
  rawLandmarks?: Point3D[];
  landmarkCount: number;
  timestamp: number;
}

export interface ARViewportDimensions {
  containerWidth: number;
  containerHeight: number;
  videoWidth: number;
  videoHeight: number;
}

export interface FrameAssetGeometry {
  viewBoxWidth: number;
  viewBoxHeight: number;
  leftLensCenterX: number;
  leftLensCenterY: number;
  rightLensCenterX: number;
  rightLensCenterY: number;
  lensDistance: number;
  anchorNormalizedX: number;
  anchorNormalizedY: number;
}

export const FRAME_ASSET_GEOMETRIES: Record<FrameShape, FrameAssetGeometry> = {
  Rectangle: {
    viewBoxWidth: 300,
    viewBoxHeight: 175,
    leftLensCenterX: 82,
    leftLensCenterY: 86,
    rightLensCenterX: 218,
    rightLensCenterY: 86,
    lensDistance: 136,
    anchorNormalizedX: 0.5,
    anchorNormalizedY: 86 / 175,
  },
  Round: {
    viewBoxWidth: 300,
    viewBoxHeight: 175,
    leftLensCenterX: 82,
    leftLensCenterY: 88,
    rightLensCenterX: 218,
    rightLensCenterY: 88,
    lensDistance: 136,
    anchorNormalizedX: 0.5,
    anchorNormalizedY: 88 / 175,
  },
  Browline: {
    viewBoxWidth: 300,
    viewBoxHeight: 175,
    leftLensCenterX: 82,
    leftLensCenterY: 96,
    rightLensCenterX: 218,
    rightLensCenterY: 96,
    lensDistance: 136,
    anchorNormalizedX: 0.5,
    anchorNormalizedY: 96 / 175,
  },
  Wayfarer: {
    viewBoxWidth: 300,
    viewBoxHeight: 175,
    leftLensCenterX: 82,
    leftLensCenterY: 86,
    rightLensCenterX: 218,
    rightLensCenterY: 86,
    lensDistance: 136,
    anchorNormalizedX: 0.5,
    anchorNormalizedY: 86 / 175,
  },
  'Cat-Eye': {
    viewBoxWidth: 300,
    viewBoxHeight: 175,
    leftLensCenterX: 78,
    leftLensCenterY: 84,
    rightLensCenterX: 222,
    rightLensCenterY: 84,
    lensDistance: 144,
    anchorNormalizedX: 0.5,
    anchorNormalizedY: 84 / 175,
  },
  Aviator: {
    viewBoxWidth: 300,
    viewBoxHeight: 175,
    leftLensCenterX: 81,
    leftLensCenterY: 95,
    rightLensCenterX: 219,
    rightLensCenterY: 95,
    lensDistance: 138,
    anchorNormalizedX: 0.5,
    anchorNormalizedY: 95 / 175,
  },
  Square: {
    viewBoxWidth: 300,
    viewBoxHeight: 175,
    leftLensCenterX: 81,
    leftLensCenterY: 90,
    rightLensCenterX: 219,
    rightLensCenterY: 90,
    lensDistance: 138,
    anchorNormalizedX: 0.5,
    anchorNormalizedY: 90 / 175,
  },
  Geometric: {
    viewBoxWidth: 300,
    viewBoxHeight: 175,
    leftLensCenterX: 81,
    leftLensCenterY: 90,
    rightLensCenterX: 219,
    rightLensCenterY: 90,
    lensDistance: 138,
    anchorNormalizedX: 0.5,
    anchorNormalizedY: 90 / 175,
  },
  Oval: {
    viewBoxWidth: 300,
    viewBoxHeight: 175,
    leftLensCenterX: 82,
    leftLensCenterY: 88,
    rightLensCenterX: 218,
    rightLensCenterY: 88,
    lensDistance: 136,
    anchorNormalizedX: 0.5,
    anchorNormalizedY: 88 / 175,
  },
};

export const DEFAULT_FRAME_GEOMETRY = FRAME_ASSET_GEOMETRIES.Rectangle;

export interface FrameCalibration {
  anchorX: number;
  anchorY: number;
  lensDistanceRatio: number;
  aspectRatio: number;
  scaleMultiplier: number;
  normalizedYOffset: number;
  normalizedXOffset: number;
}

export const DEFAULT_FRAME_CALIBRATION: FrameCalibration = {
  anchorX: 0.5,
  anchorY: 86 / 175,
  lensDistanceRatio: 300 / 136,
  aspectRatio: 175 / 300,
  scaleMultiplier: 1.0,
  normalizedYOffset: 0.0,
  normalizedXOffset: 0.0,
};

export const FRAME_SHAPE_CALIBRATIONS: Record<FrameShape, FrameCalibration> = {
  Rectangle: DEFAULT_FRAME_CALIBRATION,
  Round: { ...DEFAULT_FRAME_CALIBRATION, anchorY: 88 / 175 },
  Browline: { ...DEFAULT_FRAME_CALIBRATION, anchorY: 96 / 175 },
  Wayfarer: DEFAULT_FRAME_CALIBRATION,
  'Cat-Eye': { ...DEFAULT_FRAME_CALIBRATION, lensDistanceRatio: 300 / 144, anchorY: 84 / 175 },
  Aviator: { ...DEFAULT_FRAME_CALIBRATION, lensDistanceRatio: 300 / 138, anchorY: 95 / 175 },
  Square: { ...DEFAULT_FRAME_CALIBRATION, lensDistanceRatio: 300 / 138, anchorY: 90 / 175 },
  Geometric: { ...DEFAULT_FRAME_CALIBRATION, lensDistanceRatio: 300 / 138, anchorY: 90 / 175 },
  Oval: { ...DEFAULT_FRAME_CALIBRATION, anchorY: 88 / 175 },
};

export interface EyewearTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  yaw: number;
  pitch: number;
  eyeDistance: number;
  leftEyeCenter: Point3D;
  rightEyeCenter: Point3D;
  eyeMidpoint: Point3D;
  anchorNormalizedX: number;
  anchorNormalizedY: number;
}

/**
 * Calculates exact calibrated transformation for eyewear overlay
 * aligning left/right lens centers directly onto the user's pupils.
 */
export function calculateEyewearTransform(
  leftEyeCenter: Point3D,
  rightEyeCenter: Point3D,
  geometry: FrameAssetGeometry = DEFAULT_FRAME_GEOMETRY,
  userOffsets?: { scale?: number; vertical?: number; horizontal?: number }
): EyewearTransform {
  const dx = rightEyeCenter.x - leftEyeCenter.x;
  const dy = rightEyeCenter.y - leftEyeCenter.y;
  const detectedEyeDistance = Math.max(10, Math.hypot(dx, dy));
  const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;

  const eyeMidpoint: Point3D = {
    x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
    y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
    z: (leftEyeCenter.z + rightEyeCenter.z) / 2,
  };

  const userScale = userOffsets?.scale ?? 1.0;
  const baseScale = detectedEyeDistance / geometry.lensDistance;
  const finalScale = baseScale * userScale;

  const width = geometry.viewBoxWidth * finalScale;
  const height = geometry.viewBoxHeight * finalScale;

  // Rotation axis unit vectors
  const rad = (rotation * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);

  // Perpendicular downward vector along face axis
  const perpX = -sinR;
  const perpY = cosR;

  const userVert = userOffsets?.vertical ?? 0;
  const userHoriz = userOffsets?.horizontal ?? 0;

  const netOffsetX = cosR * userHoriz + perpX * userVert;
  const netOffsetY = sinR * userHoriz + perpY * userVert;

  return {
    x: eyeMidpoint.x + netOffsetX,
    y: eyeMidpoint.y + netOffsetY,
    width,
    height,
    scale: finalScale,
    rotation,
    yaw: 0,
    pitch: 0,
    eyeDistance: detectedEyeDistance,
    leftEyeCenter,
    rightEyeCenter,
    eyeMidpoint,
    anchorNormalizedX: geometry.anchorNormalizedX,
    anchorNormalizedY: geometry.anchorNormalizedY,
  };
}

export function mapLandmarkToDisplayCoordinates(
  landmark: { x: number; y: number; z?: number },
  viewport: ARViewportDimensions,
  isMirrored = true
): Point3D {
  if (!landmark) return { x: 0, y: 0, z: 0 };
  const vWidth = viewport.videoWidth || 1280;
  const vHeight = viewport.videoHeight || 720;
  const cWidth = viewport.containerWidth || 1280;
  const cHeight = viewport.containerHeight || 720;

  const coverScale = Math.max(cWidth / vWidth, cHeight / vHeight);
  const scaledVideoWidth = vWidth * coverScale;
  const scaledVideoHeight = vHeight * coverScale;
  const cropX = (scaledVideoWidth - cWidth) / 2;
  const cropY = (scaledVideoHeight - cHeight) / 2;

  const normX = isMirrored ? 1 - landmark.x : landmark.x;
  const px = normX * scaledVideoWidth - cropX;
  const py = landmark.y * scaledVideoHeight - cropY;
  const pz = (landmark.z || 0) * scaledVideoWidth;

  return { x: px, y: py, z: pz };
}

// MediaPipe landmark indices for face feature anchors
export const LANDMARKS = {
  // Iris landmarks (478-landmark model)
  LEFT_IRIS_CENTER: 468,
  LEFT_IRIS_POINTS: [468, 469, 470, 471, 472],
  RIGHT_IRIS_CENTER: 473,
  RIGHT_IRIS_POINTS: [473, 474, 475, 476, 477],

  // Fallback eye contour landmarks
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  LEFT_EYE_POINTS: [33, 133, 159, 145],

  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 263,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  RIGHT_EYE_POINTS: [362, 263, 386, 374],

  // Face contours
  NOSE_BRIDGE_TOP: 168,
  NOSE_BRIDGE_MID: 6,
  NOSE_TIP: 1,
  CHIN: 152,
  FOREHEAD_TOP: 10,
  LEFT_TEMPLE: 234,
  RIGHT_TEMPLE: 454,
  LEFT_JAW: 58,
  RIGHT_JAW: 288,
  LEFT_CHEEKBONE: 123,
  RIGHT_CHEEKBONE: 352,
  LEFT_EYEBROW: 70,
  RIGHT_EYEBROW: 300,
  LIPS_TOP: 13,
  LIPS_BOTTOM: 14,
};

let faceLandmarkerInstance: FaceLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<FaceLandmarker | null> | null = null;

/**
 * Initialize MediaPipe FaceLandmarker with robust multi-CDN fallback.
 */
export async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    isInitializing = true;
    const cdnUrls = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      'https://unpkg.com/@mediapipe/tasks-vision/wasm',
    ];

    const modelAssetUrls = [
      'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm/face_landmarker.task',
    ];

    for (const cdnUrl of cdnUrls) {
      try {
        const vision = await FilesetResolver.forVisionTasks(cdnUrl);

        for (const modelAssetPath of modelAssetUrls) {
          // Try GPU delegate first, then CPU delegate
          try {
            faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath,
                delegate: 'GPU',
              },
              outputFaceBlendshapes: false,
              outputFacialTransformationMatrixes: true,
              runningMode: 'VIDEO',
              numFaces: 2,
            });
            return faceLandmarkerInstance;
          } catch (gpuErr) {
            try {
              faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                  modelAssetPath,
                  delegate: 'CPU',
                },
                outputFaceBlendshapes: false,
                outputFacialTransformationMatrixes: true,
                runningMode: 'VIDEO',
                numFaces: 2,
              });
              return faceLandmarkerInstance;
            } catch (cpuErr) {
              console.warn(`MediaPipe CPU initialization error with ${modelAssetPath}:`, cpuErr);
            }
          }
        }
      } catch (cdnErr) {
        console.warn(`MediaPipe CDN error for ${cdnUrl}:`, cdnErr);
      }
    }

    isInitializing = false;
    return null;
  })();

  return initPromise;
}

/**
 * Exponential Moving Average smoothing tracker to eliminate jitter while keeping latency near 0ms.
 */
export class SmoothPoseFilter {
  private currentPose: FaceTrackingPose | null = null;
  private alphaPos: number;
  private alphaRot: number;
  private alphaScale: number;
  private lastSeenTime = 0;
  private lossGracePeriodMs = 450; // Grace period during fast blink or momentary occlusion

  constructor(alphaPos = 0.52, alphaRot = 0.44, alphaScale = 0.46) {
    this.alphaPos = alphaPos;
    this.alphaRot = alphaRot;
    this.alphaScale = alphaScale;
  }

  public update(rawPose: FaceTrackingPose | null, now = performance.now()): FaceTrackingPose | null {
    if (!rawPose || !rawPose.isDetected) {
      if (this.currentPose && now - this.lastSeenTime < this.lossGracePeriodMs) {
        return {
          ...this.currentPose,
          confidence: Math.max(0.1, this.currentPose.confidence * 0.88),
        };
      }
      return null;
    }

    this.lastSeenTime = now;

    if (!this.currentPose) {
      this.currentPose = { ...rawPose };
      return this.currentPose;
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const lerpAngle = (a: number, b: number, t: number) => {
      let diff = (b - a) % 360;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      return a + diff * t;
    };

    const smoothed: FaceTrackingPose = {
      isDetected: true,
      faceCount: rawPose.faceCount,
      confidence: lerp(this.currentPose.confidence, rawPose.confidence, 0.5),
      centerX: lerp(this.currentPose.centerX, rawPose.centerX, this.alphaPos),
      centerY: lerp(this.currentPose.centerY, rawPose.centerY, this.alphaPos),
      width: lerp(this.currentPose.width, rawPose.width, this.alphaScale),
      height: lerp(this.currentPose.height, rawPose.height, this.alphaScale),
      scale: lerp(this.currentPose.scale, rawPose.scale, this.alphaScale),
      roll: lerpAngle(this.currentPose.roll, rawPose.roll, this.alphaRot),
      yaw: lerpAngle(this.currentPose.yaw, rawPose.yaw, this.alphaRot),
      pitch: lerpAngle(this.currentPose.pitch, rawPose.pitch, this.alphaRot),
      pupillaryDistancePx: lerp(
        this.currentPose.pupillaryDistancePx,
        rawPose.pupillaryDistancePx,
        this.alphaScale
      ),
      eyeDistance: lerp(this.currentPose.eyeDistance, rawPose.eyeDistance, this.alphaScale),
      leftEyeCenter: {
        x: lerp(this.currentPose.leftEyeCenter.x, rawPose.leftEyeCenter.x, this.alphaPos),
        y: lerp(this.currentPose.leftEyeCenter.y, rawPose.leftEyeCenter.y, this.alphaPos),
        z: lerp(this.currentPose.leftEyeCenter.z, rawPose.leftEyeCenter.z, this.alphaPos),
      },
      rightEyeCenter: {
        x: lerp(this.currentPose.rightEyeCenter.x, rawPose.rightEyeCenter.x, this.alphaPos),
        y: lerp(this.currentPose.rightEyeCenter.y, rawPose.rightEyeCenter.y, this.alphaPos),
        z: lerp(this.currentPose.rightEyeCenter.z, rawPose.rightEyeCenter.z, this.alphaPos),
      },
      eyeCenter: {
        x: lerp(this.currentPose.eyeCenter.x, rawPose.eyeCenter.x, this.alphaPos),
        y: lerp(this.currentPose.eyeCenter.y, rawPose.eyeCenter.y, this.alphaPos),
        z: lerp(this.currentPose.eyeCenter.z, rawPose.eyeCenter.z, this.alphaPos),
      },
      noseBridge: {
        x: lerp(this.currentPose.noseBridge.x, rawPose.noseBridge.x, this.alphaPos),
        y: lerp(this.currentPose.noseBridge.y, rawPose.noseBridge.y, this.alphaPos),
        z: lerp(this.currentPose.noseBridge.z, rawPose.noseBridge.z, this.alphaPos),
      },
      faceCenter: {
        x: lerp(this.currentPose.faceCenter.x, rawPose.faceCenter.x, this.alphaPos),
        y: lerp(this.currentPose.faceCenter.y, rawPose.faceCenter.y, this.alphaPos),
        z: lerp(this.currentPose.faceCenter.z, rawPose.faceCenter.z, this.alphaPos),
      },
      leftTemple: {
        x: lerp(this.currentPose.leftTemple.x, rawPose.leftTemple.x, this.alphaPos),
        y: lerp(this.currentPose.leftTemple.y, rawPose.leftTemple.y, this.alphaPos),
        z: lerp(this.currentPose.leftTemple.z, rawPose.leftTemple.z, this.alphaPos),
      },
      rightTemple: {
        x: lerp(this.currentPose.rightTemple.x, rawPose.rightTemple.x, this.alphaPos),
        y: lerp(this.currentPose.rightTemple.y, rawPose.rightTemple.y, this.alphaPos),
        z: lerp(this.currentPose.rightTemple.z, rawPose.rightTemple.z, this.alphaPos),
      },
      faceShapeEstimate: rawPose.faceShapeEstimate || this.currentPose.faceShapeEstimate,
      rawLandmarks: rawPose.rawLandmarks,
      landmarkCount: rawPose.landmarkCount,
      timestamp: now,
    };

    this.currentPose = smoothed;
    return smoothed;
  }

  public reset(): void {
    this.currentPose = null;
    this.lastSeenTime = 0;
  }
}

/**
 * Estimate Face Shape from landmark proportions
 */
function estimateFaceShapeFromLandmarks(landmarks: any[]): FaceShape {
  try {
    const foreheadTop = landmarks[LANDMARKS.FOREHEAD_TOP];
    const chin = landmarks[LANDMARKS.CHIN];
    const leftCheek = landmarks[LANDMARKS.LEFT_CHEEKBONE];
    const rightCheek = landmarks[LANDMARKS.RIGHT_CHEEKBONE];
    const leftJaw = landmarks[LANDMARKS.LEFT_JAW];
    const rightJaw = landmarks[LANDMARKS.RIGHT_JAW];

    if (!foreheadTop || !chin || !leftCheek || !rightCheek) return 'Oval';

    const faceLength = Math.hypot(chin.x - foreheadTop.x, chin.y - foreheadTop.y);
    const cheekWidth = Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y);
    const jawWidth = leftJaw && rightJaw ? Math.hypot(rightJaw.x - leftJaw.x, rightJaw.y - leftJaw.y) : cheekWidth * 0.8;

    const ratio = faceLength / (cheekWidth || 1);
    const jawToCheek = jawWidth / (cheekWidth || 1);

    if (ratio > 1.4) return 'Oval';
    if (ratio < 1.15 && jawToCheek > 0.88) return 'Square';
    if (ratio < 1.2) return 'Round';
    if (jawToCheek < 0.72) return 'Heart';
    if (jawToCheek < 0.8 && ratio >= 1.25) return 'Diamond';
    return 'Oval';
  } catch {
    return 'Oval';
  }
}

/**
 * Process video frame to estimate precise 3D face position, pupillary distance, and orientation.
 * Handles CSS object-fit: cover mapping and selfie mirror transform with pixel precision.
 */
export function extractPoseFromLandmarks(
  landmarks: any[],
  viewport: ARViewportDimensions,
  isMirrored = true,
  faceCount = 1
): FaceTrackingPose {
  const { containerWidth, containerHeight, videoWidth, videoHeight } = viewport;

  const vWidth = videoWidth || 1280;
  const vHeight = videoHeight || 720;
  const cWidth = containerWidth || 1280;
  const cHeight = containerHeight || 720;

  // Precise object-fit: cover scale factor and offsets
  const coverScale = Math.max(cWidth / vWidth, cHeight / vHeight);
  const scaledVideoWidth = vWidth * coverScale;
  const scaledVideoHeight = vHeight * coverScale;
  const offsetX = (cWidth - scaledVideoWidth) / 2;
  const offsetY = (cHeight - scaledVideoHeight) / 2;

  // Map normalized [0, 1] landmark coordinates to screen pixel space
  const mapPoint = (lm: { x: number; y: number; z?: number }): Point3D => {
    if (!lm) return { x: 0, y: 0, z: 0 };
    // When video is mirrored horizontally (selfie mode): x becomes 1 - x
    const normX = isMirrored ? 1 - lm.x : lm.x;
    const px = offsetX + normX * scaledVideoWidth;
    const py = offsetY + lm.y * scaledVideoHeight;
    const pz = (lm.z || 0) * scaledVideoWidth;
    return { x: px, y: py, z: pz };
  };

  // Helper to compute average of multiple landmark indices
  const getAveragePoint = (indices: number[]): { x: number; y: number; z: number } => {
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let count = 0;
    for (const idx of indices) {
      if (landmarks[idx]) {
        sumX += landmarks[idx].x;
        sumY += landmarks[idx].y;
        sumZ += landmarks[idx].z || 0;
        count++;
      }
    }
    if (count === 0) return { x: 0.5, y: 0.5, z: 0 };
    return { x: sumX / count, y: sumY / count, z: sumZ / count };
  };

  // 1. Calculate Left & Right Iris/Eye centers with fallback
  const hasIrisLandmarks = landmarks.length >= 478 && landmarks[LANDMARKS.LEFT_IRIS_CENTER] && landmarks[LANDMARKS.RIGHT_IRIS_CENTER];

  const leftEyeRaw = hasIrisLandmarks
    ? getAveragePoint(LANDMARKS.LEFT_IRIS_POINTS)
    : getAveragePoint(LANDMARKS.LEFT_EYE_POINTS);

  const rightEyeRaw = hasIrisLandmarks
    ? getAveragePoint(LANDMARKS.RIGHT_IRIS_POINTS)
    : getAveragePoint(LANDMARKS.RIGHT_EYE_POINTS);

  const leftEyeScreen = mapPoint(leftEyeRaw);
  const rightEyeScreen = mapPoint(rightEyeRaw);

  // Screen Left Eye (smaller x on user's screen) & Screen Right Eye (larger x on user's screen)
  const screenLeftEye = leftEyeScreen.x <= rightEyeScreen.x ? leftEyeScreen : rightEyeScreen;
  const screenRightEye = leftEyeScreen.x <= rightEyeScreen.x ? rightEyeScreen : leftEyeScreen;

  // 2. Eye Distance & Head Rotation (Roll)
  const dx = screenRightEye.x - screenLeftEye.x;
  const dy = screenRightEye.y - screenLeftEye.y;
  const eyeDistance = Math.max(10, Math.hypot(dx, dy));
  const pupillaryDistancePx = eyeDistance;
  const roll = (Math.atan2(dy, dx) * 180) / Math.PI;

  // 3. TRUE EYE MIDPOINT (Direct anchor for eyewear lenses)
  const eyeMidpointX = (screenLeftEye.x + screenRightEye.x) / 2;
  const eyeMidpointY = (screenLeftEye.y + screenRightEye.y) / 2;
  const eyeMidpointZ = (screenLeftEye.z + screenRightEye.z) / 2;

  const eyeCenter: Point3D = {
    x: eyeMidpointX,
    y: eyeMidpointY,
    z: eyeMidpointZ,
  };

  // 4. Primary Center is strictly the EYE MIDPOINT
  const centerX = eyeMidpointX;
  const centerY = eyeMidpointY;

  // 5. Scaled Frame Dimensions based on eyeDistance and SVG geometry
  // In the SVG (300x175), distance between lens centers is exactly 136 units.
  // frameWidth = eyeDistance * (300 / 136) ensures distance between lens centers matches eyeDistance.
  const frameWidth = eyeDistance * (300 / 136);
  const frameHeight = frameWidth * (175 / 300);

  const referenceEyeDistance = 64;
  const scale = eyeDistance / referenceEyeDistance;

  // 6. Anatomical landmarks
  const bridgeNasion = mapPoint(landmarks[LANDMARKS.NOSE_BRIDGE_TOP] || landmarks[LANDMARKS.NOSE_BRIDGE_MID] || { x: 0.5, y: 0.45 });
  const noseTip = mapPoint(landmarks[LANDMARKS.NOSE_TIP] || { x: 0.5, y: 0.55 });
  const chin = mapPoint(landmarks[LANDMARKS.CHIN] || { x: 0.5, y: 0.8 });
  const leftTemple = mapPoint(landmarks[LANDMARKS.LEFT_TEMPLE] || { x: 0.2, y: 0.4 });
  const rightTemple = mapPoint(landmarks[LANDMARKS.RIGHT_TEMPLE] || { x: 0.8, y: 0.4 });

  const faceCenter: Point3D = {
    x: (bridgeNasion.x + noseTip.x) / 2,
    y: (bridgeNasion.y + chin.y) / 2,
    z: bridgeNasion.z,
  };

  // 7. Yaw calculation (head turned left/right)
  const distLeftTemple = Math.abs(bridgeNasion.x - leftTemple.x);
  const distRightTemple = Math.abs(rightTemple.x - bridgeNasion.x);
  const templeDiff = (distRightTemple - distLeftTemple) / (distLeftTemple + distRightTemple || 1);
  const yaw = Math.max(-45, Math.min(45, templeDiff * 65));

  // 8. Pitch calculation (head tilted up/down)
  const eyeToNose = noseTip.y - bridgeNasion.y;
  const eyeToChin = chin.y - bridgeNasion.y;
  const pitchRatio = eyeToNose / (eyeToChin || 1);
  const pitch = Math.max(-35, Math.min(35, (pitchRatio - 0.42) * 90));

  const faceShapeEstimate = estimateFaceShapeFromLandmarks(landmarks);
  const rawLandmarks: Point3D[] = landmarks.map((lm) => mapPoint(lm));

  return {
    isDetected: true,
    faceCount,
    confidence: 0.96,
    centerX,
    centerY,
    width: frameWidth,
    height: frameHeight,
    scale,
    roll,
    yaw,
    pitch,
    pupillaryDistancePx,
    leftEyeCenter: screenLeftEye,
    rightEyeCenter: screenRightEye,
    eyeCenter,
    eyeDistance,
    noseBridge: bridgeNasion,
    faceCenter,
    leftTemple,
    rightTemple,
    faceShapeEstimate,
    rawLandmarks,
    landmarkCount: landmarks.length,
    timestamp: performance.now(),
  };
}

/**
 * Draw diagnostic overlay (FPS, face mesh points, eye distance line, orientation axes, red eye dots, yellow midpoint, blue anchor)
 */
export function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  pose: FaceTrackingPose | null,
  fps: number,
  videoDims: { width: number; height: number },
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.save();

  // 1. Draw HUD Info Box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
  ctx.fillRect(16, 16, 320, 275);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 16, 320, 275);

  ctx.fillStyle = '#FB923C'; // Orange
  ctx.font = 'bold 12px monospace';
  ctx.fillText('DIAGNOSTIC AR HUD (?debugAR=true)', 26, 36);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '11px monospace';
  ctx.fillText(`FPS: ${Math.round(fps)}`, 26, 54);
  ctx.fillText(
    `Face Detected: ${pose?.isDetected ? 'YES (' + (pose.faceCount || 1) + ')' : 'NO'}`,
    26,
    70
  );
  ctx.fillText(`Landmarks: ${pose?.landmarkCount || 0} pts`, 26, 86);
  ctx.fillText(
    `Video Size: ${videoDims.width}x${videoDims.height} (object-fit: cover)`,
    26,
    102
  );
  ctx.fillText(
    `Canvas Size: ${canvasWidth}x${canvasHeight} (DPR: ${window.devicePixelRatio || 1})`,
    26,
    118
  );
  ctx.fillText(
    `Mirror Transform: scaleX(-1) [Active: YES]`,
    26,
    134
  );
  ctx.fillText(
    `Left Eye Screen: ${pose ? Math.round(pose.leftEyeCenter.x) + ', ' + Math.round(pose.leftEyeCenter.y) : 'N/A'}`,
    26,
    150
  );
  ctx.fillText(
    `Right Eye Screen: ${pose ? Math.round(pose.rightEyeCenter.x) + ', ' + Math.round(pose.rightEyeCenter.y) : 'N/A'}`,
    26,
    166
  );
  ctx.fillText(
    `Eye Distance: ${pose ? Math.round(pose.eyeDistance) + ' px' : 'N/A'}`,
    26,
    182
  );
  ctx.fillText(
    `Eye Midpoint: ${pose ? Math.round(pose.eyeCenter.x) + ', ' + Math.round(pose.eyeCenter.y) : 'N/A'}`,
    26,
    198
  );
  ctx.fillText(
    `Frame Width/Scale: ${pose ? Math.round(pose.width) + 'px (' + pose.scale.toFixed(2) + 'x)' : 'N/A'}`,
    26,
    214
  );
  ctx.fillText(
    `Roll: ${pose ? pose.roll.toFixed(1) + '°' : 'N/A'} | Yaw: ${pose ? pose.yaw.toFixed(1) + '°' : 'N/A'}`,
    26,
    230
  );
  ctx.fillText(
    `Pitch: ${pose ? pose.pitch.toFixed(1) + '°' : 'N/A'}`,
    26,
    246
  );
  ctx.fillText(
    `Calibration: 2-Point Optical Lens Alignment`,
    26,
    262
  );

  // 2. Draw Landmark Diagnostic Points & Phase 13 Geometric Glasses if face is detected
  if (pose && pose.isDetected) {
    const rad = (pose.roll * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    // A. Draw Eye Distance Dashed Baseline
    ctx.strokeStyle = '#F59E0B'; // Amber
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pose.leftEyeCenter.x, pose.leftEyeCenter.y);
    ctx.lineTo(pose.rightEyeCenter.x, pose.rightEyeCenter.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // B. Draw Left Eye Center (RED DOT)
    ctx.fillStyle = '#EF4444'; // Red
    ctx.beginPath();
    ctx.arc(pose.leftEyeCenter.x, pose.leftEyeCenter.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('L Eye', pose.leftEyeCenter.x - 16, pose.leftEyeCenter.y - 12);

    // C. Draw Right Eye Center (RED DOT)
    ctx.fillStyle = '#EF4444'; // Red
    ctx.beginPath();
    ctx.arc(pose.rightEyeCenter.x, pose.rightEyeCenter.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('R Eye', pose.rightEyeCenter.x - 16, pose.rightEyeCenter.y - 12);

    // D. Draw Eye Midpoint (YELLOW DOT)
    ctx.fillStyle = '#FBBF24'; // Yellow
    ctx.beginPath();
    ctx.arc(pose.eyeCenter.x, pose.eyeCenter.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('Midpoint', pose.eyeCenter.x - 24, pose.eyeCenter.y + 18);

    // E. Draw Nose Bridge (GREEN DOT)
    if (pose.noseBridge) {
      ctx.fillStyle = '#10B981'; // Green
      ctx.beginPath();
      ctx.arc(pose.noseBridge.x, pose.noseBridge.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Bridge', pose.noseBridge.x - 16, pose.noseBridge.y + 14);
    }

    // F. Draw Phase 13 Geometric Debug Glasses (Wireframe directly on pupil centers)
    const lensWidth = pose.eyeDistance * 0.78;
    const lensHeight = lensWidth * 0.72;

    const drawRotatedRect = (cx: number, cy: number, w: number, h: number, color: string) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rad);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(-w / 2, -h / 2, w, h);

      // Lens Center Crosshair
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 8);
      ctx.strokeStyle = '#38BDF8'; // Cyan
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    };

    // Left Lens Box (Cyan)
    drawRotatedRect(pose.leftEyeCenter.x, pose.leftEyeCenter.y, lensWidth, lensHeight, '#06B6D4');
    // Right Lens Box (Cyan)
    drawRotatedRect(pose.rightEyeCenter.x, pose.rightEyeCenter.y, lensWidth, lensHeight, '#06B6D4');

    // Nose Bridge Connecting Wireframe
    ctx.save();
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(
      pose.leftEyeCenter.x + cosR * (lensWidth / 2),
      pose.leftEyeCenter.y + sinR * (lensWidth / 2)
    );
    ctx.lineTo(
      pose.rightEyeCenter.x - cosR * (lensWidth / 2),
      pose.rightEyeCenter.y - sinR * (lensWidth / 2)
    );
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}


