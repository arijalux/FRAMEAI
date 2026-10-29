import { AR as ArucoLib } from '../../vendor/js-aruco2/aruco.js';
import { POS as PositLib } from '../../vendor/js-aruco2/posit1.js';
import { CARD_MARKER } from './realSizeModels';

interface ArucoNamespace {
  Detector: new (config?: { dictionaryName?: string }) => {
    detect(image: ImageData): { id: number; corners: { x: number; y: number }[] }[];
  };
  Dictionary: new (name: string) => { generateSVG(id: number): string };
}
interface PositPose {
  bestError: number;
  bestRotation: number[][];
  bestTranslation: number[];
}
interface PositNamespace {
  Posit: new (modelSize: number, focalLength: number) => { pose(corners: { x: number; y: number }[]): PositPose };
}

const AR = ArucoLib as unknown as ArucoNamespace;
const POS = PositLib as unknown as PositNamespace;

/** The card marker as an SVG string (one unit per marker cell) */
export const markerSvg = () => new AR.Dictionary(CARD_MARKER.dictionary).generateSVG(CARD_MARKER.id);

export interface MarkerPose extends PositPose {
  /** Focal length in pixels used for the estimate; the renderer must use the same one */
  focalLength: number;
  width: number;
  height: number;
}

/**
 * Finds the card marker in a frame and estimates its pose in millimetres. The focal length
 * is assumed (about a 53° horizontal field of view); since the renderer uses the same value,
 * the glasses stay true to size relative to the paper even if the real lens differs.
 */
export class MarkerTracker {
  private detector = new AR.Detector({ dictionaryName: CARD_MARKER.dictionary });
  private posit: InstanceType<PositNamespace['Posit']> | null = null;
  private positWidth = 0;

  detect(image: ImageData): MarkerPose | null {
    const marker = this.detector.detect(image).find((m) => m.id === CARD_MARKER.id);
    if (!marker) return null;
    const { width, height } = image;
    const focalLength = width;
    if (!this.posit || this.positWidth !== width) {
      this.posit = new POS.Posit(CARD_MARKER.sizeMm, focalLength);
      this.positWidth = width;
    }
    // POSIT wants corners relative to the image centre with y pointing up
    const corners = marker.corners.map((c) => ({ x: c.x - width / 2, y: height / 2 - c.y }));
    return { ...this.posit.pose(corners), focalLength, width, height };
  }
}
