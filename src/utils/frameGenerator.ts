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
  templeBend: number; // degrees the tip drops behind the ear
  templeDrop: number; // length of the part behind the ear
  templeThickness: number; // arm height at the hinge; tapers to 70% at the tip
  rimWidth: number; // wood around each lens
  engraving: string; // engraved on the inside of the right temple
}

export const PARAM_LIMITS = {
  lensWidth: { min: 40, max: 60 },
  lensHeight: { min: 26, max: 56 },
  bridgeWidth: { min: 14, max: 24 },
  templeLength: { min: 130, max: 150 },
  templeBend: { min: 0, max: 35 },
  templeDrop: { min: 20, max: 40 },
  templeThickness: { min: 3, max: 7 },
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
    templeBend: 22,
    templeDrop: 30,
    templeThickness: 5,
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

type Pt = [number, number];

const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Smooth closed SVG path through the points (Catmull-Rom converted to cubic Béziers),
 * so the outline is made of real curves instead of short straight segments.
 */
export const smoothPathFrom = (pts: Pt[]) => {
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  let d = `M${round2(pts[0][0])} ${round2(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${round2(c1[0])} ${round2(c1[1])} ${round2(c2[0])} ${round2(c2[1])} ${round2(p2[0])} ${round2(p2[1])}`;
  }
  return d + ' Z';
};

/** Resamples a closed outline to evenly spaced points */
const resample = (pts: Pt[], spacing: number): Pt[] => {
  const closed = [...pts, pts[0]];
  const lengths = [0];
  for (let i = 1; i < closed.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(closed[i][0] - closed[i - 1][0], closed[i][1] - closed[i - 1][1]));
  }
  const total = lengths[lengths.length - 1];
  const count = Math.max(12, Math.round(total / spacing));
  const out: Pt[] = [];
  let seg = 1;
  for (let k = 0; k < count; k++) {
    const target = (k / count) * total;
    while (lengths[seg] < target) seg++;
    const t = (target - lengths[seg - 1]) / (lengths[seg] - lengths[seg - 1] || 1);
    out.push([
      closed[seg - 1][0] + (closed[seg][0] - closed[seg - 1][0]) * t,
      closed[seg - 1][1] + (closed[seg][1] - closed[seg - 1][1]) * t,
    ]);
  }
  return out;
};

/**
 * One lens shape around (cx, 0). `outward` is +1 when positive x points away from the
 * nose (right lens), -1 for the left lens. SVG y grows downward.
 */
const lensOutline = (shape: FrameShape, cx: number, a: number, b: number, outward: 1 | -1, spacing = 0.4): Pt[] => {
  const n = ROUNDNESS[shape];
  const raw: Pt[] = [];
  const steps = 720;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    let x = a * Math.sign(c) * Math.abs(c) ** (2 / n);
    let y = b * Math.sign(s) * Math.abs(s) ** (2 / n);
    const side = (x * outward) / a; // -1 at the nose, +1 at the temple
    const yn = y / b; // -1 at the top, +1 at the bottom
    // Shape tweaks use squared terms so the outline stays smooth where they fade out
    if (shape === 'Aviator') {
      // Teardrop: flatter brow, deeper drop toward the nose
      y *= 1 + 0.15 * yn - 0.2 * side * Math.max(0, yn) ** 2;
    } else if (shape === 'Cat-Eye') {
      // Upswept outer corner, slightly narrower at the bottom outside
      const lift = Math.max(0, side) ** 2;
      const upper = Math.max(0, -yn);
      y -= b * 0.3 * lift * upper ** 1.5;
      y *= 1 - 0.12 * Math.max(0, side) * Math.max(0, yn) ** 2;
      x += outward * a * 0.06 * lift * upper ** 2;
    }
    raw.push([cx + x, y]);
  }
  return resample(raw, spacing);
};

/** Signed distance to a closed polygon (negative inside) */
const polygonDistance = (pts: Pt[], x: number, y: number) => {
  let best = Infinity;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const dx = xi - xj;
    const dy = yi - yj;
    const t = Math.max(0, Math.min(1, ((x - xj) * dx + (y - yj) * dy) / (dx * dx + dy * dy || 1)));
    const ex = x - (xj + dx * t);
    const ey = y - (yj + dy * t);
    best = Math.min(best, ex * ex + ey * ey);
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside ? -Math.sqrt(best) : Math.sqrt(best);
};

/** Signed distance to a rounded rectangle centred at (cx, cy) */
const boxDistance = (x: number, y: number, cx: number, cy: number, hw: number, hh: number, radius: number) => {
  const qx = Math.abs(x - cx) - hw + radius;
  const qy = Math.abs(y - cy) - hh + radius;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
};

/** Smooth union: blends two shapes with a fillet of roughly radius k */
const smoothMin = (d1: number, d2: number, k: number) => {
  const h = Math.max(k - Math.abs(d1 - d2), 0) / k;
  return Math.min(d1, d2) - (h * h * k) / 4;
};

/**
 * Traces the zero contour of a distance field with marching squares and returns the
 * longest closed loop. Edge crossings are interpolated, so the outline follows the field
 * closely rather than the grid.
 */
const traceContour = (field: (x: number, y: number) => number, x0: number, y0: number, x1: number, y1: number, h: number): Pt[] => {
  const nx = Math.ceil((x1 - x0) / h) + 1;
  const ny = Math.ceil((y1 - y0) / h) + 1;
  // Coarse pass first; a distance field changes no faster than the distance moved, so fine
  // samples are only evaluated in the narrow band where the coarse values say the edge can be.
  const step = 4;
  const cnx = Math.ceil((nx - 1) / step) + 1;
  const cny = Math.ceil((ny - 1) / step) + 1;
  const coarse = new Float64Array(cnx * cny);
  for (let j = 0; j < cny; j++) for (let i = 0; i < cnx; i++) coarse[j * cnx + i] = field(x0 + i * step * h, y0 + j * step * h);
  const band = step * h * 1.5;
  const v = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const ci = Math.min(Math.floor(i / step), cnx - 2);
      const cj = Math.min(Math.floor(j / step), cny - 2);
      const c = [coarse[cj * cnx + ci], coarse[cj * cnx + ci + 1], coarse[(cj + 1) * cnx + ci], coarse[(cj + 1) * cnx + ci + 1]];
      const sameSign = c.every((d) => d > band) || c.every((d) => d < -band);
      v[j * nx + i] = sameSign ? c[0] : field(x0 + i * h, y0 + j * h);
    }
  }

  // Edge ids: horizontal edge (i,j)→(i+1,j) = j*nx+i; vertical edge (i,j)→(i,j+1) = H + j*nx+i
  const H = nx * ny;
  const point = (id: number): Pt => {
    const vertical = id >= H;
    const k = vertical ? id - H : id;
    const i = k % nx;
    const j = Math.floor(k / nx);
    const a = v[k];
    const b = vertical ? v[k + nx] : v[k + 1];
    const t = a / (a - b);
    return vertical ? [x0 + i * h, y0 + (j + t) * h] : [x0 + (i + t) * h, y0 + j * h];
  };
  const links = new Map<number, number[]>();
  const link = (e1: number, e2: number) => {
    (links.get(e1) ?? links.set(e1, []).get(e1)!).push(e2);
    (links.get(e2) ?? links.set(e2, []).get(e2)!).push(e1);
  };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const k = j * nx + i;
      const tl = v[k] < 0, tr = v[k + 1] < 0, br = v[k + nx + 1] < 0, bl = v[k + nx] < 0;
      const top = k, bottom = k + nx, left = H + k, right = H + k + 1;
      const code = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
      switch (code) {
        case 1: case 14: link(left, bottom); break;
        case 2: case 13: link(bottom, right); break;
        case 3: case 12: link(left, right); break;
        case 4: case 11: link(top, right); break;
        case 6: case 9: link(top, bottom); break;
        case 7: case 8: link(left, top); break;
        case 5: case 10: {
          // Saddle: decide from the cell centre
          const centre = (v[k] + v[k + 1] + v[k + nx] + v[k + nx + 1]) / 4 < 0;
          if ((code === 5) === centre) { link(left, top); link(bottom, right); }
          else { link(left, bottom); link(top, right); }
          break;
        }
      }
    }
  }
  let longest: Pt[] = [];
  const seen = new Set<number>();
  for (const start of links.keys()) {
    if (seen.has(start)) continue;
    const loop: Pt[] = [];
    let prev = -1;
    let cur = start;
    while (!seen.has(cur)) {
      seen.add(cur);
      loop.push(point(cur));
      const next = links.get(cur)!.find((e) => e !== prev && !seen.has(e));
      if (next === undefined) break;
      prev = cur;
      cur = next;
    }
    if (loop.length > longest.length) longest = loop;
  }
  return longest;
};

/**
 * Side profile of a temple: straight arm from the hinge at (0, 0), a rounded bend behind
 * the ear, then the drop to a rounded tip. The arm tapers from full thickness to 70%.
 */
const templeOutline = (p: CustomFrameParams): Pt[] => {
  const angle = (p.templeBend * Math.PI) / 180;
  const straight = p.templeLength - p.templeDrop;
  const bendRadius = 14; // how gently the arm turns into the drop
  const k = Math.min(bendRadius, straight * 0.5, p.templeDrop * 0.6);

  // Centre line: line, quadratic curve through the bend, line
  const p0: Pt = [straight - k, 0];
  const p1: Pt = [straight, 0];
  const p2: Pt = [straight + k * Math.cos(angle), k * Math.sin(angle)];
  const end: Pt = [straight + p.templeDrop * Math.cos(angle), p.templeDrop * Math.sin(angle)];
  const centre: Pt[] = [];
  for (let x = 0; x < p0[0]; x += 1) centre.push([x, 0]);
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const u = 1 - t;
    centre.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
  }
  const rest = Math.hypot(end[0] - p2[0], end[1] - p2[1]);
  for (let d = 1; d <= rest; d += 1) {
    const t = d / rest;
    centre.push([p2[0] + (end[0] - p2[0]) * t, p2[1] + (end[1] - p2[1]) * t]);
  }
  if (centre[centre.length - 1][0] !== end[0]) centre.push(end);

  // Offset both sides along the normal, tapering toward the tip
  const half = (i: number) => (p.templeThickness / 2) * (1 - 0.3 * (i / (centre.length - 1)));
  const normal = (i: number): Pt => {
    const a = centre[Math.max(0, i - 1)];
    const b = centre[Math.min(centre.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
  };
  const upper: Pt[] = [];
  const lower: Pt[] = [];
  centre.forEach(([x, y], i) => {
    const [nx, ny] = normal(i);
    upper.push([x - nx * half(i), y - ny * half(i)]);
    lower.push([x + nx * half(i), y + ny * half(i)]);
  });

  // Rounded tip around the end of the centre line
  const tipR = half(centre.length - 1);
  const [tnx, tny] = normal(centre.length - 1);
  const start = Math.atan2(-tny, -tnx);
  const tip: Pt[] = [];
  for (let i = 1; i < 12; i++) {
    const t = start + (Math.PI * i) / 12;
    tip.push([end[0] + tipR * Math.cos(t), end[1] + tipR * Math.sin(t)]);
  }

  // Hinge end stays flat, with small corner radii so the smoothing doesn't bulge it
  const h = p.templeThickness / 2;
  const hinge: Pt[] = [[0.6, h - 0.1], [0.15, h - 0.4], [0, h - 1], [0, -h + 1], [0.15, -h + 0.4], [0.6, -h + 0.1]];
  return resample([...hinge.slice(3), ...upper.slice(1), ...tip, ...lower.reverse().slice(0, -1), ...hinge.slice(0, 3)], 0.4);
};

export interface FrameGeometry {
  /** Outer contour of the front piece */
  front: string;
  /** Lens openings */
  lenses: [string, string];
  /** Side profile of one temple, starting at the hinge */
  temple: string;
  /** The same outlines as closed point lists, for exporters */
  outlines: { front: Pt[]; lenses: [Pt[], Pt[]]; temple: Pt[] };
  width: number;
  height: number;
  /** Highest point of the front (negative, above the lens centres) */
  top: number;
  templeWidth: number;
  templeHeight: number;
  /** Highest point of the temple (negative, above its centre line at the hinge) */
  templeTop: number;
}

/** Builds the cut paths, centred on the bridge at x = 0 and lens centres at y = 0 */
export const buildFrameGeometry = (p: CustomFrameParams): FrameGeometry => {
  const a = p.lensWidth / 2;
  const b = p.lensHeight / 2;
  const r = p.rimWidth;
  const cx = a + p.bridgeWidth / 2; // lens centre offset from the bridge
  const lensPts: [Pt[], Pt[]] = [lensOutline(p.shape, -cx, a, b, -1), lensOutline(p.shape, cx, a, b, 1)];
  // Coarser copies for the distance field; the chord error at 1.5 mm spacing is a few hundredths of a mm
  const coarse = lensPts.map((pts) => resample(pts, 1.5));
  const lensBox = lensPts.map((pts) => {
    const xs = pts.map(([x]) => x);
    const ys = pts.map(([, y]) => y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  });

  // Front piece as one smooth solid: rim of uniform width r around each lens, a bridge and
  // two hinge blocks, blended with fillets so the joints have no sharp inside corners.
  const bridgeHalfHeight = Math.max(3.5, r * 0.8);
  const bridgeY = -b * 0.45;
  const hingeHalfHeight = 4.5;
  const hingeY = -b * 0.55;
  const hingeX = cx + a + r * 0.5 + HINGE_TAB / 2; // centre of the hinge block
  const hingeHalfWidth = r * 0.5 + HINGE_TAB / 2;

  const field = (x: number, y: number) => {
    let d = Infinity;
    for (let i = 0; i < 2; i++) {
      const box = lensBox[i];
      // Far from a lens the exact distance doesn't matter, only that it's clearly outside
      const bx = Math.max(box.x0 - x, x - box.x1, 0);
      const by = Math.max(box.y0 - y, y - box.y1, 0);
      const far = Math.hypot(bx, by);
      const rim = far > r + 6 ? far - r : polygonDistance(coarse[i], x, y) - r;
      d = smoothMin(d, rim, 3);
    }
    d = smoothMin(d, boxDistance(x, y, 0, bridgeY, cx - a + r, bridgeHalfHeight, bridgeHalfHeight * 0.6), 4);
    for (const side of [-1, 1]) {
      d = smoothMin(d, boxDistance(x, y, side * hingeX, hingeY, hingeHalfWidth, hingeHalfHeight, 1.5), 2.5);
    }
    return d;
  };

  const halfWidth = cx + a + r + HINGE_TAB;
  const reach = Math.max(...lensBox.map((box) => Math.max(-box.y0, box.y1))) + r + 2;
  const frontPts = resample(traceContour(field, -halfWidth - 2, -reach, halfWidth + 2, reach, 0.35), 0.4);
  const ys = frontPts.map(([, y]) => y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const templePts = templeOutline(p);
  const txs = templePts.map(([x]) => x);
  const tys = templePts.map(([, y]) => y);

  return {
    front: smoothPathFrom(resample(frontPts, 1)),
    lenses: [smoothPathFrom(resample(lensPts[0], 1)), smoothPathFrom(resample(lensPts[1], 1))],
    temple: smoothPathFrom(templePts),
    outlines: { front: frontPts, lenses: lensPts, temple: templePts },
    width: Math.max(...frontPts.map(([x]) => x)) - Math.min(...frontPts.map(([x]) => x)),
    height: maxY - minY,
    top: minY,
    templeWidth: Math.max(...txs),
    templeHeight: Math.max(...tys) - Math.min(...tys),
    templeTop: Math.min(...tys),
  };
};

export interface CutSheet {
  width: number;
  height: number;
  /** Closed outlines in sheet coordinates (mm, y pointing down) */
  cuts: { id: string; pts: Pt[] }[];
  /** Engraving, positioned at its baseline */
  texts: { x: number; y: number; size: number; text: string }[];
}

const ENGRAVE_SIZE = 2.4;

/** Lays the pieces out on one sheet: front piece on top, two temples below */
export const buildCutSheet = (p: CustomFrameParams): CutSheet => {
  const g = buildFrameGeometry(p);
  const margin = 6;
  const gap = 8;
  const width = Math.ceil(Math.max(g.width, g.templeWidth) + margin * 2);
  const frontX = width / 2;
  const frontY = margin - g.top;
  // Temples are placed by their centre line at the hinge, which sits below their top edge
  const templeY1 = margin + g.height + gap - g.templeTop;
  const templeY2 = templeY1 + g.templeHeight + gap;
  const height = Math.ceil(templeY2 + g.templeHeight + margin);
  const move = (pts: Pt[], dx: number, dy: number): Pt[] => pts.map(([x, y]) => [x + dx, y + dy]);
  const engraving = p.engraving.trim().slice(0, 24);
  // Keep the engraving inside thin temples
  const textSize = Math.min(ENGRAVE_SIZE, p.templeThickness * 0.5);

  return {
    width,
    height,
    cuts: [
      { id: 'front-outline', pts: move(g.outlines.front, frontX, frontY) },
      { id: 'lens-left', pts: move(g.outlines.lenses[0], frontX, frontY) },
      { id: 'lens-right', pts: move(g.outlines.lenses[1], frontX, frontY) },
      { id: 'temple-left', pts: move(g.outlines.temple, margin, templeY1) },
      { id: 'temple-right', pts: move(g.outlines.temple, margin, templeY2) },
    ],
    texts: [
      { x: margin + 12, y: templeY1 + textSize * 0.36, size: textSize, text: sizeCode(p) },
      ...(engraving ? [{ x: margin + 12, y: templeY2 + textSize * 0.36, size: textSize, text: engraving }] : []),
    ],
  };
};

const escapeXml = (s: string) =>
  s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);

/**
 * Cutting sheet as SVG at true size (mm).
 * Red hairlines are cuts, black text is engraving — the usual laser software convention.
 */
export const buildCutSvg = (p: CustomFrameParams): string => {
  const sheet = buildCutSheet(p);
  const cut = `fill="none" stroke="${CUT_COLOR}" stroke-width="0.1"`;
  const text = `fill="${ENGRAVE_COLOR}" font-family="Arial, Helvetica, sans-serif"`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sheet.width}mm" height="${sheet.height}mm" viewBox="0 0 ${sheet.width} ${sheet.height}">`,
    `<title>FrameAI × BJ Homemade ${sizeCode(p)}</title>`,
    ...sheet.cuts.map((c) => {
      // Outlines become Bézier curves through evenly spaced points
      const d = smoothPathFrom(resample(c.pts, 1));
      return `<path id="${c.id}" d="${d}" ${cut}/>`;
    }),
    ...sheet.texts.map(
      (t) => `<text x="${round1(t.x)}" y="${round1(t.y)}" font-size="${t.size}" ${text}>${escapeXml(t.text)}</text>`
    ),
    `</svg>`,
  ].join('\n');
};

// DXF R12 stores text in a code page; anything outside ASCII goes in as \U+XXXX
const dxfText = (s: string) =>
  [...s].map((c) => (c.charCodeAt(0) < 128 ? c : `\\U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`)).join('');

/**
 * Cutting sheet as DXF R12 in millimetres, for CNC / laser software that prefers DXF.
 * Outlines are closed polylines on layer CUT (red); engraving is TEXT on layer ENGRAVE.
 * DXF's y axis points up, so the sheet is flipped vertically.
 */
export const buildCutDxf = (p: CustomFrameParams): string => {
  const sheet = buildCutSheet(p);
  const out: (string | number)[] = [];
  const pair = (code: number, value: string | number) => out.push(code, value);
  const num = (v: number) => (Math.round(v * 1000) / 1000).toString();
  const flip = (y: number) => num(sheet.height - y);

  pair(0, 'SECTION'); pair(2, 'HEADER');
  pair(9, '$ACADVER'); pair(1, 'AC1009');
  pair(9, '$INSUNITS'); pair(70, 4); // millimetres
  pair(9, '$EXTMIN'); pair(10, 0); pair(20, 0);
  pair(9, '$EXTMAX'); pair(10, sheet.width); pair(20, sheet.height);
  pair(0, 'ENDSEC');

  pair(0, 'SECTION'); pair(2, 'TABLES');
  pair(0, 'TABLE'); pair(2, 'LTYPE'); pair(70, 1);
  pair(0, 'LTYPE'); pair(2, 'CONTINUOUS'); pair(70, 0); pair(3, 'Solid line'); pair(72, 65); pair(73, 0); pair(40, 0);
  pair(0, 'ENDTAB');
  pair(0, 'TABLE'); pair(2, 'LAYER'); pair(70, 2);
  for (const [name, color] of [['CUT', 1], ['ENGRAVE', 7]] as const) {
    pair(0, 'LAYER'); pair(2, name); pair(70, 0); pair(62, color); pair(6, 'CONTINUOUS');
  }
  pair(0, 'ENDTAB');
  pair(0, 'ENDSEC');

  pair(0, 'SECTION'); pair(2, 'ENTITIES');
  for (const c of sheet.cuts) {
    pair(0, 'POLYLINE'); pair(8, 'CUT'); pair(66, 1); pair(10, 0); pair(20, 0); pair(30, 0); pair(70, 1);
    for (const [x, y] of c.pts) {
      pair(0, 'VERTEX'); pair(8, 'CUT'); pair(10, num(x)); pair(20, flip(y)); pair(30, 0);
    }
    pair(0, 'SEQEND'); pair(8, 'CUT');
  }
  for (const t of sheet.texts) {
    // DXF text height is the cap height, about 0.7 of the SVG font size
    pair(0, 'TEXT'); pair(8, 'ENGRAVE'); pair(10, num(t.x)); pair(20, flip(t.y)); pair(30, 0); pair(40, num(t.size * 0.7)); pair(1, dxfText(t.text));
  }
  pair(0, 'ENDSEC');
  pair(0, 'EOF');

  const lines: string[] = [];
  for (let i = 0; i < out.length; i += 2) lines.push(String(out[i]).padStart(3, ' '), String(out[i + 1]));
  return lines.join('\r\n') + '\r\n';
};
