import QRCode from 'qrcode';
import { CARD_MARKER, RealSizeModel, realSizeUrl } from './realSizeModels';
import { markerSvg } from './markerTracker';

const escapeHtml = (s: string) =>
  s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * A4 card in millimetres: tracking marker, QR code to open the viewer, and a 10 cm line to
 * check the print was not scaled. Printed from a hidden iframe so the page's own styles
 * and layout don't affect the result.
 */
export async function buildCardHtml(model: RealSizeModel): Promise<string> {
  const url = realSizeUrl(model.id);
  const qr = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  // The generated marker SVG is 10 cells wide with a 1-cell white margin around the 8-cell
  // black square; size it so the black square prints at exactly CARD_MARKER.sizeMm
  const markerBox = (CARD_MARKER.sizeMm * 10) / 8;
  const credit = model.credit
    ? `Model 3D: “${escapeHtml(model.credit.title)}” oleh ${escapeHtml(model.credit.author)} · ${escapeHtml(model.credit.license)}`
    : '';

  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>Kartu Coba FrameAI</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; height: 297mm; }
  body { font-family: "Instrument Sans", Arial, Helvetica, sans-serif; color: #111; position: relative; }
  .abs { position: absolute; }
  h1 { font-size: 9mm; font-weight: 400; letter-spacing: -0.04em; }
  p { font-size: 3.6mm; line-height: 1.45; color: #555; }
  .marker svg, .qr svg { width: 100%; height: 100%; display: block; }
  .ruler { height: 6mm; border-left: 0.3mm solid #111; border-right: 0.3mm solid #111; }
  .ruler::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 0.3mm solid #111; }
  .tick { position: absolute; top: 1.5mm; height: 3mm; border-left: 0.2mm solid #111; }
  ol { font-size: 3.6mm; line-height: 1.6; color: #333; padding-left: 5mm; }
</style></head>
<body>
  <div class="abs" style="left:18mm; top:16mm; right:18mm;">
    <h1>Kartu Coba FrameAI</h1>
    <p style="margin-top:2mm">${escapeHtml(model.name)} · lebar frame sekitar ${model.totalWidthMm} mm</p>
  </div>

  <ol class="abs" style="left:18mm; top:40mm; width:120mm;">
    <li>Letakkan kartu ini rata di meja yang terang.</li>
    <li>Pindai QR di bawah dengan kamera HP, lalu tekan “Buka kamera”.</li>
    <li>Arahkan kamera ke kotak hitam besar. Kacamata muncul dengan ukuran aslinya.</li>
  </ol>

  <div class="abs marker" style="left:${(210 - markerBox) / 2}mm; top:118mm; width:${markerBox}mm; height:${markerBox}mm;">${markerSvg()}</div>
  <p class="abs" style="left:0; right:0; top:${118 + markerBox + 2}mm; text-align:center; font-size:3mm;">Jangan tutupi kotak hitam ini</p>

  <div class="abs qr" style="left:18mm; top:242mm; width:32mm; height:32mm;">${qr}</div>
  <p class="abs" style="left:54mm; top:243mm; width:32mm;">Pindai untuk membuka di HP</p>

  <div class="abs" style="left:92mm; top:244mm; width:100mm;">
    <div class="ruler" style="position:relative; width:100mm;">
      ${Array.from({ length: 9 }, (_, i) => `<span class="tick" style="left:${(i + 1) * 10}mm"></span>`).join('')}
    </div>
    <p style="margin-top:2mm">Garis ini harus tepat 10 cm. Kalau tidak, cetak ulang dengan skala 100% (“Actual size”, bukan “Fit to page”).</p>
  </div>

  <p class="abs" style="left:18mm; right:18mm; bottom:10mm; font-size:2.6mm;">${credit}</p>
</body></html>`;
}

/** Opens the print dialog for the card (print or save as PDF) */
export async function printCard(model: RealSizeModel): Promise<void> {
  const html = await buildCardHtml(model);
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed; right:0; bottom:0; width:0; height:0; border:0;';
  frame.srcdoc = html;
  document.body.appendChild(frame);
  await new Promise<void>((resolve) => (frame.onload = () => resolve()));
  const win = frame.contentWindow!;
  const cleanup = () => setTimeout(() => frame.remove(), 1000);
  win.addEventListener('afterprint', cleanup, { once: true });
  win.focus();
  win.print();
  // Some browsers never fire afterprint for iframes
  setTimeout(() => frame.isConnected && frame.remove(), 60_000);
}
