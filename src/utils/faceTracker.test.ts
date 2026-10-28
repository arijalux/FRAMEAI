import test from 'node:test';
import assert from 'node:assert/strict';
import { coverTransform, mapNormalizedPoint, landmarksFromEyes } from './faceTracker';

test('coverTransform crops a 16:9 video into a 4:3 box like object-fit: cover', () => {
  const t = coverTransform(1280, 720, 800, 600);
  // Height drives the scale; width overflows and is centered
  assert.equal(t.scale, 600 / 720);
  assert.equal(t.offsetY, 0);
  assert.ok(Math.abs(t.offsetX - (800 - 1280 * (600 / 720)) / 2) < 1e-9);
});

test('mapNormalizedPoint maps the frame center to the canvas center, mirrored or not', () => {
  const p = mapNormalizedPoint({ x: 0.5, y: 0.5 }, 1280, 720, 800, 600, false);
  assert.ok(Math.abs(p.x - 400) < 1e-9);
  assert.ok(Math.abs(p.y - 300) < 1e-9);

  const m = mapNormalizedPoint({ x: 0.5, y: 0.5 }, 1280, 720, 800, 600, true);
  assert.ok(Math.abs(m.x - 400) < 1e-9);
});

test('mapNormalizedPoint flips horizontally for the selfie mirror', () => {
  const normal = mapNormalizedPoint({ x: 0.4, y: 0.5 }, 1000, 1000, 500, 500, false);
  const mirrored = mapNormalizedPoint({ x: 0.4, y: 0.5 }, 1000, 1000, 500, 500, true);
  assert.equal(normal.x, 200);
  assert.equal(mirrored.x, 300);
});

test('landmarksFromEyes orders eyes left-to-right and measures distance and tilt', () => {
  const lm = landmarksFromEyes({ x: 300, y: 210 }, { x: 200, y: 200 }, 250);
  assert.deepEqual(lm.leftEye, { x: 200, y: 200 });
  assert.deepEqual(lm.rightEye, { x: 300, y: 210 });
  assert.deepEqual(lm.center, { x: 250, y: 205 });
  assert.ok(Math.abs(lm.eyeDistance - Math.hypot(100, 10)) < 1e-9);
  assert.ok(lm.angle > 0);
});
