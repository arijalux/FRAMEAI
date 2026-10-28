import { FaceShape, FrameShape, FrameMaterial, OrderStatus } from '../types';

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

/** Formats a whole-rupiah amount, e.g. 5450000 → "Rp 5.450.000" */
export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(Math.round(amount));
}

/** Indonesian VAT (PPN) applied at checkout */
export const PPN_RATE = 0.11;

// Data values stay in English (they are stored in Firestore and sent to Gemini);
// these maps only translate what is shown to the user.
const FACE_SHAPE_LABELS: Record<FaceShape, string> = {
  Oval: 'Oval',
  Square: 'Kotak',
  Round: 'Bulat',
  Heart: 'Hati',
  Diamond: 'Diamond',
};

const FRAME_SHAPE_LABELS: Record<FrameShape, string> = {
  Oval: 'Oval',
  Square: 'Kotak',
  Round: 'Bulat',
  Geometric: 'Geometris',
  Aviator: 'Aviator',
  'Cat-Eye': 'Cat-Eye',
};

const MATERIAL_LABELS: Record<FrameMaterial, string> = {
  'Italian Acetate': 'Asetat Italia',
  'Aerospace Titanium': 'Titanium Aerospace',
  'Eco-Polymer': 'Eko-Polimer',
  'Mixed Titanium Acetate': 'Kombinasi Titanium & Asetat',
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Diterima',
  crafting_lenses: 'Pembuatan Lensa',
  optical_qc: 'QC Optik',
  shipped: 'Dikirim',
  delivered: 'Selesai',
};

const SKIN_UNDERTONE_LABELS: Record<string, string> = {
  Warm: 'Hangat',
  Cool: 'Dingin',
  Neutral: 'Netral',
  Olive: 'Zaitun',
};

const JAWLINE_LABELS: Record<string, string> = {
  'Soft curved': 'Lengkung lembut',
  'Angular defined': 'Tegas bersudut',
  Tapered: 'Meruncing',
  Prominent: 'Menonjol',
};

const CHEEKBONE_LABELS: Record<string, string> = {
  High: 'Tinggi',
  Balanced: 'Seimbang',
  Subtle: 'Samar',
};

// Fall back to the raw value so unknown or AI-returned strings still render
export const faceShapeLabel = (v: string) => FACE_SHAPE_LABELS[v as FaceShape] ?? v;
export const frameShapeLabel = (v: string) => FRAME_SHAPE_LABELS[v as FrameShape] ?? v;
export const materialLabel = (v: string) => MATERIAL_LABELS[v as FrameMaterial] ?? v;
export const orderStatusLabel = (v: string) => ORDER_STATUS_LABELS[v as OrderStatus] ?? v;
export const skinUndertoneLabel = (v: string) => SKIN_UNDERTONE_LABELS[v] ?? v;
export const jawlineLabel = (v: string) => JAWLINE_LABELS[v] ?? v;
export const cheekboneLabel = (v: string) => CHEEKBONE_LABELS[v] ?? v;

const LENS_TYPE_LABELS: Record<string, string> = {
  single_vision: 'Single Vision',
  progressive: 'Progresif',
  reading: 'Baca',
  non_prescription: 'Tanpa Resep',
};

export const lensTypeLabel = (v: string) => LENS_TYPE_LABELS[v] ?? v;
