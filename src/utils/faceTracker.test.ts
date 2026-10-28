import test from 'node:test';
import assert from 'node:assert/strict';
import { OpticalFaceTracker } from './faceTracker';

test('OpticalFaceTracker instantiates and returns default landmarks when video is not ready', async () => {
  const tracker = new OpticalFaceTracker();
  const dummyVideo = {} as HTMLVideoElement;
  const landmarks = await tracker.track(dummyVideo, 640, 480);

  assert.equal(typeof landmarks.center.x, 'number');
  assert.equal(typeof landmarks.center.y, 'number');
  assert.equal(typeof landmarks.eyeDistance, 'number');
  assert.equal(typeof landmarks.angle, 'number');
  assert.equal(landmarks.eyeDistance > 0, true);
});
