import { FaceShape } from '../types';
import { CustomFrameParams, buildFrameGeometry, framePd, frameTotalWidth, sizeCode } from './frameGenerator';
import { faceShapeLabel, frameShapeLabel } from './format';

/**
 * One-page technical drawing for the craftsperson, to go with the SVG/DXF cut files: the
 * front and a temple at true size with their key dimensions, a table of every measurement,
 * the customer's face data, and the finishing steps a 2D cut can't do. A4 landscape, in mm.
 */

export interface DrawingInfo {
  designId?: string;
  customerName?: string;
  wood: string;
  faceShape?: FaceShape | null;
  estimatedPd?: number | null;
  date?: Date;
}

type Pt = [number, number];

const PAGE_W = 297;
const PAGE_H = 210;
const LINE = '#111';
const DIM = '#555';

const esc = (s: string) =>
  s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]!);
const mm = (v: number) => `${Math.round(v * 10) / 10}`;

const box = (pts: Pt[]) => {
  const xs = pts.map(([x]) => x);
  const ys = pts.map(([, y]) => y);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

const text = (x: number, y: number, s: string, size = 2.6, anchor: 'start' | 'middle' | 'end' = 'start', extra = '') =>
  `<text x="${mm(x)}" y="${mm(y)}" font-size="${size}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;

/** Horizontal dimension from x1 to x2, drawn at height y, with extension lines from refY */
const hdim = (x1: number, x2: number, y: number, label: string, refY?: number) => {
  const ext =
    refY === undefined
      ? ''
      : [x1, x2].map((x) => `<line x1="${mm(x)}" y1="${mm(refY)}" x2="${mm(x)}" y2="${mm(y + (y > refY ? 1.5 : -1.5))}" stroke="${DIM}" stroke-width="0.15"/>`).join('');
  return `${ext}<line x1="${mm(x1)}" y1="${mm(y)}" x2="${mm(x2)}" y2="${mm(y)}" stroke="${DIM}" stroke-width="0.2" marker-start="url(#a)" marker-end="url(#a)"/>${text((x1 + x2) / 2, y - 1.2, label, 2.6, 'middle', `fill="${DIM}"`)}`;
};

/** Vertical dimension from y1 to y2, drawn at x, with extension lines from refX */
const vdim = (y1: number, y2: number, x: number, label: string, refX: number) => {
  const ext = [y1, y2]
    .map((y) => `<line x1="${mm(refX)}" y1="${mm(y)}" x2="${mm(x - 1.5)}" y2="${mm(y)}" stroke="${DIM}" stroke-width="0.15"/>`)
    .join('');
  const cy = (y1 + y2) / 2;
  return `${ext}<line x1="${mm(x)}" y1="${mm(y1)}" x2="${mm(x)}" y2="${mm(y2)}" stroke="${DIM}" stroke-width="0.2" marker-start="url(#a)" marker-end="url(#a)"/>${text(x - 1.2, cy, label, 2.6, 'middle', `fill="${DIM}" transform="rotate(-90 ${mm(x - 1.2)} ${mm(cy)})"`)}`;
};

export const buildDrawingSvg = (p: CustomFrameParams, info: DrawingInfo): string => {
  const g = buildFrameGeometry(p);
  const front = box(g.outlines.front);
  const [lensL, lensR] = g.outlines.lenses.map(box);
  const temple = box(g.outlines.temple);

  // Drawing area on the left, title block on the right
  const areaX = 10;
  const areaW = 188;
  const fx = areaX + areaW / 2; // bridge centre
  const fy = 34 - front.y0; // front's top edge at y = 34
  const frontBottom = fy + front.y1;

  const ty0 = frontBottom + 34; // temple's top edge
  const tx = areaX + (areaW - (temple.x1 - temple.x0)) / 2 - temple.x0;
  const ty = ty0 - temple.y0;
  const templeBottom = ty + temple.y1;

  const lensRowY = frontBottom + 9;
  const date = (info.date ?? new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const rows: [string, string][] = [
    ['Bentuk', frameShapeLabel(p.shape)],
    ['Kayu', info.wood],
    ['Kode ukuran', sizeCode(p)],
    ['Lebar lensa (A)', `${p.lensWidth} mm`],
    ['Tinggi lensa (B)', `${p.lensHeight} mm`],
    ['Bridge (DBL)', `${p.bridgeWidth} mm`],
    ['Lebar total frame', `${mm(frameTotalWidth(p))} mm`],
    ['Lebar rim', `${p.rimWidth} mm`],
    ['Panjang gagang', `${p.templeLength} mm`],
    ['Lekukan gagang', `${p.templeBend}° · ${p.templeDrop} mm`],
    ['Tebal gagang di engsel', `${p.templeThickness} mm`],
    ['PD frame (A + DBL)', `${framePd(p)} mm`],
    ['Ukiran', p.engraving.trim() || '–'],
  ];
  const face: [string, string][] = [
    ['Bentuk wajah', info.faceShape ? faceShapeLabel(info.faceShape) : '–'],
    ['Perkiraan PD', info.estimatedPd ? `${info.estimatedPd} mm` : '–'],
  ];
  const notes = [
    'Tebal kayu depan: ______ mm',
    'Tebal kayu gagang: ______ mm',
    'Buat alur lensa (groove) setelah dipotong,',
    '  sesuaikan dengan lensa dari optik.',
    'Pasang engsel di blok engsel; ukur lubang',
    '  sesuai engsel yang dipakai.',
    `Bentuk lekukan gagang ${p.templeBend}° di ${p.templeDrop} mm terakhir.`,
    'Cek pas di wajah sebelum finishing.',
  ];

  const tbX = 206;
  const tbW = PAGE_W - 10 - tbX;
  let y = 10;
  const block: string[] = [
    `<rect x="${tbX}" y="10" width="${tbW}" height="${PAGE_H - 20}" fill="none" stroke="${LINE}" stroke-width="0.3"/>`,
  ];
  y += 7;
  block.push(text(tbX + 4, y, 'Gambar kerja frame custom', 4, 'start', 'font-weight="600"'));
  y += 5;
  block.push(text(tbX + 4, y, 'FrameAI × BJ Homemade', 2.8, 'start', `fill="${DIM}"`));
  y += 6;
  for (const [k, v] of [
    ['Kode desain', info.designId ?? '–'],
    ['Pemesan', info.customerName ?? '–'],
    ['Tanggal', date],
  ] as [string, string][]) {
    block.push(text(tbX + 4, y, k, 2.5, 'start', `fill="${DIM}"`), text(tbX + tbW - 4, y, v.slice(0, 32), 2.5, 'end'));
    y += 4.2;
  }
  const section = (title: string, items: [string, string][]) => {
    y += 2;
    block.push(`<line x1="${tbX}" y1="${mm(y)}" x2="${tbX + tbW}" y2="${mm(y)}" stroke="${LINE}" stroke-width="0.2"/>`);
    y += 5;
    block.push(text(tbX + 4, y, title, 2.8, 'start', 'font-weight="600"'));
    y += 4.6;
    for (const [k, v] of items) {
      block.push(text(tbX + 4, y, k, 2.5, 'start', `fill="${DIM}"`), text(tbX + tbW - 4, y, v.slice(0, 26), 2.5, 'end'));
      y += 4.2;
    }
  };
  section('Ukuran', rows);
  section('Data wajah pemesan', face);
  y += 2;
  block.push(`<line x1="${tbX}" y1="${mm(y)}" x2="${tbX + tbW}" y2="${mm(y)}" stroke="${LINE}" stroke-width="0.2"/>`);
  y += 5;
  block.push(text(tbX + 4, y, 'Catatan pengerjaan', 2.8, 'start', 'font-weight="600"'));
  y += 4.6;
  for (const n of notes) {
    block.push(text(tbX + 4, y, n, 2.4));
    y += 3.9;
  }

  const piece = (d: string, x: number, yy: number) =>
    `<path d="${d}" transform="translate(${mm(x)} ${mm(yy)})" fill="none" stroke="${LINE}" stroke-width="0.3"/>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}mm" height="${PAGE_H}mm" viewBox="0 0 ${PAGE_W} ${PAGE_H}" font-family="Arial, Helvetica, sans-serif" fill="${LINE}">`,
    `<defs><marker id="a" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="2.2" markerHeight="2.2" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6 z" fill="${DIM}"/></marker></defs>`,
    `<rect x="5" y="5" width="${PAGE_W - 10}" height="${PAGE_H - 10}" fill="none" stroke="${LINE}" stroke-width="0.4"/>`,

    // Front view
    text(areaX, 16, 'TAMPAK DEPAN · SKALA 1:1', 2.8, 'start', 'font-weight="600"'),
    piece(g.front, fx, fy),
    piece(g.lenses[0], fx, fy),
    piece(g.lenses[1], fx, fy),
    `<line x1="${mm(fx)}" y1="${mm(fy + front.y0 - 3)}" x2="${mm(fx)}" y2="${mm(frontBottom + 3)}" stroke="${DIM}" stroke-width="0.15" stroke-dasharray="3 1 0.6 1"/>`,
    hdim(fx + front.x0, fx + front.x1, fy + front.y0 - 7, `${mm(front.x1 - front.x0)} mm`, fy + front.y0),
    hdim(fx + lensL.x0, fx + lensL.x1, lensRowY, `A ${p.lensWidth}`, fy + lensL.y1),
    hdim(fx + lensL.x1, fx + lensR.x0, lensRowY, `DBL ${p.bridgeWidth}`, fy + lensL.y1),
    vdim(fy + lensL.y0, fy + lensL.y1, fx + front.x0 - 5, `B ${p.lensHeight}`, fx + lensL.x0),

    // Temple
    text(areaX, ty0 - 9, 'GAGANG · SKALA 1:1 · BUAT 2 (KIRI & KANAN)', 2.8, 'start', 'font-weight="600"'),
    piece(g.temple, tx, ty),
    // Straight-line reach of the bent temple; its length along the arm is in the table
    hdim(tx + temple.x0, tx + temple.x1, templeBottom + 7, `${mm(temple.x1 - temple.x0)} mm (jangkauan lurus)`, templeBottom),
    text(tx + temple.x0, templeBottom + 13, `Panjang ${p.templeLength} mm diukur sepanjang gagang · lekukan ${p.templeBend}° pada ${p.templeDrop} mm terakhir · tebal ${p.templeThickness} mm di engsel, menipis ke ujung`, 2.4, 'start', `fill="${DIM}"`),

    // Scale check
    `<line x1="${areaX}" y1="${PAGE_H - 14}" x2="${areaX + 50}" y2="${PAGE_H - 14}" stroke="${LINE}" stroke-width="0.4"/>`,
    ...[0, 10, 20, 30, 40, 50].map((d) => `<line x1="${areaX + d}" y1="${PAGE_H - 15.5}" x2="${areaX + d}" y2="${PAGE_H - 12.5}" stroke="${LINE}" stroke-width="0.25"/>`),
    text(areaX + 54, PAGE_H - 13, 'Garis ini harus tepat 50 mm. Kalau tidak, cetak ulang di skala 100% (Actual size).', 2.4, 'start', `fill="${DIM}"`),
    text(areaX, PAGE_H - 8, 'Ukuran dalam milimeter. File potong: SVG (laser) dan DXF (CNC) dengan kode ukuran yang sama.', 2.4, 'start', `fill="${DIM}"`),

    ...block,
    `</svg>`,
  ].join('\n');
};

/** Opens the print dialog for the drawing; "Save as PDF" there gives the PDF file */
export async function printDrawing(p: CustomFrameParams, info: DrawingInfo): Promise<void> {
  const svg = buildDrawingSvg(p, info);
  const title = `Gambar kerja ${info.designId ?? sizeCode(p)}`;
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>@page { size: A4 landscape; margin: 0; } * { margin: 0; padding: 0; } html, body { width: 297mm; height: 210mm; } svg { display: block; }</style>
</head><body>${svg}</body></html>`;

  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed; right:0; bottom:0; width:0; height:0; border:0;';
  frame.srcdoc = html;
  document.body.appendChild(frame);
  await new Promise<void>((resolve) => (frame.onload = () => resolve()));
  const win = frame.contentWindow!;
  win.addEventListener('afterprint', () => setTimeout(() => frame.remove(), 1000), { once: true });
  win.focus();
  win.print();
  // Some browsers never fire afterprint for iframes
  setTimeout(() => frame.isConnected && frame.remove(), 60_000);
}
