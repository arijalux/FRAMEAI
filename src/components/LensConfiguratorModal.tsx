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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white border border-line rounded-3xl overflow-hidden shadow-float my-8">
        {/* Header */}
        <div className="p-6 border-b border-line flex items-center justify-between bg-white/60">
          <div>
            <h2 className="text-xl md:text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink tracking-wide">
              Atur Lensa Kacamata
            </h2>
            <p className="text-xs text-muted">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-8">
          {/* Left Column: 3D Frame Inspection View */}
          <div className="lg:col-span-5 space-y-4">
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
              <span className="text-[11px] font-medium text-muted block mb-2">
                Warna Frame
              </span>
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
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Lens Purpose / Type */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-body block">
                1. Pilih Jenis Lensa
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'single_vision', name: 'Single Vision', price: addOnPrice(LENS_TYPE_PRICES.single_vision), desc: 'Jarak jauh atau baca' },
                  { id: 'progressive', name: 'Progresif', price: addOnPrice(LENS_TYPE_PRICES.progressive), desc: 'Multifokus tanpa garis' },
                  { id: 'reading', name: 'Baca', price: addOnPrice(LENS_TYPE_PRICES.reading), desc: 'Hanya pembesaran' },
                  { id: 'non_prescription', name: 'Plano / Fashion', price: formatRupiah(0), desc: 'Tanpa koreksi' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setLensType(t.id as LensType)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      lensType === t.id
                        ? 'bg-sage-tint border-ink text-ink shadow-md'
                        : 'bg-soft border-line text-muted hover:border-line-strong'
                    }`}
                  >
                    <div className="text-xs font-medium text-ink">{t.name}</div>
                    <div className="text-[11px] text-sage tabular-nums mt-0.5">{t.price}</div>
                    <div className="text-[10px] text-muted mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Lens Index (Thinness) */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-body block">
                2. Ketebalan & Indeks Lensa
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      lensIndex === idxOpt.id
                        ? 'bg-sage-tint border-ink text-ink shadow-md'
                        : 'bg-soft border-line text-muted hover:border-line-strong'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-ink">{idxOpt.name}</span>
                      <span className="text-xs text-sage tabular-nums font-medium">{idxOpt.price}</span>
                    </div>
                    <div className="text-[11px] text-muted mt-1">{idxOpt.rec}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Optical Coatings & Advanced Filters */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-body block">
                3. Lapisan & Filter Lensa
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setBlueLightFilter((b) => !b)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    blueLightFilter
                      ? 'bg-sage-tint border-ink text-ink'
                      : 'bg-soft border-line text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">Filter Blue Light</span>
                    <span className="text-xs text-sage tabular-nums">{addOnPrice(TREATMENT_PRICES.blueLightFilter)}</span>
                  </div>
                  <div className="text-[10px] text-muted mt-1">Menyaring cahaya biru HEV 420nm dari layar</div>
                </button>

                <button
                  onClick={() => setPhotochromic((p) => !p)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    photochromic
                      ? 'bg-sage-tint border-ink text-ink'
                      : 'bg-soft border-line text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">Photochromic</span>
                    <span className="text-xs text-sage tabular-nums">{addOnPrice(TREATMENT_PRICES.photochromic)}</span>
                  </div>
                  <div className="text-[10px] text-muted mt-1">Otomatis menggelap saat terkena sinar UV</div>
                </button>

                <button
                  onClick={() => setAntiReflective((a) => !a)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    antiReflective
                      ? 'bg-sage-tint border-ink text-ink'
                      : 'bg-soft border-line text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">Anti-Refleksi</span>
                    <span className="text-xs text-sage tabular-nums">{addOnPrice(TREATMENT_PRICES.antiReflective)}</span>
                  </div>
                  <div className="text-[10px] text-muted mt-1">Mengurangi silau lampu kendaraan & layar</div>
                </button>
              </div>
            </div>

            {/* 4. Prescription Input Toggle */}
            <div className="p-4 rounded-2xl bg-soft border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-ink block">Tambahkan Resep Kacamata</span>
                  <span className="text-[11px] text-muted">
                    Masukkan nilai Sphere (SPH), Cylinder (CYL), Axis, dan Jarak Pupil (PD).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hasPrescription}
                  onChange={(e) => setHasPrescription(e.target.checked)}
                  className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </div>

              {hasPrescription && (
                <div className="pt-3 border-t border-line space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] tabular-nums text-muted block mb-1">
                        OD Kanan SPH
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={prescription.odSph}
                        onChange={(e) => handlePrescriptionChange('odSph', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-xl bg-white border border-line-strong text-xs tabular-nums text-ink text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tabular-nums text-muted block mb-1">
                        OD Kanan CYL
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={prescription.odCyl ?? 0}
                        onChange={(e) => handlePrescriptionChange('odCyl', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-xl bg-white border border-line-strong text-xs tabular-nums text-ink text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tabular-nums text-muted block mb-1">
                        OS Kiri SPH
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={prescription.osSph}
                        onChange={(e) => handlePrescriptionChange('osSph', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-xl bg-white border border-line-strong text-xs tabular-nums text-ink text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tabular-nums text-muted block mb-1">
                        Jarak Pupil (PD)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={prescription.pd}
                        onChange={(e) => handlePrescriptionChange('pd', parseFloat(e.target.value) || 63)}
                        className="w-full px-2 py-1.5 rounded-xl bg-white border border-line-strong text-xs tabular-nums text-ink text-center"
                      />
                    </div>
                  </div>

                  {prescriptionErrors.length > 0 && (
                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-700 space-y-1">
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

            {/* Subtotal & Add to Bag Footer */}
            <div className="p-4 rounded-2xl bg-soft border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-medium text-muted">
                  Total (Frame + Lensa)
                </span>
                <div className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-sage mt-0.5">
                  {formatRupiah(pricing.total)}{' '}
                  <span className="text-xs tabular-nums font-normal text-muted">
                    ({formatRupiah(pricing.framePrice)} frame + {formatRupiah(pricing.total - pricing.framePrice)} lensa)
                  </span>
                </div>
              </div>

              <button
                onClick={handleAdd}
                className="py-3 px-8 rounded-full bg-ink hover:bg-ink-soft text-white font-medium text-sm shadow-card flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
