/**
 * Pure optical calculations and face-frame styling logic for FrameAI
 */

import { faceShapeLabel } from './format';

export type FaceShape = 'Oval' | 'Square' | 'Round' | 'Heart' | 'Diamond';
export type FrameShape = 'Oval' | 'Square' | 'Round' | 'Geometric' | 'Aviator' | 'Cat-Eye';

export interface Prescription {
  odSph: number; // Right eye Sphere
  odCyl: number; // Right eye Cylinder
  odAxis: number; // Right eye Axis
  osSph: number; // Left eye Sphere
  osCyl: number; // Left eye Cylinder
  osAxis: number; // Left eye Axis
  pd: number; // Pupillary Distance in mm
}

export type LensType = 'single_vision' | 'progressive' | 'reading' | 'non_prescription';
export type LensIndex = '1.50_standard' | '1.60_thin' | '1.67_ultrathin' | '1.74_high_index';

export interface LensPackageOptions {
  type: LensType;
  index: LensIndex;
  blueLightFilter: boolean;
  photochromic: boolean;
  antiReflective: boolean;
}

/**
 * Optical compatibility matrix between face shapes and frame shapes
 */
export const COMPATIBILITY_MATRIX: Record<FaceShape, Record<FrameShape, number>> = {
  Oval: {
    Geometric: 97,
    Aviator: 95,
    Square: 94,
    'Cat-Eye': 92,
    Round: 90,
    Oval: 88,
  },
  Square: {
    Round: 98,
    Oval: 96,
    'Cat-Eye': 92,
    Aviator: 90,
    Geometric: 82,
    Square: 75,
  },
  Round: {
    Square: 98,
    Geometric: 96,
    'Cat-Eye': 93,
    Aviator: 88,
    Oval: 78,
    Round: 72,
  },
  Heart: {
    'Cat-Eye': 97,
    Round: 95,
    Geometric: 90,
    Aviator: 89,
    Oval: 91,
    Square: 82,
  },
  Diamond: {
    Oval: 98,
    'Cat-Eye': 96,
    Round: 93,
    Aviator: 91,
    Geometric: 85,
    Square: 80,
  },
};

/**
 * Calculates compatibility score (0-100) between user face shape and frame
 */
export function calculateFaceFrameMatchScore(
  faceShape: FaceShape,
  frameShape: FrameShape,
  options?: { userPd?: number; frameWidth?: number }
): { score: number; verdict: string; guidance: string } {
  const baseScore = COMPATIBILITY_MATRIX[faceShape]?.[frameShape] ?? 85;
  
  let score = baseScore;

  if (options?.userPd && options?.frameWidth) {
    const estimatedIdealFrameWidth = options.userPd * 2.15;
    const diff = Math.abs(options.frameWidth - estimatedIdealFrameWidth);
    if (diff < 5) score = Math.min(100, score + 2);
    else if (diff > 15) score = Math.max(50, score - 5);
  }

  let verdict = 'Cocok';
  let guidance = 'Melengkapi keseimbangan wajah Anda dengan nyaman.';

  if (score >= 94) {
    verdict = 'Paling Serasi';
    guidance = `Kontur yang kontras menyeimbangkan proporsi wajah ${faceShapeLabel(faceShape).toLowerCase()} Anda dengan elegan.`;
  } else if (score >= 88) {
    verdict = 'Sangat Serasi';
    guidance = `Memberi simetri yang menawan pada garis rahang dan tulang pipi Anda.`;
  } else if (score >= 80) {
    verdict = 'Klasik Seimbang';
    guidance = `Siluet abadi yang selaras dengan struktur wajah Anda.`;
  } else {
    verdict = 'Pilihan Berani';
    guidance = `Memberi kontras dramatis terhadap garis alami wajah Anda.`;
  }

  return { score, verdict, guidance };
}

/**
 * Validates optical prescription values against realistic optometric ranges
 */
export function validatePrescription(rx: Partial<Prescription>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (rx.pd !== undefined && (rx.pd < 50 || rx.pd > 78)) {
    errors.push('Jarak pupil (PD) harus antara 50mm dan 78mm.');
  }

  const checkEye = (name: string, sph?: number, cyl?: number, axis?: number) => {
    if (sph !== undefined && (sph < -14.0 || sph > 10.0)) {
      errors.push(`${name}: Sphere (SPH) harus antara -14.00 dan +10.00.`);
    }
    if (cyl !== undefined && (cyl < -8.0 || cyl > 4.0)) {
      errors.push(`${name}: Cylinder (CYL) harus antara -8.00 dan +4.00.`);
    }
    if (cyl !== undefined && cyl !== 0) {
      if (axis === undefined || axis < 1 || axis > 180) {
        errors.push(`${name}: Axis harus bilangan bulat antara 1° dan 180° jika Cylinder diisi.`);
      }
    }
  };

  checkEye('Mata Kanan (OD)', rx.odSph, rx.odCyl, rx.odAxis);
  checkEye('Mata Kiri (OS)', rx.osSph, rx.osCyl, rx.osAxis);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Lens add-on prices in rupiah (IDR); shared with the lens configurator UI
export const LENS_TYPE_PRICES: Record<LensType, number> = {
  non_prescription: 0,
  reading: 500_000,
  single_vision: 800_000,
  progressive: 2_250_000,
};

export const INDEX_UPGRADE_PRICES: Record<LensIndex, number> = {
  '1.50_standard': 0,
  '1.60_thin': 700_000,
  '1.67_ultrathin': 1_350_000,
  '1.74_high_index': 2_150_000,
};

export const TREATMENT_PRICES = {
  blueLightFilter: 550_000,
  photochromic: 1_200_000,
  antiReflective: 400_000,
};

/**
 * Calculates optical lens package subtotal and price breakdown (IDR)
 */
export function calculateLensPricing(
  frameBasePrice: number,
  lensConfig: LensPackageOptions
): {
  framePrice: number;
  lensTypePrice: number;
  indexUpgradePrice: number;
  treatmentsPrice: number;
  total: number;
} {
  let treatmentsPrice = 0;
  if (lensConfig.blueLightFilter) treatmentsPrice += TREATMENT_PRICES.blueLightFilter;
  if (lensConfig.photochromic) treatmentsPrice += TREATMENT_PRICES.photochromic;
  if (lensConfig.antiReflective) treatmentsPrice += TREATMENT_PRICES.antiReflective;

  const lensTypePrice = LENS_TYPE_PRICES[lensConfig.type] ?? 0;
  const indexUpgradePrice = INDEX_UPGRADE_PRICES[lensConfig.index] ?? 0;
  const total = frameBasePrice + lensTypePrice + indexUpgradePrice + treatmentsPrice;

  return {
    framePrice: frameBasePrice,
    lensTypePrice,
    indexUpgradePrice,
    treatmentsPrice,
    total,
  };
}

/**
 * Calculates optical decentration (mm) from frame optical center to pupil center
 */
export function computeDecentration(
  userPd: number,
  frameLensWidth: number,
  frameBridgeWidth: number
): {
  framePD: number;
  totalDecentrationMm: number;
  perEyeDecentrationMm: number;
  fitAssessment: 'Narrow Fit' | 'Ideal Optical Alignment' | 'Wide Fit';
} {
  const framePD = frameLensWidth + frameBridgeWidth;
  const totalDecentrationMm = Math.abs(framePD - userPd);
  const perEyeDecentrationMm = Number((totalDecentrationMm / 2).toFixed(1));

  let fitAssessment: 'Narrow Fit' | 'Ideal Optical Alignment' | 'Wide Fit' = 'Ideal Optical Alignment';
  if (framePD - userPd > 8) {
    fitAssessment = 'Wide Fit';
  } else if (userPd - framePD > 6) {
    fitAssessment = 'Narrow Fit';
  }

  return {
    framePD,
    totalDecentrationMm: Number(totalDecentrationMm.toFixed(1)),
    perEyeDecentrationMm,
    fitAssessment,
  };
}
