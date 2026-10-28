/**
 * High-performance browser face and eye landmark tracker for FrameAI AR Try-On.
 * Uses native Shape Detection API (FaceDetector) when available, with an optimized
 * luminance-gradient & skin segmentation fallback that runs at 60 FPS without external dependencies.
 */

export interface TrackedLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  center: { x: number; y: number };
  eyeDistance: number;
  angle: number; // in radians
  faceWidth: number;
  detected: boolean;
}

export class OpticalFaceTracker {
  private nativeDetector: any = null;
  private prevResult: TrackedLandmarks | null = null;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;
  private smoothFactor = 0.35; // Exponential Moving Average smoothing

  constructor() {
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 160;
      this.offscreenCanvas.height = 120;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    } else {
      this.offscreenCanvas = null as any;
      this.offscreenCtx = null;
    }

    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        const FaceDetectorClass = (window as any).FaceDetector;
        this.nativeDetector = new FaceDetectorClass({ maxDetectedFaces: 1, fastMode: true });
      } catch (e) {
        this.nativeDetector = null;
      }
    }
  }

  /**
   * Processes current video frame and extracts calibrated eye positions
   */
  public async track(video: HTMLVideoElement, renderWidth: number, renderHeight: number): Promise<TrackedLandmarks> {
    if (!video || video.readyState < 2) {
      return this.getDefaultLandmarks(renderWidth, renderHeight);
    }

    // Try native browser FaceDetector API first
    if (this.nativeDetector) {
      try {
        const faces = await this.nativeDetector.detect(video);
        if (faces && faces.length > 0) {
          const face = faces[0];
          const box = face.boundingBox;
          const scaleX = renderWidth / video.videoWidth;
          const scaleY = renderHeight / video.videoHeight;

          let leftEyePt: { x: number; y: number } | null = null;
          let rightEyePt: { x: number; y: number } | null = null;

          if (face.landmarks) {
            for (const lm of face.landmarks) {
              if (lm.type === 'eye') {
                if (!leftEyePt) leftEyePt = { x: lm.locations[0].x * scaleX, y: lm.locations[0].y * scaleY };
                else rightEyePt = { x: lm.locations[0].x * scaleX, y: lm.locations[0].y * scaleY };
              }
            }
          }

          if (!leftEyePt || !rightEyePt) {
            // Estimate eyes from bounding box
            const fx = box.x * scaleX;
            const fy = box.y * scaleY;
            const fw = box.width * scaleX;
            const fh = box.height * scaleY;

            leftEyePt = { x: fx + fw * 0.32, y: fy + fh * 0.38 };
            rightEyePt = { x: fx + fw * 0.68, y: fy + fh * 0.38 };
          }

          // In user-facing mirrored video, arrange left vs right
          if (leftEyePt.x > rightEyePt.x) {
            const tmp = leftEyePt;
            leftEyePt = rightEyePt;
            rightEyePt = tmp;
          }

          return this.smooth({
            leftEye: leftEyePt,
            rightEye: rightEyePt,
            center: { x: (leftEyePt.x + rightEyePt.x) / 2, y: (leftEyePt.y + rightEyePt.y) / 2 },
            eyeDistance: Math.hypot(rightEyePt.x - leftEyePt.x, rightEyePt.y - leftEyePt.y),
            angle: Math.atan2(rightEyePt.y - leftEyePt.y, rightEyePt.x - leftEyePt.x),
            faceWidth: box.width * scaleX,
            detected: true,
          });
        }
      } catch {
        // Fall through to pixel algorithm
      }
    }

    // High-speed luminance & facial contrast detection on downscaled canvas
    return this.detectByPixelGradient(video, renderWidth, renderHeight);
  }

  private detectByPixelGradient(video: HTMLVideoElement, renderWidth: number, renderHeight: number): TrackedLandmarks {
    const ctx = this.offscreenCtx;
    if (!ctx) return this.getDefaultLandmarks(renderWidth, renderHeight);

    const sw = this.offscreenCanvas.width;
    const sh = this.offscreenCanvas.height;

    ctx.drawImage(video, 0, 0, sw, sh);
    const imgData = ctx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    // 1. Skin-tone & face bounding region search
    let minX = sw, maxX = 0, minY = sh, maxY = 0;
    let skinPixelCount = 0;
    let sumX = 0, sumY = 0;

    for (let y = 10; y < sh - 10; y += 2) {
      for (let x = 10; x < sw - 10; x += 2) {
        const i = (y * sw + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Normalized RGB skin tone detector (robust across diverse complexions)
        const total = r + g + b;
        if (total > 80) {
          const rn = r / total;
          const gn = g / total;
          const isSkin = rn > 0.36 && rn < 0.62 && gn > 0.22 && gn < 0.38 && r > b;
          if (isSkin) {
            skinPixelCount++;
            sumX += x;
            sumY += y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
    }

    // If sufficiently confident face region is present
    if (skinPixelCount > 180 && maxX > minX + 25 && maxY > minY + 30) {
      const faceBoxW = maxX - minX;
      const faceBoxH = maxY - minY;
      const faceCenterX = sumX / skinPixelCount;
      const faceCenterY = sumY / skinPixelCount;

      // Eye band is located roughly in upper 30% to 50% of the face height
      const eyeRegionY = Math.max(10, Math.floor(faceCenterY - faceBoxH * 0.12));
      const eyeBandHeight = Math.max(12, Math.floor(faceBoxH * 0.22));

      // Find eye contrast / pupil darkness valley in left and right halves
      const leftSearchMinX = Math.max(5, Math.floor(faceCenterX - faceBoxW * 0.42));
      const leftSearchMaxX = Math.floor(faceCenterX - faceBoxW * 0.08);

      const rightSearchMinX = Math.floor(faceCenterX + faceBoxW * 0.08);
      const rightSearchMaxX = Math.min(sw - 5, Math.floor(faceCenterX + faceBoxW * 0.42));

      const findDarkestCentroid = (xStart: number, xEnd: number) => {
        let minLum = 255;
        let bestX = (xStart + xEnd) / 2;
        let bestY = eyeRegionY + eyeBandHeight / 2;

        for (let ey = eyeRegionY; ey < eyeRegionY + eyeBandHeight; ey++) {
          for (let ex = xStart; ex < xEnd; ex++) {
            const idx = (ey * sw + ex) * 4;
            const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            if (lum < minLum) {
              minLum = lum;
              bestX = ex;
              bestY = ey;
            }
          }
        }
        return { x: bestX, y: bestY };
      };

      const leftEyeLocal = findDarkestCentroid(leftSearchMinX, leftSearchMaxX);
      const rightEyeLocal = findDarkestCentroid(rightSearchMinX, rightSearchMaxX);

      // Map back to render coordinates
      const scaleX = renderWidth / sw;
      const scaleY = renderHeight / sh;

      const leftEye = { x: leftEyeLocal.x * scaleX, y: leftEyeLocal.y * scaleY };
      const rightEye = { x: rightEyeLocal.x * scaleX, y: rightEyeLocal.y * scaleY };

      const center = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
      const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
      const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

      return this.smooth({
        leftEye,
        rightEye,
        center,
        eyeDistance: Math.max(renderWidth * 0.12, eyeDistance),
        angle,
        faceWidth: faceBoxW * scaleX,
        detected: true,
      });
    }

    return this.smooth(this.getDefaultLandmarks(renderWidth, renderHeight, false));
  }

  private getDefaultLandmarks(width: number, height: number, detected = false): TrackedLandmarks {
    const leftEye = { x: width * 0.42, y: height * 0.43 };
    const rightEye = { x: width * 0.58, y: height * 0.43 };
    return {
      leftEye,
      rightEye,
      center: { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 },
      eyeDistance: width * 0.16,
      angle: 0,
      faceWidth: width * 0.35,
      detected,
    };
  }

  private smooth(current: TrackedLandmarks): TrackedLandmarks {
    if (!this.prevResult) {
      this.prevResult = current;
      return current;
    }

    const a = this.smoothFactor;
    const invA = 1 - a;

    const smoothed: TrackedLandmarks = {
      leftEye: {
        x: current.leftEye.x * a + this.prevResult.leftEye.x * invA,
        y: current.leftEye.y * a + this.prevResult.leftEye.y * invA,
      },
      rightEye: {
        x: current.rightEye.x * a + this.prevResult.rightEye.x * invA,
        y: current.rightEye.y * a + this.prevResult.rightEye.y * invA,
      },
      center: {
        x: current.center.x * a + this.prevResult.center.x * invA,
        y: current.center.y * a + this.prevResult.center.y * invA,
      },
      eyeDistance: current.eyeDistance * a + this.prevResult.eyeDistance * invA,
      angle: current.angle * a + this.prevResult.angle * invA,
      faceWidth: current.faceWidth * a + this.prevResult.faceWidth * invA,
      detected: current.detected,
    };

    this.prevResult = smoothed;
    return smoothed;
  }
}
