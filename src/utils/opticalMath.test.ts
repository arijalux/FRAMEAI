import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFaceFrameMatchScore,
  validatePrescription,
  calculateLensPricing,
  computeDecentration,
} from './opticalMath';

test('calculateFaceFrameMatchScore pairs face shapes with high synergy frames', () => {
  // Oval faces harmonize top-tier with Geometric and Aviator
  const ovalRes = calculateFaceFrameMatchScore('Oval', 'Geometric');
  assert.equal(ovalRes.score >= 95, true);
  assert.equal(ovalRes.verdict, 'Paling Serasi');

  // Square faces harmonize with Round to soften jawline
  const squareRound = calculateFaceFrameMatchScore('Square', 'Round');
  assert.equal(squareRound.score, 98);
  assert.equal(squareRound.verdict, 'Paling Serasi');

  // Square faces with Square frames have lower score to avoid overly angular look
  const squareSquare = calculateFaceFrameMatchScore('Square', 'Square');
  assert.equal(squareSquare.score, 75);
  assert.equal(squareSquare.verdict, 'Pilihan Berani');
});

test('validatePrescription checks normal and invalid values correctly', () => {
  // Valid prescription
  const validRx = {
    odSph: -2.5,
    odCyl: -0.75,
    odAxis: 85,
    osSph: -2.25,
    osCyl: -0.5,
    osAxis: 90,
    pd: 63,
  };
  const validRes = validatePrescription(validRx);
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.errors.length, 0);

  // Invalid PD out of range
  const invalidPd = validatePrescription({ pd: 45 });
  assert.equal(invalidPd.isValid, false);
  assert.equal(invalidPd.errors.length, 1);
  assert.match(invalidPd.errors[0], /Jarak pupil/);

  // Missing Axis when Cylinder is specified
  const missingAxis = validatePrescription({ odCyl: -1.25 });
  assert.equal(missingAxis.isValid, false);
  assert.match(missingAxis.errors[0], /Axis harus bilangan bulat/);
});

test('calculateLensPricing computes correct total and breakdown', () => {
  const frameBase = 3_500_000;
  const config = {
    type: 'single_vision' as const,
    index: '1.67_ultrathin' as const,
    blueLightFilter: true,
    photochromic: false,
    antiReflective: true,
  };

  const pricing = calculateLensPricing(frameBase, config);
  assert.equal(pricing.framePrice, 3_500_000);
  assert.equal(pricing.lensTypePrice, 800_000); // single vision
  assert.equal(pricing.indexUpgradePrice, 1_350_000); // 1.67
  assert.equal(pricing.treatmentsPrice, 550_000 + 400_000); // blue light + anti-reflective
  assert.equal(pricing.total, 3_500_000 + 800_000 + 1_350_000 + 950_000); // 6.600.000
});

test('computeDecentration computes accurate optical center distance', () => {
  const dec = computeDecentration(64, 52, 18);
  // framePD = 52 + 18 = 70. userPD = 64. totalDecentration = 6. perEye = 3.
  assert.equal(dec.framePD, 70);
  assert.equal(dec.totalDecentrationMm, 6);
  assert.equal(dec.perEyeDecentrationMm, 3);
  assert.equal(dec.fitAssessment, 'Ideal Optical Alignment');
});
