import React, { useState } from 'react';
import { OpticalFrame, FrameColorOption, LensConfiguration, PrescriptionInput, LensType, LensIndex } from '../types';
import type { LensTint } from './ThreeFrameCanvas';
import { LazyThreeFrameCanvas } from './LazyThreeFrameCanvas';
import {
  calculateLensPricing,
  validatePrescription,
  LENS_TYPE_PRICES,
  INDEX_UPGRADE_PRICES,
  TREATMENT_PRICES,
} from '../utils/opticalMath';
import { formatRupiah, frameShapeLabel, materialLabel } from '../utils/format';

const addOnPrice = (amount: number) => (amount === 0 ? 'Termasuk' : `+${formatRupiah(amount)}`);
import { X, Check, ShoppingBag, Eye, Shield, Sun, Sparkles, AlertCircle } from 'lucide-react';

interface LensConfiguratorModalProps {
  frame: OpticalFrame;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    frame: OpticalFrame,
    selectedColor: FrameColorOption,
    lensConfig: LensConfiguration,
    totalPrice: number
  ) => void;
  initialTint?: LensTint;
}

export const LensConfiguratorModal: React.FC<LensConfiguratorModalProps> = ({
  frame,
  isOpen,
  onClose,
  onAddToCart,
  initialTint = 'clear',
}) => {
  const [selectedColor, setSelectedColor] = useState<FrameColorOption>(frame.colors[0]);
  const [lensTint, setLensTint] = useState<LensTint>(initialTint);

  // Lens configuration state
  const [lensType, setLensType] = useState<LensType>('single_vision');
  const [lensIndex, setLensIndex] = useState<LensIndex>('1.60_thin');
  const [blueLightFilter, setBlueLightFilter] = useState<boolean>(true);
  const [photochromic, setPhotochromic] = useState<boolean>(false);
  const [antiReflective, setAntiReflective] = useState<boolean>(true);

  // Prescription Inputs
  const [hasPrescription, setHasPrescription] = useState<boolean>(false);
  const [prescription, setPrescription] = useState<PrescriptionInput>({
    odSph: -1.75,
    odCyl: -0.5,
    odAxis: 90,
    osSph: -2.0,
    osCyl: -0.25,
    osAxis: 85,
    pd: 63,
  });

  const [prescriptionErrors, setPrescriptionErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  // Compute pricing
  const pricing = calculateLensPricing(frame.price, {
    type: lensType,
    index: lensIndex,
    blueLightFilter,
    photochromic,
    antiReflective,
  });

  const handlePrescriptionChange = (key: keyof PrescriptionInput, value: number) => {
    const updated = { ...prescription, [key]: value };
    setPrescription(updated);
    const valRes = validatePrescription(updated);
    setPrescriptionErrors(valRes.errors);
  };

  const handleAdd = () => {
    if (hasPrescription) {
      const valRes = validatePrescription(prescription);
      if (!valRes.isValid) {
        setPrescriptionErrors(valRes.errors);
        return;
      }
    }

    onAddToCart(
      frame,
      selectedColor,
      {
        type: lensType,
        index: lensIndex,
        blueLightFilter,
        photochromic,
        antiReflective,
        prescription: hasPrescription ? prescription : undefined,
      },
      pricing.total
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-ink/40 backdrop-blur-md animate-in fade-in overflow-y-auto">
      {/* my-auto centers short content without clipping the top of tall content */}
      <div className="relative w-full max-w-6xl bg-white border border-line rounded-3xl shadow-float my-auto">
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-line flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-normal tracking-[-0.03em] text-ink">
              Atur Lensa Kacamata
            </h2>
            <p className="text-sm text-muted">
              {frame.name} · {frameShapeLabel(frame.shape)} · {materialLabel(frame.material)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Pengaturan Lensa"
            className="p-2 rounded-full hover:bg-soft-strong text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 md:px-8 py-8">
          {/* Left Column: 3D Frame Inspection View */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl overflow-hidden border border-line">
              <LazyThreeFrameCanvas
                frame={frame}
                selectedColor={selectedColor}
                lensTint={photochromic ? 'photochromic' : blueLightFilter ? 'blue_light' : lensTint}
                onLensTintChange={setLensTint}
              />
            </div>

            {/* Color Swatch Options */}
            <div className="p-4 rounded-2xl bg-soft border border-line">
              <span className="text-sm text-body block mb-3">Warna frame</span>
              <div className="flex flex-wrap items-center gap-2">
                {frame.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      selectedColor.name === c.name
                        ? 'bg-white border-sage-line text-ink'
                        : 'border-line text-muted hover:text-ink'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Customization Steps */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Lens Purpose / Type */}
            <div className="space-y-3">
              <h3 className="flex items-baseline gap-2 text-base text-ink">
                <span className="text-sm text-faint tabular-nums">01</span>
                Jenis lensa
              </h3>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  { id: 'single_vision', name: 'Single Vision', price: addOnPrice(LENS_TYPE_PRICES.single_vision), desc: 'Jarak jauh atau baca' },
                  { id: 'progressive', name: 'Progresif', price: addOnPrice(LENS_TYPE_PRICES.progressive), desc: 'Multifokus tanpa garis' },
                  { id: 'reading', name: 'Baca', price: addOnPrice(LENS_TYPE_PRICES.reading), desc: 'Hanya pembesaran' },
                  { id: 'non_prescription', name: 'Plano / Fashion', price: formatRupiah(0), desc: 'Tanpa koreksi' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setLensType(t.id as LensType)}
                    className={`p-4 rounded-2xl border text-left transition-colors ${
                      lensType === t.id ? 'bg-sage-tint border-ink' : 'bg-soft border-transparent hover:border-line-strong'
                    }`}
                  >
                    <div className="text-sm font-medium text-ink">{t.name}</div>
                    <div className="text-sm text-sage tabular-nums mt-1">{t.price}</div>
                    <div className="text-xs text-muted leading-relaxed mt-2">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Lens Index (Thinness) */}
            <div className="space-y-3">
              <h3 className="flex items-baseline gap-2 text-base text-ink">
                <span className="text-sm text-faint tabular-nums">02</span>
                Ketebalan & indeks lensa
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: '1.50_standard',
                    name: '1.50 Standard CR-39',
                    price: addOnPrice(INDEX_UPGRADE_PRICES['1.50_standard']),
                    rec: 'Disarankan untuk SPH 0.00 s.d. ±2.00',
                  },
                  {
                    id: '1.60_thin',
                    name: '1.60 Polikarbonat Tipis',
                    price: addOnPrice(INDEX_UPGRADE_PRICES['1.60_thin']),
                    rec: 'Tahan benturan, hingga SPH ±4.00',
                  },
                  {
                    id: '1.67_ultrathin',
                    name: '1.67 Ultra Tipis High Index',
                    price: addOnPrice(INDEX_UPGRADE_PRICES['1.67_ultrathin']),
                    rec: '40% lebih tipis, hingga SPH ±6.50',
                  },
                  {
                    id: '1.74_high_index',
                    name: '1.74 Super Tipis High Index',
                    price: addOnPrice(INDEX_UPGRADE_PRICES['1.74_high_index']),
                    rec: 'Lensa paling tipis kami, hingga SPH ±10.00',
                  },
                ].map((idxOpt) => (
                  <button
                    key={idxOpt.id}
                    onClick={() => setLensIndex(idxOpt.id as LensIndex)}
                    className={`p-4 rounded-2xl border text-left transition-colors ${
                      lensIndex === idxOpt.id ? 'bg-sage-tint border-ink' : 'bg-soft border-transparent hover:border-line-strong'
                    }`}
                  >
                    <div className="text-sm font-medium text-ink">{idxOpt.name}</div>
                    <div className="text-sm text-sage tabular-nums mt-1">{idxOpt.price}</div>
                    <div className="text-xs text-muted leading-relaxed mt-2">{idxOpt.rec}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Optical Coatings & Advanced Filters */}
            <div className="space-y-3">
              <h3 className="flex items-baseline gap-2 text-base text-ink">
                <span className="text-sm text-faint tabular-nums">03</span>
                Lapisan & filter
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setBlueLightFilter((b) => !b)}
                  className={`p-4 rounded-2xl border text-left transition-colors ${
                    blueLightFilter ? 'bg-sage-tint border-ink' : 'bg-soft border-transparent hover:border-line-strong'
                  }`}
                >
                  <div className="text-sm font-medium text-ink">Filter Blue Light</div>
                  <div className="text-sm text-sage tabular-nums mt-1">{addOnPrice(TREATMENT_PRICES.blueLightFilter)}</div>
                  <div className="text-xs text-muted leading-relaxed mt-2">Menyaring cahaya biru HEV 420nm dari layar</div>
                </button>

                <button
                  onClick={() => setPhotochromic((p) => !p)}
                  className={`p-4 rounded-2xl border text-left transition-colors ${
                    photochromic ? 'bg-sage-tint border-ink' : 'bg-soft border-transparent hover:border-line-strong'
                  }`}
                >
                  <div className="text-sm font-medium text-ink">Photochromic</div>
                  <div className="text-sm text-sage tabular-nums mt-1">{addOnPrice(TREATMENT_PRICES.photochromic)}</div>
                  <div className="text-xs text-muted leading-relaxed mt-2">Otomatis menggelap saat terkena sinar UV</div>
                </button>

                <button
                  onClick={() => setAntiReflective((a) => !a)}
                  className={`p-4 rounded-2xl border text-left transition-colors ${
                    antiReflective ? 'bg-sage-tint border-ink' : 'bg-soft border-transparent hover:border-line-strong'
                  }`}
                >
                  <div className="text-sm font-medium text-ink">Anti-Refleksi</div>
                  <div className="text-sm text-sage tabular-nums mt-1">{addOnPrice(TREATMENT_PRICES.antiReflective)}</div>
                  <div className="text-xs text-muted leading-relaxed mt-2">Mengurangi silau lampu kendaraan & layar</div>
                </button>
              </div>
            </div>

            {/* 4. Prescription Input Toggle */}
            <div className="p-4 rounded-2xl bg-soft space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="space-y-1 pr-4">
                  <span className="text-sm font-medium text-ink block">Tambahkan resep kacamata</span>
                  <span className="text-xs text-muted leading-relaxed block">
                    Masukkan nilai Sphere (SPH), Cylinder (CYL), Axis, dan Jarak Pupil (PD).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hasPrescription}
                  onChange={(e) => setHasPrescription(e.target.checked)}
                  className="shrink-0 w-5 h-5 rounded accent-ink cursor-pointer"
                />
              </label>

              {hasPrescription && (
                <div className="pt-3 border-t border-line space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-muted block mb-1.5">
                        OD Kanan SPH
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={prescription.odSph}
                        onChange={(e) => handlePrescriptionChange('odSph', parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-3 rounded-full bg-white border border-line text-sm tabular-nums text-ink text-center focus:outline-none focus:border-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1.5">
                        OD Kanan CYL
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={prescription.odCyl ?? 0}
                        onChange={(e) => handlePrescriptionChange('odCyl', parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-3 rounded-full bg-white border border-line text-sm tabular-nums text-ink text-center focus:outline-none focus:border-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1.5">
                        OS Kiri SPH
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={prescription.osSph}
                        onChange={(e) => handlePrescriptionChange('osSph', parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-3 rounded-full bg-white border border-line text-sm tabular-nums text-ink text-center focus:outline-none focus:border-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1.5">
                        Jarak Pupil (PD)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={prescription.pd}
                        onChange={(e) => handlePrescriptionChange('pd', parseFloat(e.target.value) || 63)}
                        className="w-full h-10 px-3 rounded-full bg-white border border-line text-sm tabular-nums text-ink text-center focus:outline-none focus:border-ink"
                      />
                    </div>
                  </div>

                  {prescriptionErrors.length > 0 && (
                    <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-700 leading-relaxed space-y-1.5">
                      {prescriptionErrors.map((err, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price summary: stays in view while the options scroll */}
        <div className="sticky bottom-0 rounded-b-3xl border-t border-line bg-white/95 backdrop-blur px-6 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-end gap-6 sm:gap-8">
            <div className="space-y-0.5">
              <span className="text-sm text-muted">Total</span>
              <p className="text-3xl font-normal tracking-[-0.02em] text-ink tabular-nums whitespace-nowrap">
                {formatRupiah(pricing.total)}
              </p>
            </div>
            <dl className="hidden md:grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-sm pb-1">
              <dt className="text-muted">Frame</dt>
              <dd className="text-ink tabular-nums text-right">{formatRupiah(pricing.framePrice)}</dd>
              <dt className="text-muted">Lensa & lapisan</dt>
              <dd className="text-ink tabular-nums text-right">{formatRupiah(pricing.total - pricing.framePrice)}</dd>
            </dl>
          </div>

          <button
            onClick={handleAdd}
            className="h-12 px-7 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
};
