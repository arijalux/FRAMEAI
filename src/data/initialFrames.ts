import { OpticalFrame } from '../types';

// BJ Homemade's handmade wooden frames (Semarang), photographed by the maker.
// Sizes and weights are estimates for typical frames of each style and the price is the
// frame-only range BJ Homemade publishes (Rp300–350 rb) — replace with measured values.
// Frames are made to order, so stock is the number that can be taken on at once.
const BRAND = 'BJ Homemade';
const SONOKELING = { name: 'Sonokeling alami', hex: '#3B2418', acetateTexture: 'matte' };
const JATI = { name: 'Jati alami', hex: '#8B5A2B', acetateTexture: 'matte' };

export const INITIAL_FRAMES: OpticalFrame[] = [
  {
    id: 'bj-flat-top',
    name: 'Sonokeling Flat-Top',
    brand: BRAND,
    shape: 'Geometric',
    style: 'bold',
    material: 'Sonokeling',
    price: 350_000,
    colors: [SONOKELING],
    dimensions: { lensWidth: 54, bridgeWidth: 18, templeLength: 145, lensHeight: 42, totalWidth: 144 },
    weightGrams: 26,
    fitFaceShapes: ['Oval', 'Round', 'Heart'],
    description:
      'Alis datar yang tegas dengan gagang lebar dari kayu sonokeling. Dibuat tangan dari limbah kayu oleh BJ Homemade, Semarang.',
    isPolarized: false,
    imageUrl: '/frames/bj-flat-top.jpg',
    model3dPreset: 'geometric',
    stock: 10,
    rating: 0,
    reviewsCount: 0,
  },
  {
    id: 'bj-square-oversize',
    name: 'Sonokeling Square Oversize',
    brand: BRAND,
    shape: 'Square',
    style: 'bold',
    material: 'Sonokeling',
    price: 350_000,
    colors: [SONOKELING],
    dimensions: { lensWidth: 56, bridgeWidth: 18, templeLength: 145, lensHeight: 52, totalWidth: 146 },
    weightGrams: 24,
    fitFaceShapes: ['Round', 'Oval', 'Heart'],
    description:
      'Lensa kotak besar dengan aksen garis kayu terang di tepi atas. Kayu sonokeling buatan tangan BJ Homemade, Semarang.',
    isPolarized: false,
    imageUrl: '/frames/bj-square-oversize.jpg',
    model3dPreset: 'wayfarer',
    stock: 10,
    rating: 0,
    reviewsCount: 0,
  },
  {
    id: 'bj-rectangle-jati',
    name: 'Jati Classic Rectangle',
    brand: BRAND,
    shape: 'Square',
    style: 'minimalist',
    material: 'Jati',
    price: 350_000,
    colors: [JATI],
    dimensions: { lensWidth: 52, bridgeWidth: 18, templeLength: 145, lensHeight: 38, totalWidth: 138 },
    weightGrams: 20,
    fitFaceShapes: ['Round', 'Oval', 'Diamond'],
    description:
      'Persegi panjang klasik dengan serat kayu jati yang hangat, cocok untuk dipakai seharian. Buatan tangan BJ Homemade, Semarang.',
    isPolarized: false,
    imageUrl: '/frames/bj-rectangle-jati.jpg',
    model3dPreset: 'wayfarer',
    stock: 10,
    rating: 0,
    reviewsCount: 0,
  },
  {
    id: 'bj-pilot',
    name: 'Sonokeling Pilot',
    brand: BRAND,
    shape: 'Aviator',
    style: 'retro',
    material: 'Sonokeling',
    price: 350_000,
    colors: [SONOKELING],
    dimensions: { lensWidth: 54, bridgeWidth: 17, templeLength: 145, lensHeight: 48, totalWidth: 140 },
    weightGrams: 22,
    fitFaceShapes: ['Oval', 'Square', 'Heart', 'Diamond'],
    description:
      'Siluet pilot membulat bergaya retro dari kayu sonokeling gelap. Buatan tangan BJ Homemade, Semarang.',
    isPolarized: false,
    imageUrl: '/frames/bj-pilot.jpg',
    model3dPreset: 'aviator',
    stock: 10,
    rating: 0,
    reviewsCount: 0,
  },
];
