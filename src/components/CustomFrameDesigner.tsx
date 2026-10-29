import React, { useDeferredValue, useMemo, useState } from 'react';
import { Download, ScanFace, Sparkles } from 'lucide-react';
import { FaceAnalysisResult, FrameShape } from '../types';
import { FaceScanPanel } from './FaceScanPanel';
import { faceShapeLabel, frameShapeLabel } from '../utils/format';
import {
  CustomFrameParams,
  DEFAULT_PARAMS,
  PARAM_LIMITS,
  buildCutDxf,
  buildCutSvg,
  buildFrameGeometry,
  defaultLensHeight,
  framePd,
  frameTotalWidth,
  paramsFromFace,
  sizeCode,
} from '../utils/frameGenerator';

const SHAPES: FrameShape[] = ['Round', 'Oval', 'Square', 'Geometric', 'Aviator', 'Cat-Eye'];

// Preview colours only; the cut file is the same for both woods
const WOODS = [
  { id: 'sonokeling', label: 'Sonokeling', color: '#5a3826' },
  { id: 'jati', label: 'Jati', color: '#a8733f' },
] as const;

// Beyond this, each lens is shifted so far from its centre that it gets thick and heavy
const MAX_DECENTRATION = 5;
// Eyes outside the lens centres look odd and leave little room for edging, so the limit is tighter
const MAX_OUTWARD_DECENTRATION = 2;

type Slider = { key: keyof typeof PARAM_LIMITS; label: string; unit: string };

const SLIDER_GROUPS: { title: string; sliders: Slider[] }[] = [
  {
    title: 'Bingkai depan',
    sliders: [
      { key: 'lensWidth', label: 'Lebar lensa', unit: 'mm' },
      { key: 'lensHeight', label: 'Tinggi lensa', unit: 'mm' },
      { key: 'bridgeWidth', label: 'Lebar bridge', unit: 'mm' },
      { key: 'rimWidth', label: 'Tebal bingkai', unit: 'mm' },
    ],
  },
  {
    title: 'Gagang',
    sliders: [
      { key: 'templeLength', label: 'Panjang gagang', unit: 'mm' },
      { key: 'templeDrop', label: 'Panjang tekukan', unit: 'mm' },
      { key: 'templeBend', label: 'Sudut tekukan', unit: '°' },
      { key: 'templeThickness', label: 'Tebal gagang', unit: 'mm' },
    ],
  },
];

interface CustomFrameDesignerProps {
  faceAnalysis: FaceAnalysisResult | null;
  onScanResult: (analysis: FaceAnalysisResult) => void;
}

/** Sizes a wooden frame from the face scan and exports a true-size cutting file for BJ Homemade's machine */
export const CustomFrameDesigner: React.FC<CustomFrameDesignerProps> = ({ faceAnalysis, onScanResult }) => {
  const [params, setParams] = useState<CustomFrameParams>(() =>
    faceAnalysis ? paramsFromFace(faceAnalysis) : DEFAULT_PARAMS
  );
  const [wood, setWood] = useState<(typeof WOODS)[number]['id']>('sonokeling');
  const [showScan, setShowScan] = useState(false);
  const [sizedFromScan, setSizedFromScan] = useState(Boolean(faceAnalysis));

  // Slider drags stay responsive; the outline catches up a frame later
  const deferredParams = useDeferredValue(params);
  const geometry = useMemo(() => buildFrameGeometry(deferredParams), [deferredParams]);
  const woodColor = WOODS.find((w) => w.id === wood)!.color;
  const decentration = faceAnalysis ? (framePd(params) - faceAnalysis.estimatedPd) / 2 : null;

  const update = (patch: Partial<CustomFrameParams>) => setParams((p) => ({ ...p, ...patch }));

  const applyScan = (analysis: FaceAnalysisResult) => {
    setParams((p) => ({ ...paramsFromFace(analysis), engraving: p.engraving }));
    setSizedFromScan(true);
    setShowScan(false);
  };

  const download = (format: 'svg' | 'dxf') => {
    const blob =
      format === 'svg'
        ? new Blob([buildCutSvg(params)], { type: 'image/svg+xml' })
        : new Blob([buildCutDxf(params)], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `frameai-bj-homemade-${sizeCode(params)}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const pad = 6;
  const frontBox = `${-geometry.width / 2 - pad} ${geometry.top - pad} ${geometry.width + pad * 2} ${geometry.height + pad * 2}`;

  return (
    <div className="space-y-10">
      <div className="space-y-3 max-w-2xl">
        <span className="text-sm text-muted">Custom × BJ Homemade</span>
        <h1 className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.05] text-ink">Desain frame kayu sesuai wajahmu.</h1>
        <p className="text-lg text-muted leading-relaxed">
          Ukuran diambil dari scan wajah, lalu dijadikan file potong untuk mesin laser atau CNC BJ Homemade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-[32px] bg-soft p-6 md:p-10 space-y-8">
            <svg viewBox={frontBox} className="w-full h-auto" role="img" aria-label={`Pratinjau frame ${sizeCode(params)}`}>
              <path d={`${geometry.front} ${geometry.lenses.join(' ')}`} fill={woodColor} fillRule="evenodd" />
            </svg>
            <svg
              viewBox={`-2 ${geometry.templeTop - 2} ${geometry.templeWidth + 4} ${geometry.templeHeight + 4}`}
              className="w-full h-auto max-h-24"
              role="img"
              aria-label="Pratinjau gagang"
            >
              <path d={geometry.temple} fill={woodColor} />
            </svg>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Kode ukuran', sizeCode(params)],
              ['Lebar total', `${Math.round(frameTotalWidth(params))} mm`],
              ['PD frame', `${framePd(params)} mm`],
              ['PD kamu', faceAnalysis ? `${faceAnalysis.estimatedPd} mm` : 'Belum scan'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-line p-4 space-y-1">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {decentration !== null && decentration > MAX_DECENTRATION && (
            <p className="text-sm text-body rounded-3xl bg-sand p-4">
              PD frame jauh lebih lebar dari PD kamu, jadi lensa harus digeser {decentration.toFixed(1)} mm per mata. Coba
              kecilkan lebar lensa atau bridge.
            </p>
          )}
          {decentration !== null && decentration < -MAX_OUTWARD_DECENTRATION && (
            <p className="text-sm text-body rounded-3xl bg-sand p-4">
              PD frame lebih sempit dari PD kamu, jadi matamu ada di luar titik tengah lensa (
              {Math.abs(decentration).toFixed(1)} mm per mata). Coba besarkan lebar lensa atau bridge.
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="lg:col-span-5 space-y-8">
          <section className="space-y-3">
            {faceAnalysis && !showScan ? (
              <div className="p-5 rounded-3xl bg-sage-tint flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-sage">{sizedFromScan ? 'Ukuran dari scan' : 'Hasil scan'}</span>
                  <p className="text-ink">
                    Wajah {faceShapeLabel(faceAnalysis.faceShape).toLowerCase()} · PD {faceAnalysis.estimatedPd} mm
                  </p>
                </div>
                <div className="flex gap-2">
                  {!sizedFromScan && (
                    <button onClick={() => applyScan(faceAnalysis)} className="h-10 px-4 rounded-full bg-ink text-white text-sm font-medium">
                      Pakai
                    </button>
                  )}
                  <button onClick={() => setShowScan(true)} className="h-10 px-4 rounded-full border border-line bg-white text-sm text-ink">
                    Scan ulang
                  </button>
                </div>
              </div>
            ) : showScan ? (
              <FaceScanPanel
                onResult={(analysis) => {
                  onScanResult(analysis);
                  applyScan(analysis);
                }}
              />
            ) : (
              <button
                onClick={() => setShowScan(true)}
                className="w-full h-12 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <ScanFace className="w-4 h-4" />
                Ukur dari scan wajah
              </button>
            )}
            {faceAnalysis && (
              <p className="text-xs text-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Bentuk {frameShapeLabel(faceAnalysis.recommendedShapes[0] ?? 'Round').toLowerCase()} direkomendasikan untuk wajahmu.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm text-ink">Bentuk</h2>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((shape) => (
                <button
                  key={shape}
                  onClick={() => update({ shape, lensHeight: defaultLensHeight(shape, params.lensWidth) })}
                  aria-pressed={params.shape === shape}
                  className={`h-10 px-4 rounded-full border text-sm transition-colors ${
                    params.shape === shape ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink text-ink'
                  }`}
                >
                  {frameShapeLabel(shape)}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm text-ink">Kayu</h2>
            <div className="flex flex-wrap gap-2">
              {WOODS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWood(w.id)}
                  aria-pressed={wood === w.id}
                  className={`h-10 pl-2 pr-4 rounded-full border text-sm flex items-center gap-2 transition-colors ${
                    wood === w.id ? 'border-ink text-ink' : 'border-line hover:border-ink text-body'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full" style={{ background: w.color }} />
                  {w.label}
                </button>
              ))}
            </div>
          </section>

          {SLIDER_GROUPS.map((group) => (
            <section key={group.title} className="space-y-5">
              <h2 className="text-sm text-ink">{group.title}</h2>
              {group.sliders.map(({ key, label, unit }) => (
                <label key={key} className="block space-y-2">
                  <span className="flex justify-between text-sm">
                    <span className="text-body">{label}</span>
                    <span className="text-ink tabular-nums">
                      {params[key]}
                      {unit === '°' ? unit : ` ${unit}`}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={PARAM_LIMITS[key].min}
                    max={PARAM_LIMITS[key].max}
                    step={1}
                    value={params[key]}
                    onChange={(e) => update({ [key]: Number(e.target.value) })}
                    className="w-full accent-ink"
                  />
                </label>
              ))}
            </section>
          ))}

          <label className="block space-y-2">
            <span className="text-sm text-ink">Ukiran di gagang</span>
            <input
              type="text"
              maxLength={24}
              value={params.engraving}
              onChange={(e) => update({ engraving: e.target.value })}
              placeholder="Contoh: nama kamu"
              className="w-full h-12 px-4 rounded-full border border-line focus:border-ink outline-none text-sm text-ink"
            />
          </label>

          <div className="space-y-3">
            <span className="text-sm text-ink">Unduh file potong</span>
            <div className="grid grid-cols-2 gap-3">
              {(['svg', 'dxf'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => download(format)}
                  className="h-12 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Ukuran asli dalam milimeter. SVG untuk software laser, DXF untuk CNC atau CAD. Garis potong merah (layer
              CUT), ukiran hitam (layer ENGRAVE). Lubang lensa perlu disesuaikan dengan alur lensa dari optik.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
