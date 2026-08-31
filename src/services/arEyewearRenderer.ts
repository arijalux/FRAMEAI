/**
 * FRAMEAI Spatial Eyewear & AR Marker Canvas Renderer
 * Spatially anchors eyewear models, debug geometry, and millimeter measurement guides
 * directly into the 100mm x 100mm physical marker coordinate system.
 */

import { FrameShape } from '../types';
import { ARMarkerPose } from './arMarkerTracker';

export interface DrawEyewearOptions {
  frameWidthMm: number;
  lensWidthMm: number;
  lensHeightMm: number;
  bridgeWidthMm: number;
  templeLengthMm: number;
  frameShape: FrameShape;
  colorHex: string;
  showDimensions: boolean;
  isDebug: boolean;
}

/**
 * Draw complete AR spatial scene onto the overlay canvas
 */
export function renderARSpatialScene(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  pose: ARMarkerPose | null,
  options: DrawEyewearOptions
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (!pose || !pose.isDetected || !pose.isValid || pose.confidence < 0.5) {
    return;
  }

  const {
    frameWidthMm,
    lensWidthMm,
    lensHeightMm,
    bridgeWidthMm,
    templeLengthMm,
    frameShape,
    colorHex,
    showDimensions,
    isDebug,
  } = options;

  // 1. Debug Marker Visualizations (Corners, Yellow Outline, Center, 2D Test Rectangle)
  if (isDebug) {
    drawDebugMarkerHUD(ctx, pose, frameWidthMm);
  }

  // 2. Physical 1:1 Scale Eyewear Spatial Anchoring
  // Scale ratio: frameWidthMm / 100mm (e.g. 138mm / 100mm = 1.38x marker width)
  const markerWidthPx = pose.widthPx;
  const eyewearWidthPx = markerWidthPx * (frameWidthMm / 100);
  const eyewearHeightPx = eyewearWidthPx * 0.58; // Standard 300x175 model ratio

  ctx.save();
  // Translate & Rotate directly in marker coordinate system
  ctx.translate(pose.centerX, pose.centerY);
  ctx.rotate(pose.rotationRad);

  // Realistic drop shadow on the physical marker / table surface
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, eyewearHeightPx * 0.38, eyewearWidthPx * 0.45, eyewearHeightPx * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw 3D-styled Eyewear Model
  const modelScale = eyewearWidthPx / 300;
  ctx.save();
  ctx.scale(modelScale, modelScale);
  ctx.translate(-150, -87.5); // Center 300x175 model on (0,0)

  drawEyewearModel(ctx, frameShape, colorHex);
  ctx.restore();

  // 3. Millimeter Dimension Measurement Overlay
  if (showDimensions) {
    drawSpatialDimensions(
      ctx,
      eyewearWidthPx,
      eyewearHeightPx,
      frameWidthMm,
      lensWidthMm,
      lensHeightMm,
      bridgeWidthMm,
      templeLengthMm
    );
  }

  ctx.restore();
}

/**
 * Draw Debug Visualizations (Red dots at corners, Yellow outline, Blue center, 2D Test Rectangle)
 */
function drawDebugMarkerHUD(ctx: CanvasRenderingContext2D, pose: ARMarkerPose, frameWidthMm: number): void {
  const [tl, tr, br, bl] = pose.corners;

  // Yellow quadrilateral boundary
  ctx.save();
  ctx.strokeStyle = '#EAB308'; // Bright Yellow
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.stroke();

  // Subtle Yellow Marker Fill
  ctx.fillStyle = 'rgba(234, 179, 8, 0.08)';
  ctx.fill();

  // Red dots at the 4 detected corners
  const corners = [
    { pt: tl, label: 'TL' },
    { pt: tr, label: 'TR' },
    { pt: br, label: 'BR' },
    { pt: bl, label: 'BL' },
  ];

  corners.forEach(({ pt, label }) => {
    ctx.fillStyle = '#EF4444'; // Red
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Corner Label
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, pt.x + 8, pt.y + 4);
  });

  // Blue dot at Marker Center
  ctx.fillStyle = '#3B82F6'; // Blue
  ctx.beginPath();
  ctx.arc(pose.centerX, pose.centerY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 2D Calibrated Test Rectangle (138mm x 50mm relative to 100mm marker)
  const rectW = pose.widthPx * (frameWidthMm / 100);
  const rectH = pose.widthPx * (50 / 100);

  ctx.save();
  ctx.translate(pose.centerX, pose.centerY);
  ctx.rotate(pose.rotationRad);

  ctx.strokeStyle = '#06B6D4'; // Cyan dashed
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(-rectW / 2, -rectH / 2, rectW, rectH);

  ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
  ctx.fillRect(-rectW / 2, -rectH / 2, rectW, rectH);

  // Label for Test Rectangle
  ctx.setLineDash([]);
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#06B6D4';
  ctx.fillText(`TEST RECT: ${frameWidthMm}mm × 50mm`, -rectW / 2 + 6, -rectH / 2 + 14);
  ctx.restore();

  ctx.restore();
}

/**
 * Draw Vector Eyewear Geometry (in standard 300x175 model space)
 */
function drawEyewearModel(ctx: CanvasRenderingContext2D, shape: FrameShape, colorHex: string): void {
  ctx.save();
  ctx.lineWidth = 5.5;
  ctx.strokeStyle = colorHex;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const lensFill = 'rgba(255, 255, 255, 0.15)';

  switch (shape) {
    case 'Round': {
      // Left Lens
      ctx.fillStyle = lensFill;
      ctx.beginPath();
      ctx.arc(80, 88, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right Lens
      ctx.beginPath();
      ctx.arc(220, 88, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bridge Keyhole Arch
      ctx.beginPath();
      ctx.moveTo(126, 80);
      ctx.quadraticCurveTo(150, 68, 174, 80);
      ctx.stroke();

      // Temples
      ctx.beginPath();
      ctx.moveTo(34, 85);
      ctx.lineTo(12, 80);
      ctx.moveTo(266, 85);
      ctx.lineTo(288, 80);
      ctx.stroke();
      break;
    }

    case 'Aviator': {
      // Left Teardrop Lens
      ctx.fillStyle = lensFill;
      ctx.beginPath();
      ctx.moveTo(32, 60);
      ctx.bezierCurveTo(35, 45, 125, 45, 128, 60);
      ctx.bezierCurveTo(130, 105, 95, 135, 80, 135);
      ctx.bezierCurveTo(45, 135, 30, 105, 32, 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Teardrop Lens
      ctx.beginPath();
      ctx.moveTo(172, 60);
      ctx.bezierCurveTo(175, 45, 265, 45, 268, 60);
      ctx.bezierCurveTo(270, 105, 235, 135, 220, 135);
      ctx.bezierCurveTo(185, 135, 170, 105, 172, 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Double Brow Bar
      ctx.beginPath();
      ctx.moveTo(115, 52);
      ctx.lineTo(185, 52);
      ctx.moveTo(128, 65);
      ctx.quadraticCurveTo(150, 60, 172, 65);
      ctx.stroke();

      // Temples
      ctx.beginPath();
      ctx.moveTo(32, 62);
      ctx.lineTo(10, 58);
      ctx.moveTo(268, 62);
      ctx.lineTo(290, 58);
      ctx.stroke();
      break;
    }

    case 'Cat-Eye': {
      // Left Winged Lens
      ctx.fillStyle = lensFill;
      ctx.beginPath();
      ctx.moveTo(20, 48);
      ctx.quadraticCurveTo(80, 42, 130, 68);
      ctx.quadraticCurveTo(105, 128, 65, 122);
      ctx.quadraticCurveTo(25, 110, 20, 48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Winged Lens
      ctx.beginPath();
      ctx.moveTo(280, 48);
      ctx.quadraticCurveTo(220, 42, 170, 68);
      ctx.quadraticCurveTo(195, 128, 235, 122);
      ctx.quadraticCurveTo(275, 110, 280, 48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bridge
      ctx.beginPath();
      ctx.moveTo(130, 68);
      ctx.quadraticCurveTo(150, 62, 170, 68);
      ctx.stroke();
      break;
    }

    case 'Browline': {
      // Top Acetate Browline Left
      ctx.lineWidth = 7.5;
      ctx.beginPath();
      ctx.moveTo(25, 62);
      ctx.quadraticCurveTo(75, 48, 132, 62);
      ctx.stroke();

      // Top Acetate Browline Right
      ctx.beginPath();
      ctx.moveTo(168, 62);
      ctx.quadraticCurveTo(225, 48, 275, 62);
      ctx.stroke();

      // Lower Wire Rims
      ctx.lineWidth = 3.5;
      ctx.fillStyle = lensFill;
      ctx.beginPath();
      ctx.moveTo(35, 65);
      ctx.quadraticCurveTo(35, 125, 80, 125);
      ctx.quadraticCurveTo(125, 125, 128, 65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(172, 65);
      ctx.quadraticCurveTo(175, 125, 220, 125);
      ctx.quadraticCurveTo(265, 125, 265, 65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Metal Bridge
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(132, 64);
      ctx.quadraticCurveTo(150, 56, 168, 64);
      ctx.stroke();
      break;
    }

    default: // Rectangle / Wayfarer / Geometric
      // Left Rect Lens
      ctx.fillStyle = lensFill;
      drawRoundedRect(ctx, 30, 55, 100, 65, 14);
      ctx.fill();
      ctx.stroke();

      // Right Rect Lens
      drawRoundedRect(ctx, 170, 55, 100, 65, 14);
      ctx.fill();
      ctx.stroke();

      // Bridge
      ctx.beginPath();
      ctx.moveTo(130, 75);
      ctx.quadraticCurveTo(150, 68, 170, 75);
      ctx.stroke();

      // Temples
      ctx.beginPath();
      ctx.moveTo(30, 65);
      ctx.lineTo(10, 60);
      ctx.moveTo(270, 65);
      ctx.lineTo(290, 60);
      ctx.stroke();

      // Rivet Accents
      ctx.fillStyle = '#D4AF37'; // Gold Rivets
      ctx.beginPath();
      ctx.arc(38, 65, 2.5, 0, Math.PI * 2);
      ctx.arc(262, 65, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  // Lens Glass Glare / Subtle Reflection Line
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(55, 65);
  ctx.lineTo(75, 105);
  ctx.moveTo(195, 65);
  ctx.lineTo(215, 105);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Draw millimeter dimension measurement callouts anchored to the model
 */
function drawSpatialDimensions(
  ctx: CanvasRenderingContext2D,
  widthPx: number,
  heightPx: number,
  frameWidthMm: number,
  lensWidthMm: number,
  lensHeightMm: number,
  bridgeWidthMm: number,
  templeLengthMm: number
): void {
  ctx.save();
  const halfW = widthPx / 2;
  const halfH = heightPx / 2;

  // Frame Width Dimension Line at Top
  const lineY = -halfH - 18;
  ctx.strokeStyle = '#F97316'; // Orange
  ctx.lineWidth = 2;

  // Left tick
  ctx.beginPath();
  ctx.moveTo(-halfW, lineY - 6);
  ctx.lineTo(-halfW, lineY + 6);
  ctx.stroke();

  // Right tick
  ctx.beginPath();
  ctx.moveTo(halfW, lineY - 6);
  ctx.lineTo(halfW, lineY + 6);
  ctx.stroke();

  // Center horizontal line
  ctx.beginPath();
  ctx.moveTo(-halfW, lineY);
  ctx.lineTo(halfW, lineY);
  ctx.stroke();

  // Dimension Badge
  const badgeText = `FRAME: ${frameWidthMm} mm`;
  ctx.font = 'bold 11px monospace';
  const textWidth = ctx.measureText(badgeText).width;

  ctx.fillStyle = '#0F0E0D';
  ctx.strokeStyle = '#F97316';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, -textWidth / 2 - 8, lineY - 10, textWidth + 16, 20, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(badgeText, -textWidth / 2, lineY + 4);

  // Bridge Dimension Badge
  const bridgeText = `BRIDGE: ${bridgeWidthMm}mm`;
  ctx.font = 'bold 9px monospace';
  const bridgeW = ctx.measureText(bridgeText).width;
  ctx.fillStyle = 'rgba(124, 45, 18, 0.9)'; // Dark Orange
  ctx.strokeStyle = '#EA580C';
  drawRoundedRect(ctx, -bridgeW / 2 - 6, -10, bridgeW + 12, 18, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FED7AA';
  ctx.fillText(bridgeText, -bridgeW / 2, 3);

  ctx.restore();
}

/**
 * Utility: Draw rounded rectangle path
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
