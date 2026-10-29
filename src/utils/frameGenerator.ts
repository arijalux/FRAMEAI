import { FaceAnalysisResult, FrameShape } from '../types';

/**
 * Parametric wooden frame for CNC / laser cutting.
 * All values are millimetres. The SVG output uses 1 user unit = 1 mm so it imports at true size.
 */
export interface CustomFrameParams {
  shape: FrameShape;
  lensWidth: number; // A: lens width
  lensHeight: number; // B: lens height
  bridgeWidth: number; // DBL: distance between lenses
  templeLength: number; // hinge to tip
  rimWidth: number; // wood around each lens
  engraving: string; // engraved on the inside of the right temple
}

export const PARAM_LIMITS = {
  lensWidth: { min: 40, max: 60 },
  lensHeight: { min: 26, max: 56 },
  bridgeWidth: { min: 14, max: 24 },
  templeLength: { min: 130, max: 150 },
  rimWidth: { min: 4, max: 8 },
} as const;

// Lens height as a share of lens width for each shape
const HEIGHT_RATIO: Record<FrameShape, number> = {
  Round: 0.92,
  Oval: 0.72,
  Square: 0.78,
  Geometric: 0.82,
  Aviator: 0.86,
  'Cat-Eye': 0.7,
};

// Superellipse exponent: 2 is an ellipse, higher is boxier
const ROUNDNESS: Record<FrameShape, number> = {
  Round: 2,
  Oval: 2.2,
  Square: 4.5,
  Geometric: 3,
  Aviator: 2.4,
  'Cat-Eye': 2.6,
};

const HINGE_TAB = 5; // how far the hinge block sticks out past the rim
const CUT_COLOR = '#FF0000';
const ENGRAVE_COLOR = '#000000';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export const defaultLensHeight = (shape: FrameShape, lensWidth: number) => Math.round(lensWidth * HEIGHT_RATIO[shape]);

/**
 * Sizes a frame from the face scan. There is no absolute face width in the scan, so the
 * total frame width is estimated from PD (adult faces are roughly 2.2 × PD wide).
 */
export const paramsFromFace = (face: Pick<FaceAnalysisResult, 'estimatedPd' | 'recommendedShapes'>): CustomFrameParams => {
  const shape = face.recommendedShapes[0] ?? 'Round';
  const pd = clamp(face.estimatedPd || 63, 54, 74);
  const bridgeWidth = 18;
  const totalWidth = clamp(pd * 2.2, 124, 150);
  const rimWidth = 5;
  // Total = 2 lenses + bridge + outer rim on each side + hinge tabs
  const lensWidth = Math.round(
    clamp((totalWidth - bridgeWidth - 2 * rimWidth - 2 * HINGE_TAB) / 2, PARAM_LIMITS.lensWidth.min, PARAM_LIMITS.lensWidth.max)
  );
  const templeLength = totalWidth < 132 ? 135 : totalWidth > 142 ? 145 : 140;
  return {
    shape,
    lensWidth,
    lensHeight: defaultLensHeight(shape, lensWidth),
    bridgeWidth,
    templeLength,
    rimWidth,
    engraving: '',
  };
};

export const DEFAULT_PARAMS: CustomFrameParams = paramsFromFace({ estimatedPd: 63, recommendedShapes: ['Round'] });

/** Size code printed on temples (lens-bridge-temple), e.g. 50-18-140 */
export const sizeCode = (p: Pick<CustomFrameParams, 'lensWidth' | 'bridgeWidth' | 'templeLength'>) =>
  `${p.lensWidth}-${p.bridgeWidth}-${p.templeLength}`;

export const frameTotalWidth = (p: CustomFrameParams) => 2 * p.lensWidth + p.bridgeWidth + 2 * p.rimWidth + 2 * HINGE_TAB;

/** Frame PD (lens centre to lens centre); lenses get decentred inward when it exceeds the wearer's PD */
export const framePd = (p: Pick<CustomFrameParams, 'lensWidth' | 'bridgeWidth'>) => p.lensWidth + p.bridgeWidth;

/**
 * Vertical extent of one lens shape at horizontal offset x from its centre.
 * `outward` is +1 when positive x points away from the nose (right lens), -1 for the left lens.
 * Returns null outside the shape. SVG y grows downward, so top < bottom.
 */
const lensSpan = (shape: FrameShape, a: number, b: number, x: number, outward: 1 | -1) => {
  const t = Math.abs(x) / a;
  if (t > 1) return null;
  const n = ROUNDNESS[shape];
  const h = b * Math.pow(1 - Math.pow(t, n), 1 / n);
  const side = (x * outward) / a; // -1 at the nose, +1 at the temple
  let top = -h;
  let bottom = h;
  if (shape === 'Aviator') {
    // Teardrop: flat brow, deep drop toward the nose
    top = -h * 0.85;
    bottom = h * (1.15 - 0.2 * side);
  } else if (shape === 'Cat-Eye') {
    // Upswept outer corner
    top = -h - b * 0.28 * Math.max(0, side) ** 2;
    bottom = h * (1 - 0.12 * Math.max(0, side));
  }
  return { top, bottom };
};

type Pt = [number, number];

const pathFrom = (pts: Pt[]) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${round1(x)} ${round1(y)}`).join(' ') + ' Z';

const lensOutline = (shape: FrameShape, cx: number, a: number, b: number, outward: 1 | -1, step = 0.5): Pt[] => {
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (let x = -a; x <= a + 1e-6; x += step) {
    const s = lensSpan(shape, a, b, x, outward);
    if (!s) continue;
    top.push([cx + x, s.top]);
    bottom.push([cx + x, s.bottom]);
  }
  return [...top, ...bottom.reverse()];
};

export interface FrameGeometry {
  /** Outer contour of the front piece */
  front: string;
  /** Lens openings */
  lenses: [string, string];
  /** Side profile of one temple, starting at the hinge */
  temple: string;
  width: number;
  height: number;
  /** Highest point of the front (negative, above the lens centres) */
  top: number;
  templeWidth: number;
  templeHeight: number;
}

/** Builds the cut paths, centred on the bridge at x = 0 and lens centres at y = 0 */
export const buildFrameGeometry = (p: CustomFrameParams): FrameGeometry => {
  const a = p.lensWidth / 2;
  const b = p.lensHeight / 2;
  const r = p.rimWidth;
  const cx = a + p.bridgeWidth / 2; // lens centre offset from the bridge
  const outerA = a + r;
  const outerB = b + r;
  const halfWidth = cx + outerA + HINGE_TAB;

  // The front is x-monotone: every vertical slice is one interval, so its outline is the
  // top envelope left → right followed by the bottom envelope right → left.
  const bridgeTop = -outerB * 0.55;
  const bridgeBottom = bridgeTop + Math.max(7, r + 3);
  const hingeTop = -outerB * 0.62;
  const hingeBottom = hingeTop + 9;

  const top: Pt[] = [];
  const bottom: Pt[] = [];
  const step = 0.5;
  for (let x = -halfWidth; x <= halfWidth + 1e-6; x += step) {
    let lo = Infinity;
    let hi = -Infinity;
    const add = (t: number, btm: number) => {
      lo = Math.min(lo, t);
      hi = Math.max(hi, btm);
    };
    for (const side of [-1, 1] as const) {
      const s = lensSpan(p.shape, outerA, outerB, x - side * cx, side);
      if (s) add(s.top, s.bottom);
      // Hinge block on the outer edge, overlapping the rim so the slice stays continuous
      const edge = side * (cx + outerA);
      if (side * (x - edge) >= -r && side * (x - edge) <= HINGE_TAB) add(hingeTop, hingeBottom);
    }
    if (Math.abs(x) <= cx - outerA + r * 1.5) add(bridgeTop, bridgeBottom);
    if (lo === Infinity) continue;
    top.push([x, lo]);
    bottom.push([x, hi]);
  }
  const frontPts = [...top, ...bottom.reverse()];
  const ys = frontPts.map(([, y]) => y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Temple side profile: straight arm, then a 22° drop behind the ear, tapering 5 → 3.5 mm
  const drop = 30;
  const straight = p.templeLength - drop;
  const angle = (22 * Math.PI) / 180;
  const tip: Pt = [straight + drop * Math.cos(angle), drop * Math.sin(angle)];
  const upper: Pt[] = [[0, -2.5], [straight, -2], [tip[0] + 1.75 * Math.sin(angle), tip[1] - 1.75 * Math.cos(angle)]];
  const lower: Pt[] = [[tip[0] - 1.75 * Math.sin(angle), tip[1] + 1.75 * Math.cos(angle)], [straight - 1, 2], [0, 2.5]];
  const temple =
    `M${round1(upper[0][0])} ${upper[0][1]} L${round1(upper[1][0])} ${upper[1][1]} L${round1(upper[2][0])} ${round1(upper[2][1])}` +
    ` A1.75 1.75 0 0 1 ${round1(lower[0][0])} ${round1(lower[0][1])}` +
    ` L${round1(lower[1][0])} ${lower[1][1]} L${lower[2][0]} ${lower[2][1]} Z`;

  return {
    front: pathFrom(frontPts),
    lenses: [
      pathFrom(lensOutline(p.shape, -cx, a, b, -1)),
      pathFrom(lensOutline(p.shape, cx, a, b, 1)),
    ],
    temple,
    width: halfWidth * 2,
    height: maxY - minY,
    top: minY,
    templeWidth: tip[0] + 2,
    templeHeight: tip[1] + 5,
  };
};

const escapeXml = (s: string) =>
  s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);

/**
 * Cutting sheet as SVG at true size (mm): front piece on top, two temples below.
 * Red hairlines are cuts, black text is engraving — the usual laser software convention.
 */
export const buildCutSvg = (p: CustomFrameParams): string => {
  const g = buildFrameGeometry(p);
  const margin = 6;
  const gap = 8;
  const sheetWidth = Math.ceil(Math.max(g.width, g.templeWidth) + margin * 2);
  const frontY = margin - g.top;
  const templeY1 = margin + g.height + gap;
  const templeY2 = templeY1 + g.templeHeight + gap;
  const sheetHeight = Math.ceil(templeY2 + g.templeHeight + margin);
  const frontX = sheetWidth / 2;
  const cut = `fill="none" stroke="${CUT_COLOR}" stroke-width="0.1"`;
  const text = `fill="${ENGRAVE_COLOR}" font-family="Arial, Helvetica, sans-serif"`;
  const engraving = p.engraving.trim().slice(0, 24);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidth}mm" height="${sheetHeight}mm" viewBox="0 0 ${sheetWidth} ${sheetHeight}">`,
    `<title>FrameAI × BJ Homemade ${sizeCode(p)}</title>`,
    `<g id="front" transform="translate(${round1(frontX)} ${round1(frontY)})">`,
    `<path id="front-outline" d="${g.front}" ${cut}/>`,
    `<path id="lens-left" d="${g.lenses[0]}" ${cut}/>`,
    `<path id="lens-right" d="${g.lenses[1]}" ${cut}/>`,
    `</g>`,
    `<g id="temple-left" transform="translate(${margin} ${round1(templeY1 + 3)})">`,
    `<path d="${g.temple}" ${cut}/>`,
    `<text x="12" y="0.9" font-size="2.4" ${text}>${escapeXml(sizeCode(p))}</text>`,
    `</g>`,
    `<g id="temple-right" transform="translate(${margin} ${round1(templeY2 + 3)})">`,
    `<path d="${g.temple}" ${cut}/>`,
    engraving ? `<text x="12" y="0.9" font-size="2.4" ${text}>${escapeXml(engraving)}</text>` : '',
    `</g>`,
    `</svg>`,
  ]
    .filter(Boolean)
    .join('\n');
};
