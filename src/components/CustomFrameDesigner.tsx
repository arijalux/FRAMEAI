import React, { useDeferredValue, useMemo, useState } from 'react';
import { CheckCircle2, Download, MessageCircle, ScanFace, Send, Sparkles } from 'lucide-react';
import { FaceAnalysisResult, FrameShape } from '../types';
import { FaceScanPanel } from './FaceScanPanel';
import { faceShapeLabel, frameShapeLabel } from '../utils/format';
import { downloadCutFile } from '../utils/cutFileDownload';
import { submitCustomDesign } from '../lib/firebase';
import {
  CustomFrameParams,
  DEFAULT_PARAMS,
  PARAM_LIMITS,
  buildFrameGeometry,
  defaultLensHeight,
  estimatedFaceWidth,
  framePd,
  frameTotalWidth,
  maxRimWidth,
  paramsFromFace,
  sizeCode,
  withChange,
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
// Frame wider or narrower than the face by more than this slips or pinches
const MAX_WIDTH_OFF = 10;

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

// BJ Homemade's WhatsApp (digits only, e.g. 628123456789). Without it, chat opens their Instagram DM.
const WHATSAPP = (import.meta.env.VITE_BJ_HOMEMADE_WHATSAPP ?? '').replace(/\D/g, '');
const INSTAGRAM_DM = 'https://ig.me/m/bj.homamede';

interface CustomFrameDesignerProps {
  faceAnalysis: FaceAnalysisResult | null;
  onScanResult: (analysis: FaceAnalysisResult) => void;
  /** Only admins can download the cutting files; buyers send the design instead */
  isAdmin: boolean;
}

/** Sizes a wooden frame from the face scan and exports a true-size cutting file for BJ Homemade's machine */
export const CustomFrameDesigner: React.FC<CustomFrameDesignerProps> = ({ faceAnalysis, onScanResult, isAdmin }) => {
  const [params, setParams] = useState<CustomFrameParams>(() =>
    faceAnalysis ? paramsFromFace(faceAnalysis) : DEFAULT_PARAMS
  );
  const [wood, setWood] = useState<(typeof WOODS)[number]['id']>('sonokeling');
  const [showScan, setShowScan] = useState(false);
  const [sizedFromScan, setSizedFromScan] = useState(Boolean(faceAnalysis));
  const [sendOpen, setSendOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Slider drags stay responsive; the outline catches up a frame later
  const deferredParams = useDeferredValue(params);
  const geometry = useMemo(() => buildFrameGeometry(deferredParams), [deferredParams]);
  const woodColor = WOODS.find((w) => w.id === wood)!.color;
  const decentration = faceAnalysis ? (framePd(params) - faceAnalysis.estimatedPd) / 2 : null;
  const widthOff = faceAnalysis ? frameTotalWidth(params) - estimatedFaceWidth(faceAnalysis.estimatedPd) : null;

  const update = (patch: Partial<CustomFrameParams>) => setParams((p) => withChange(p, patch));

  const applyScan = (analysis: FaceAnalysisResult) => {
    // The scan sets the sizes; the temple style and engraving the buyer chose are kept
    setParams((p) => ({
      ...paramsFromFace(analysis),
      templeBend: p.templeBend,
      templeDrop: p.templeDrop,
      templeThickness: p.templeThickness,
      engraving: p.engraving,
    }));
    setSizedFromScan(true);
    setShowScan(false);
  };

  const woodLabel = WOODS.find((w) => w.id === wood)!.label;
  const canSend = customerName.trim().length > 0 && contact.trim().length >= 5 && sendState !== 'sending';

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSendState('sending');
    try {
      await submitCustomDesign({
        customerName: customerName.trim(),
        contact: contact.trim(),
        note: note.trim(),
        params,
        wood: woodLabel,
        sizeCode: sizeCode(params),
        faceShape: faceAnalysis?.faceShape ?? null,
        estimatedPd: faceAnalysis?.estimatedPd ?? null,
      });
      setSendState('sent');
    } catch {
      setSendState('error');
    }
  };

  const chatMessage = `Halo BJ Homemade, saya mau tanya custom frame kayu ${frameShapeLabel(params.shape).toLowerCase()} ${woodLabel.toLowerCase()} ukuran ${sizeCode(params)} dari FrameAI.`;
  const chatHref = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(chatMessage)}` : INSTAGRAM_DM;

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
          {widthOff !== null && Math.abs(widthOff) > MAX_WIDTH_OFF && (
            <p className="text-sm text-body rounded-3xl bg-sand p-4">
              Lebar total frame {Math.round(frameTotalWidth(params))} mm, sekitar {Math.round(Math.abs(widthOff))} mm lebih{' '}
              {widthOff > 0 ? 'lebar' : 'sempit'} dari perkiraan lebar wajahmu. Frame bisa{' '}
              {widthOff > 0 ? 'melorot atau terlihat kebesaran' : 'terasa menjepit di pelipis'}.
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
                    // A thick rim would close the nose opening on a narrow bridge
                    max={key === 'rimWidth' ? maxRimWidth(params.bridgeWidth) : PARAM_LIMITS[key].max}
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

          {/* Buyers send the design to BJ Homemade; the cutting files stay with the admin */}
          <section className="space-y-3">
            {sendState === 'sent' ? (
              <div className="p-5 rounded-3xl bg-sage-tint space-y-2">
                <p className="text-ink flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-sage" />
                  Desain terkirim ke BJ Homemade
                </p>
                <p className="text-sm text-body leading-relaxed">
                  Mereka akan menghubungi {contact.trim()} untuk konfirmasi harga dan waktu pengerjaan.
                </p>
                <button
                  onClick={() => {
                    setSendState('idle');
                    setSendOpen(false);
                  }}
                  className="text-sm text-ink underline underline-offset-4"
                >
                  Buat desain lain
                </button>
              </div>
            ) : sendOpen ? (
              <form onSubmit={send} className="p-5 rounded-3xl border border-line space-y-3">
                <p className="text-sm text-ink">Kirim desain ke BJ Homemade</p>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  maxLength={80}
                  placeholder="Nama"
                  autoComplete="name"
                  className="w-full h-12 px-4 rounded-full border border-line focus:border-ink outline-none text-sm text-ink"
                />
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  maxLength={80}
                  placeholder="Nomor WhatsApp atau email"
                  autoComplete="tel"
                  className="w-full h-12 px-4 rounded-full border border-line focus:border-ink outline-none text-sm text-ink"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Catatan (opsional), misalnya resep lensa atau warna finishing"
                  className="w-full px-4 py-3 rounded-3xl border border-line focus:border-ink outline-none text-sm text-ink resize-none"
                />
                {sendState === 'error' && (
                  <p className="text-sm text-body">Desain belum terkirim. Periksa koneksimu lalu coba lagi.</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSendOpen(false)}
                    className="h-12 rounded-full border border-line hover:border-ink text-ink text-sm font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!canSend}
                    className="h-12 rounded-full bg-ink hover:bg-ink-soft disabled:opacity-40 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {sendState === 'sending' ? 'Mengirim...' : 'Kirim'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSendOpen(true)}
                  className="h-12 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Kirim desain
                </button>
                <a
                  href={chatHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 rounded-full border border-line hover:border-ink text-ink text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat custom lain
                </a>
              </div>
            )}
            <p className="text-xs text-muted leading-relaxed">
              Desainmu dikirim beserta ukurannya ke BJ Homemade untuk dibuat. Mau bentuk lain atau ukiran khusus? Chat
              langsung dengan mereka.
            </p>
          </section>

          {isAdmin && (
            <section className="space-y-3 pt-6 border-t border-line">
              <span className="text-sm text-ink">File potong (khusus admin)</span>
              <div className="grid grid-cols-2 gap-3">
                {(['svg', 'dxf'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => downloadCutFile(params, format)}
                    className="h-12 rounded-full border border-line hover:border-ink text-ink text-sm font-medium flex items-center justify-center gap-2 transition-colors"
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
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
