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
  assert.ok(Math.abs(g.width - frameTotalWidth(DEFAULT_PARAMS)) < 0.01);
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
