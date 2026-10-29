/** Frames that can be shown at real size on a printed card. Others are listed as coming soon. */
export interface RealSizeModel {
  id: string;
  name: string;
  url: string;
  /** Front width in mm; the model is scaled so its widest point matches this */
  totalWidthMm: number;
  credit?: { title: string; author: string; license: string; url: string };
}

export const REAL_SIZE_MODELS: RealSizeModel[] = [
  {
    id: 'wood-glasses',
    name: 'Kacamata kayu (contoh 3D)',
    url: '/models/wood-glasses.glb',
    // The sample model has no published dimensions; 140 mm is a typical adult frame width
    totalWidthMm: 140,
    credit: {
      title: 'Glasses',
      author: 'Marius.Eder',
      license: 'CC BY 4.0',
      url: 'https://sketchfab.com/3d-models/glasses-007651a9450746a5b6c5a126d484cd52',
    },
  },
];

/** The printed card's tracking marker: ArUco MIP 36h12 id, printed this many mm wide (black border included) */
export const CARD_MARKER = { dictionary: 'ARUCO_MIP_36h12', id: 7, sizeMm: 80 } as const;

/** Query parameter the card's QR code opens, e.g. ?ukuran-asli=wood-glasses */
export const REAL_SIZE_PARAM = 'ukuran-asli';

export const realSizeUrl = (modelId: string, origin = window.location.origin) =>
  `${origin}/?${REAL_SIZE_PARAM}=${encodeURIComponent(modelId)}`;
