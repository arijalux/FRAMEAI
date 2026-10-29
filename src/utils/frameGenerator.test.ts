import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameShape } from '../types';
import {
  DEFAULT_PARAMS,
  PARAM_LIMITS,
  buildCutDxf,
  buildCutSvg,
  buildFrameGeometry,
  framePd,
  frameTotalWidth,
  paramsFromFace,
  sizeCode,
  withChange,
} from './frameGenerator';

const SHAPES: FrameShape[] = ['Round', 'Oval', 'Square', 'Geometric', 'Aviator', 'Cat-Eye'];

test('paramsFromFace sizes a wider frame for a wider PD and stays within limits', () => {
  const narrow = paramsFromFace({ estimatedPd: 58, recommendedShapes: ['Oval'] });
  const wide = paramsFromFace({ estimatedPd: 70, recommendedShapes: ['Oval'] });
  assert.equal(narrow.shape, 'Oval');
  assert.ok(frameTotalWidth(wide) > frameTotalWidth(narrow));
  for (const p of [narrow, wide]) {
    assert.ok(p.lensWidth >= PARAM_LIMITS.lensWidth.min && p.lensWidth <= PARAM_LIMITS.lensWidth.max);
    // Frame PD at or above the wearer's PD keeps decentration inward and small
    assert.ok(framePd(p) >= 58);
  }
});

test('frame total width matches the generated front geometry', () => {
  const g = buildFrameGeometry(DEFAULT_PARAMS);
  assert.ok(Math.abs(g.width - frameTotalWidth(DEFAULT_PARAMS)) < 0.5);
});

test('every shape produces closed cut paths with finite coordinates', () => {
  for (const shape of SHAPES) {
    const g = buildFrameGeometry({ ...DEFAULT_PARAMS, shape });
    for (const d of [g.front, ...g.lenses, g.temple]) {
      assert.match(d, /^M/);
      assert.match(d, /Z$/);
      assert.doesNotMatch(d, /NaN|Infinity/);
    }
    assert.ok(g.height > DEFAULT_PARAMS.lensHeight);
  }
});

test('cut SVG is true size in millimetres and escapes the engraving', () => {
  const svg = buildCutSvg({ ...DEFAULT_PARAMS, engraving: 'Ayu & <Budi>' });
  assert.match(svg, /width="\d+mm" height="\d+mm"/);
  assert.match(svg, /stroke="#FF0000"/);
  assert.ok(svg.includes('Ayu &amp; &lt;Budi&gt;'));
  assert.ok(svg.includes(sizeCode(DEFAULT_PARAMS)));
});

test('cut DXF is a millimetre R12 file with closed CUT polylines and ENGRAVE text', () => {
  const dxf = buildCutDxf({ ...DEFAULT_PARAMS, engraving: 'Rifqi é' });
  const lines = dxf.split('\r\n');
  assert.equal(lines[lines.indexOf('$ACADVER') + 2], 'AC1009');
  assert.equal(lines[lines.indexOf('$INSUNITS') + 2], '4');
  // Front, two lenses and two temples
  assert.equal(lines.filter((l) => l === 'POLYLINE').length, 5);
  assert.equal(lines.filter((l) => l === 'SEQEND').length, 5);
  assert.ok(lines.includes('Rifqi \\U+00E9'));
  assert.ok(lines.includes(sizeCode(DEFAULT_PARAMS)));
  assert.equal(lines.at(-2), 'EOF');
  // Every coordinate is a finite number inside the sheet
  const xs = lines.flatMap((l, i) => (l === ' 10' ? [Number(lines[i + 1])] : []));
  assert.ok(xs.every((x) => Number.isFinite(x) && x >= 0));
});

test('temple follows its bend, length and thickness settings', () => {
  const flat = buildFrameGeometry({ ...DEFAULT_PARAMS, templeBend: 0 });
  const bent = buildFrameGeometry({ ...DEFAULT_PARAMS, templeBend: 30 });
  const thick = buildFrameGeometry({ ...DEFAULT_PARAMS, templeBend: 0, templeThickness: 7 });
  // A straight temple is as tall as it is thick; bending adds the drop
  assert.ok(Math.abs(flat.templeHeight - DEFAULT_PARAMS.templeThickness) < 0.2);
  assert.ok(bent.templeHeight > flat.templeHeight + 10);
  assert.ok(Math.abs(thick.templeHeight - 7) < 0.2);
  // Reaches the full length when straight (plus the rounded tip)
  assert.ok(Math.abs(flat.templeWidth - DEFAULT_PARAMS.templeLength) < DEFAULT_PARAMS.templeThickness);
});

test('hinge stays joined to the rim and matches the temple thickness at slider extremes', () => {
  const cases = [
    { shape: 'Round' as const, lensWidth: 60, lensHeight: 26, rimWidth: 4, templeThickness: 3 },
    { shape: 'Square' as const, lensWidth: 40, lensHeight: 56, rimWidth: 8, templeThickness: 7 },
    { shape: 'Cat-Eye' as const, lensWidth: 60, lensHeight: 56, rimWidth: 4, templeThickness: 7 },
  ];
  for (const c of cases) {
    const p = { ...DEFAULT_PARAMS, ...c };
    const g = buildFrameGeometry(p);
    // A detached hinge block would be dropped from the outline and shrink the width
    assert.ok(Math.abs(g.width - frameTotalWidth(p)) < 1, `${c.shape} width`);
    // Flat outer face of the hinge = temple thickness, so the temple sits flush
    const face = g.outlines.front.filter(([x]) => x > g.width / 2 - 0.1).map(([, y]) => y);
    assert.ok(Math.abs(Math.max(...face) - Math.min(...face) - c.templeThickness) < 1, `${c.shape} hinge face`);
  }
});

test('rim width is capped by the bridge so the nose opening never closes', () => {
  const narrow = withChange({ ...DEFAULT_PARAMS, rimWidth: 8 }, { bridgeWidth: 14 });
  assert.equal(narrow.rimWidth, 5);
  assert.equal(withChange(DEFAULT_PARAMS, { bridgeWidth: 24, rimWidth: 8 }).rimWidth, 8);
  // Under the bridge, between the lenses, there is open space rather than wood
  const g = buildFrameGeometry({ ...narrow, shape: 'Square', lensHeight: 56 });
  const front = g.outlines.front;
  let inside = false;
  for (let i = 0, j = front.length - 1; i < front.length; j = i++) {
    const [xi, yi] = front[i];
    const [xj, yj] = front[j];
    if (yi > 10 !== yj > 10 && 0 < ((xj - xi) * (10 - yi)) / (yj - yi) + xi) inside = !inside;
  }
  assert.equal(inside, false);
});
