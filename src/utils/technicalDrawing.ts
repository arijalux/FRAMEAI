import { FaceShape } from '../types';
import { CustomFrameParams, buildFrameGeometry, framePd, frameTotalWidth, sizeCode } from './frameGenerator';
import { faceShapeLabel, frameShapeLabel } from './format';

/**
 * One-page technical drawing for the craftsperson, to go with the SVG/DXF cut files, laid out
 * like an engineering sheet: zoned border, revision block, front and temple views at true size
 * with dimensions and centre lines, a dimension table, notes and a title block. A4 landscape, mm.
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
// Outer border, zone strip, inner border
const OUT = 10;
const IN = 15;
const INNER_R = PAGE_W - IN;
const INNER_B = PAGE_H - IN;

const LINE = '#111';
const DIM = '#444';
const THIN = 0.18;
const THICK = 0.5;

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
const line = (x1: number, y1: number, x2: number, y2: number, w = THIN, extra = '') =>
  `<line x1="${mm(x1)}" y1="${mm(y1)}" x2="${mm(x2)}" y2="${mm(y2)}" stroke="${LINE}" stroke-width="${w}" ${extra}/>`;
const rect = (x: number, y: number, w: number, h: number, sw = THIN) =>
  `<rect x="${mm(x)}" y="${mm(y)}" width="${mm(w)}" height="${mm(h)}" fill="none" stroke="${LINE}" stroke-width="${sw}"/>`;
const centerLine = (x1: number, y1: number, x2: number, y2: number) =>
  line(x1, y1, x2, y2, 0.13, `stroke-dasharray="6 1.2 0.8 1.2" stroke="${DIM}"`);

/** Horizontal dimension from x1 to x2 at height y, with extension lines from refY */
const hdim = (x1: number, x2: number, y: number, label: string, refY: number) =>
  [x1, x2].map((x) => line(x, refY + (y > refY ? 1 : -1), x, y + (y > refY ? 1.5 : -1.5), 0.13)).join('') +
  `<line x1="${mm(x1)}" y1="${mm(y)}" x2="${mm(x2)}" y2="${mm(y)}" stroke="${DIM}" stroke-width="${THIN}" marker-start="url(#a)" marker-end="url(#a)"/>` +
  text((x1 + x2) / 2, y - 1, label, 2.5, 'middle', `fill="${DIM}"`);

/** Vertical dimension from y1 to y2 at x, with extension lines from refX */
const vdim = (y1: number, y2: number, x: number, label: string, refX: number) => {
  const cy = (y1 + y2) / 2;
  return (
    [y1, y2].map((y) => line(refX - 1, y, x - 1.5, y, 0.13)).join('') +
    `<line x1="${mm(x)}" y1="${mm(y1)}" x2="${mm(x)}" y2="${mm(y2)}" stroke="${DIM}" stroke-width="${THIN}" marker-start="url(#a)" marker-end="url(#a)"/>` +
    text(x - 1, cy, label, 2.5, 'middle', `fill="${DIM}" transform="rotate(-90 ${mm(x - 1)} ${mm(cy)})"`)
  );
};

/** View caption under a view, the drafting way: name underlined, scale below */
const caption = (x: number, y: number, name: string, scale = 'SKALA 1:1') =>
  text(x, y, name, 3, 'middle', 'font-weight="700" text-decoration="underline"') + text(x, y + 3.6, scale, 2.3, 'middle', `fill="${DIM}"`);

/** One labelled cell of the title block: small caption top-left, value below */
const cell = (x: number, y: number, w: number, h: number, label: string, value: string, size = 2.7, bold = false) =>
  rect(x, y, w, h) +
  text(x + 1.2, y + 2.4, label.toUpperCase(), 1.6, 'start', `fill="${DIM}"`) +
  text(x + 1.2, y + h - 1.6, value, size, 'start', bold ? 'font-weight="700"' : '');

/** ISO first-angle projection symbol, centred at (cx, cy) */
const firstAngle = (cx: number, cy: number) => {
  const s = 1.1;
  return [
    // Side view of the cone: a trapezoid, on the left in first-angle
    `<path d="M${mm(cx - 9 * s)} ${mm(cy - 2.2 * s)} L${mm(cx - 3 * s)} ${mm(cy - 3.6 * s)} L${mm(cx - 3 * s)} ${mm(cy + 3.6 * s)} L${mm(cx - 9 * s)} ${mm(cy + 2.2 * s)} Z" fill="none" stroke="${LINE}" stroke-width="0.25"/>`,
    // End view: two circles
    `<circle cx="${mm(cx + 5 * s)}" cy="${mm(cy)}" r="${mm(3.6 * s)}" fill="none" stroke="${LINE}" stroke-width="0.25"/>`,
    `<circle cx="${mm(cx + 5 * s)}" cy="${mm(cy)}" r="${mm(2.2 * s)}" fill="none" stroke="${LINE}" stroke-width="0.25"/>`,
    centerLine(cx - 10.5 * s, cy, cx + 10 * s, cy),
  ].join('');
};

export const buildDrawingSvg = (p: CustomFrameParams, info: DrawingInfo): string => {
  const g = buildFrameGeometry(p);
  const front = box(g.outlines.front);
  const [lensL, lensR] = g.outlines.lenses.map(box);
  const temple = box(g.outlines.temple);
  const cx = p.lensWidth / 2 + p.bridgeWidth / 2;
  const date = (info.date ?? new Date()).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const drawingNo = `FA-${(info.designId ?? sizeCode(p)).slice(0, 12).toUpperCase()}`;

  // Layout: views on the left; revisions, dimension table and notes in the right column;
  // title block in the bottom-right corner, leaving the bottom-left free for the temple
  const areaL = IN + 4;
  const areaR = 200;
  const colL = 204; // right-hand column
  const tbX = 175; // title block
  const tbTop = 157;

  // Front view: centred, but shifted if needed so the B dimension on its left still fits
  const fx = Math.min(Math.max((areaL + areaR) / 2, areaL + 10 - front.x0), areaR - front.x1);
  const fy = 31 - front.y0;
  const frontBottom = fy + front.y1;
  const lensRowY = frontBottom + 8;
  const frontCaptionY = lensRowY + 8;
  // The temple goes under the front view; on big frames it moves down beside the title block
  const templeH = temple.y1 - temple.y0;
  const templeW = temple.x1 - temple.x0;
  const ty0 = Math.min(frontCaptionY + 11, INNER_B - 21 - templeH);
  const templeRight = ty0 + templeH + 20 > tbTop ? tbX - 3 : areaR;
  const tx = Math.max(areaL, Math.min((areaL + areaR - templeW) / 2, templeRight - templeW)) - temple.x0;
  const ty = ty0 - temple.y0;
  const templeBottom = ty + temple.y1;

  const piece = (d: string, x: number, y: number) =>
    `<path d="${d}" transform="translate(${mm(x)} ${mm(y)})" fill="none" stroke="${LINE}" stroke-width="${THICK}" stroke-linejoin="round"/>`;

  // Zoned border: columns 1–8 left to right, rows A–F bottom to top
  const zones: string[] = [rect(OUT, OUT, PAGE_W - 2 * OUT, PAGE_H - 2 * OUT, 0.35), rect(IN, IN, PAGE_W - 2 * IN, PAGE_H - 2 * IN, 0.7)];
  const colW = (PAGE_W - 2 * IN) / 8;
  const rowH = (PAGE_H - 2 * IN) / 6;
  for (let i = 0; i < 8; i++) {
    const x = IN + i * colW;
    if (i > 0) zones.push(line(x, OUT, x, IN, 0.25), line(x, INNER_B, x, PAGE_H - OUT, 0.25));
    zones.push(text(x + colW / 2, OUT + 3.7, String(i + 1), 2.6, 'middle'), text(x + colW / 2, PAGE_H - OUT - 1.3, String(i + 1), 2.6, 'middle'));
  }
  for (let i = 0; i < 6; i++) {
    const y = IN + i * rowH;
    const letter = 'FEDCBA'[i];
    if (i > 0) zones.push(line(OUT, y, IN, y, 0.25), line(INNER_R, y, PAGE_W - OUT, y, 0.25));
    zones.push(text(OUT + 2.5, y + rowH / 2 + 0.9, letter, 2.6, 'middle'), text(PAGE_W - OUT - 2.5, y + rowH / 2 + 0.9, letter, 2.6, 'middle'));
  }

  // Revision block, top right
  const revW = INNER_R - colL;
  const revCols = [colL, colL + 9, colL + 49, colL + 66, INNER_R];
  const revision = [
    rect(colL, IN, revW, 15),
    ...revCols.slice(1, -1).map((x) => line(x, IN + 5, x, IN + 15)),
    line(colL, IN + 5, INNER_R, IN + 5),
    line(colL, IN + 10, INNER_R, IN + 10),
    text(colL + revW / 2, IN + 3.6, 'REVISI', 2.4, 'middle', 'font-weight="700"'),
    ...['REV', 'DESKRIPSI', 'TANGGAL', 'OLEH'].map((h, i) => text(revCols[i] + 1.2, IN + 8.6, h, 1.9, 'start', `fill="${DIM}"`)),
    text(revCols[0] + 1.2, IN + 13.6, 'A', 2.3),
    text(revCols[1] + 1.2, IN + 13.6, 'Dibuat dari desain FrameAI', 2.1),
    text(revCols[2] + 1.2, IN + 13.6, date, 2.1),
    text(revCols[3] + 1.2, IN + 13.6, 'FrameAI', 2.1),
  ];

  // Dimension table, right column
  const tableRows: [string, string][] = [
    ['A', 'Lebar lensa', String(p.lensWidth)],
    ['B', 'Tinggi lensa', String(p.lensHeight)],
    ['DBL', 'Bridge', String(p.bridgeWidth)],
    ['W', 'Lebar total frame', mm(frameTotalWidth(p))],
    ['R', 'Lebar rim', String(p.rimWidth)],
    ['L', 'Panjang gagang', String(p.templeLength)],
    ['α', 'Sudut lekukan gagang', `${p.templeBend}°`],
    ['D', 'Panjang lekukan', String(p.templeDrop)],
    ['T', 'Tebal gagang di engsel', String(p.templeThickness)],
    ['PD', 'PD frame (A + DBL)', String(framePd(p))],
  ].map(([sym, name, v]) => [`${sym}  ${name}`, v]);
  const extraRows: [string, string][] = [
    ['Bentuk wajah pemesan', info.faceShape ? faceShapeLabel(info.faceShape) : '–'],
    ['Perkiraan PD pemesan', info.estimatedPd ? String(info.estimatedPd) : '–'],
    ['Ukiran (gagang kanan)', p.engraving.trim() || '–'],
  ];
  const tableTop = IN + 20;
  const rowStep = 5;
  const table: string[] = [
    rect(colL, tableTop, revW, 6),
    text(colL + 1.5, tableTop + 4.2, 'TABEL UKURAN (mm)', 2.4, 'start', 'font-weight="700"'),
  ];
  let ry = tableTop + 6;
  for (const [k, v] of [...tableRows, ...extraRows]) {
    table.push(rect(colL, ry, revW, rowStep), line(INNER_R - 22, ry, INNER_R - 22, ry + rowStep));
    table.push(text(colL + 1.5, ry + 3.5, k, 2.2), text(INNER_R - 1.5, ry + 3.5, v.slice(0, 14), 2.3, 'end'));
    ry += rowStep;
  }

  // Notes, right column under the table, wrapped to its width
  const notes = [
    'Ukuran dalam mm. Jangan menskala dari gambar; pakai tabel ukuran.',
    'Potong dari file SVG (laser) atau DXF (CNC) dengan kode ukuran yang sama.',
    'Tebal kayu depan: ____ mm. Tebal kayu gagang: ____ mm.',
    'Buat alur lensa (groove) setelah dipotong, sesuai lensa dari optik.',
    'Lubang engsel di blok engsel, sesuai engsel yang dipakai.',
    `Lekukan gagang ${p.templeBend}° pada ${p.templeDrop} mm terakhir. Cek pas sebelum finishing.`,
  ];
  const wrap = (s: string, max = 58) => {
    const lines: string[] = [];
    let cur = '';
    for (const word of s.split(' ')) {
      if ((cur + ' ' + word).trim().length > max) {
        lines.push(cur);
        cur = word;
      } else cur = (cur + ' ' + word).trim();
    }
    return [...lines, cur];
  };
  const notesTop = ry + 3;
  const notesBlock: string[] = [text(colL, notesTop + 3, 'CATATAN', 2.4, 'start', 'font-weight="700"')];
  let ny = notesTop + 7;
  notes.forEach((n, i) => {
    wrap(n).forEach((l, j) => {
      notesBlock.push(text(colL + (j ? 3 : 0), ny, j ? l : `${i + 1}. ${l}`, 2.05));
      ny += 3;
    });
    ny += 0.6;
  });
  // Scale check line
  const checkY = Math.min(ny + 2, tbTop - 4);
  notesBlock.push(
    line(colL, checkY, colL + 50, checkY, 0.35),
    ...[0, 10, 20, 30, 40, 50].map((d) => line(colL + d, checkY - 1.3, colL + d, checkY + 1.3, 0.2)),
    text(colL + 52, checkY + 0.8, '50 mm', 2.1),
    text(colL, checkY + 3.6, 'Cetak di skala 100% (Actual size) agar garis ini 50 mm.', 1.9, 'start', `fill="${DIM}"`)
  );

  // Title block, bottom right
  const tbW = INNER_R - tbX;
  const r1 = tbTop;
  const r2 = r1 + 8;
  const r3 = r2 + 8;
  const r4 = r3 + 12;
  const c1 = tbX + 42;
  const titleBlock: string[] = [
    `<rect x="${tbX}" y="${r1}" width="${mm(tbW)}" height="${mm(INNER_B - r1)}" fill="#fff" stroke="${LINE}" stroke-width="0.5"/>`,
    cell(tbX, r1, 42, 8, 'Toleransi umum', '±0,5 mm kec. disebut', 2.2),
    rect(c1, r1, 25, 8),
    text(c1 + 1.2, r1 + 2.4, 'PROYEKSI', 1.6, 'start', `fill="${DIM}"`),
    firstAngle(c1 + 13, r1 + 5.2),
    cell(c1 + 25, r1, 20, 8, 'Skala', '1:1', 3, true),
    cell(c1 + 45, r1, INNER_R - (c1 + 45), 8, 'Kertas', 'A4', 3, true),

    cell(tbX, r2, 42, 8, 'Digambar', `FrameAI · ${date}`, 2.2),
    cell(c1, r2, 32, 8, 'Diperiksa', '', 2.2),
    cell(c1 + 32, r2, INNER_R - (c1 + 32), 8, 'Disetujui', '', 2.2),

    rect(tbX, r3, 42, 12),
    text(tbX + 2.5, r3 + 6, 'frameai', 4.6, 'start', 'font-weight="700"'),
    text(tbX + 2.5, r3 + 9.8, '× BJ Homemade · Semarang', 1.9, 'start', `fill="${DIM}"`),
    cell(c1, r3, INNER_R - c1, 12, 'Judul', `FRAME KACAMATA CUSTOM · ${frameShapeLabel(p.shape).toUpperCase()}`, 2.8, true),
    text(c1 + 1.2, r3 + 5.6, `Pemesan: ${(info.customerName ?? '–').slice(0, 36)}`, 2, 'start', `fill="${DIM}"`),

    cell(tbX, r4, 42, INNER_B - r4, 'Material', info.wood, 2.4),
    cell(c1, r4, 30, INNER_B - r4, 'No. gambar', drawingNo, 2.4, true),
    cell(c1 + 30, r4, 20, INNER_B - r4, 'Kode', sizeCode(p), 2.1),
    cell(c1 + 50, r4, INNER_R - (c1 + 50), INNER_B - r4, 'Lembar', '1 / 1', 2.3),
  ];

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}mm" height="${PAGE_H}mm" viewBox="0 0 ${PAGE_W} ${PAGE_H}" font-family="Arial Narrow, Arial, Helvetica, sans-serif" fill="${LINE}">`,
    `<defs><marker id="a" viewBox="0 0 8 6" refX="7.5" refY="3" markerWidth="2.6" markerHeight="2" orient="auto-start-reverse"><path d="M0 0 L8 3 L0 6 z" fill="${DIM}"/></marker></defs>`,
    `<rect width="${PAGE_W}" height="${PAGE_H}" fill="#fff"/>`,
    ...zones,
    ...revision,

    // Front view with centre lines through the bridge and each lens
    centerLine(fx, fy + front.y0 - 4, fx, frontBottom + 4),
    ...[-cx, cx].map((c) => centerLine(fx + c, fy - p.lensHeight / 2 - 3, fx + c, fy + p.lensHeight / 2 + 3)),
    centerLine(fx + front.x0 - 3, fy, fx + front.x1 + 3, fy),
    piece(g.front, fx, fy),
    piece(g.lenses[0], fx, fy),
    piece(g.lenses[1], fx, fy),
    hdim(fx + front.x0, fx + front.x1, fy + front.y0 - 6, `W ${mm(front.x1 - front.x0)}`, fy + front.y0),
    hdim(fx + lensL.x0, fx + lensL.x1, lensRowY, `A ${p.lensWidth}`, fy + lensL.y1),
    hdim(fx + lensL.x1, fx + lensR.x0, lensRowY, `DBL ${p.bridgeWidth}`, fy + lensL.y1),
    vdim(fy + lensL.y0, fy + lensL.y1, fx + front.x0 - 6, `B ${p.lensHeight}`, fx + lensL.x0),
    caption(fx, frontCaptionY, 'TAMPAK DEPAN'),

    // Temple
    piece(g.temple, tx, ty),
    centerLine(tx + temple.x0 - 3, ty, tx + temple.x0 + 30, ty),
    // Straight-line reach of the bent temple; its length along the arm is L in the table
    hdim(tx + temple.x0, tx + temple.x1, templeBottom + 5.5, `${mm(temple.x1 - temple.x0)} (jangkauan lurus)`, templeBottom),
    text(tx + temple.x1, ty + temple.y0 - 2, `L ${p.templeLength} sepanjang gagang · α ${p.templeBend}° · D ${p.templeDrop}`, 2.3, 'end', `fill="${DIM}"`),
    caption(tx + (temple.x0 + temple.x1) / 2, templeBottom + 13, 'GAGANG (2×: KIRI & KANAN)'),

    ...table,
    ...notesBlock,
    ...titleBlock,
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
