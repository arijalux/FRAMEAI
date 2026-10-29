import { CustomFrameParams, buildCutDxf, buildCutSvg, sizeCode } from './frameGenerator';

/** Saves the cutting sheet for a design as an SVG (laser) or DXF (CNC / CAD) file */
export const downloadCutFile = (params: CustomFrameParams, format: 'svg' | 'dxf', name = 'frameai-bj-homemade') => {
  const blob =
    format === 'svg'
      ? new Blob([buildCutSvg(params)], { type: 'image/svg+xml' })
      : new Blob([buildCutDxf(params)], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}-${sizeCode(params)}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
};
