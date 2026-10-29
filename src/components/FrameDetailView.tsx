import React, { useEffect, useState } from 'react';
import { FaceShape, FrameColorOption, OpticalFrame } from '../types';
import type { LensTint } from './ThreeFrameCanvas';
import { LazyThreeFrameCanvas } from './LazyThreeFrameCanvas';
import { calculateFaceFrameMatchScore, computeDecentration } from '../utils/opticalMath';
import { faceShapeLabel, formatRupiah, frameShapeLabel, materialLabel } from '../utils/format';
import {
  ArrowLeft,
  Camera,
  Check,
  Eye,
  Layers,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';

interface FrameDetailViewProps {
  frame: OpticalFrame;
  allFrames: OpticalFrame[];
  initialColor?: FrameColorOption;
  userFaceShape: FaceShape | null;
  userPd?: number;
  isCompared: boolean;
  backLabel: string;
  onBack: () => void;
  onSelectFaceShape: (shape: FaceShape | null) => void;
  onOpenFinder: () => void;
  onDirectCheckout: (frame: OpticalFrame, color: FrameColorOption) => void;
  onQuickAddToCart: (frame: OpticalFrame, color: FrameColorOption) => void;
  onConfigureLenses: (frame: OpticalFrame, color: FrameColorOption) => void;
  onTryOnAr: (frame: OpticalFrame) => void;
  onToggleCompare: (frame: OpticalFrame) => void;
  onSelectRelatedFrame: (frame: OpticalFrame) => void;
}

const FACE_SHAPES: FaceShape[] = ['Oval', 'Square', 'Round', 'Heart', 'Diamond'];

export const FrameDetailView: React.FC<FrameDetailViewProps> = ({
  frame,
  allFrames,
  initialColor,
  userFaceShape,
  userPd,
  isCompared,
  backLabel,
  onBack,
  onSelectFaceShape,
  onOpenFinder,
  onDirectCheckout,
  onQuickAddToCart,
  onConfigureLenses,
  onTryOnAr,
  onToggleCompare,
  onSelectRelatedFrame,
}) => {
  const [selectedColor, setSelectedColor] = useState<FrameColorOption>(
    initialColor ?? frame.colors[0]
  );
  const [mediaMode, setMediaMode] = useState<'photo' | '3d'>('photo');
  const [lensTint, setLensTint] = useState<LensTint>(
    frame.isPolarized ? 'dark_sun' : 'clear'
  );
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    setSelectedColor(initialColor ?? frame.colors[0]);
    setMediaMode('photo');
    setLensTint(frame.isPolarized ? 'dark_sun' : 'clear');
    setImgError(false);
  }, [frame, initialColor]);

  const match = userFaceShape
    ? calculateFaceFrameMatchScore(userFaceShape, frame.shape, {
        userPd,
        frameWidth: frame.dimensions.totalWidth,
      })
    : null;

  const referencePd = userPd ?? 63;
  const decentration = computeDecentration(
    referencePd,
    frame.dimensions.lensWidth,
    frame.dimensions.bridgeWidth
  );

  const fitAssessmentLabel =
    decentration.fitAssessment === 'Ideal Optical Alignment'
      ? 'Proporsi Optik Ideal'
      : decentration.fitAssessment === 'Wide Fit'
      ? 'Proporsi Lebar (Wide Fit)'
      : 'Proporsi Ramping (Narrow Fit)';

  const relatedFrames = allFrames
    .filter((f) => f.id !== frame.id)
    .sort((a, b) => {
      const scoreA =
        (a.shape === frame.shape ? 2 : 0) + (a.material === frame.material ? 1 : 0);
      const scoreB =
        (b.shape === frame.shape ? 2 : 0) + (b.material === frame.material ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Top Navigation & Breadcrumb */}
      <nav
        aria-label="Navigasi detail produk"
        className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4"
      >
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-body hover:text-ink transition-colors whitespace-nowrap cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-muted truncate max-w-full">
          <span>Koleksi</span>
          <span aria-hidden="true">/</span>
          <span>{frameShapeLabel(frame.shape)}</span>
          <span aria-hidden="true">/</span>
          <span className="text-ink truncate">{frame.name}</span>
        </div>
      </nav>

      {/* Main 2-Column Contiguous PDP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Media Showcase & Millimeter Blueprint */}
        <div className="lg:col-span-7 space-y-8">
          {/* Segmented Media Switcher + Quick Tools */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Mode tampilan produk"
              className="inline-flex items-center gap-1 p-1 rounded-full bg-soft"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mediaMode === 'photo'}
                onClick={() => setMediaMode('photo')}
                className={`h-9 px-4 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  mediaMode === 'photo'
                    ? 'bg-white text-ink shadow-card'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Foto Studio
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mediaMode === '3d'}
                onClick={() => setMediaMode('3d')}
                className={`h-9 px-4 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                  mediaMode === '3d'
                    ? 'bg-white text-ink shadow-card'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Putar 3D 360°</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTryOnAr(frame)}
                className="h-9 px-4 rounded-full border border-line hover:border-ink text-xs font-medium text-ink whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-sage" />
                <span>Coba Kamera AR</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleCompare(frame)}
                className={`h-9 px-4 rounded-full border text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isCompared
                    ? 'border-ink bg-ink text-white'
                    : 'border-line hover:border-ink text-ink'
                }`}
              >
                {isCompared ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isCompared ? 'Dibandingkan' : 'Bandingkan'}</span>
              </button>
            </div>
          </div>

          {/* Media Canvas */}
          {mediaMode === 'photo' ? (
            <div className="rounded-3xl bg-sand p-6 sm:p-8 space-y-4">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-card flex items-center justify-center">
                {!imgError ? (
                  <img
                    src={frame.imageUrl}
                    alt={`${frame.name} — ${materialLabel(frame.material)}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-muted">
                    <Eye className="w-8 h-8 text-ink" />
                    <span className="text-sm font-medium text-ink">{frame.name}</span>
                    <span className="text-xs">{materialLabel(frame.material)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-body pt-1">
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="w-3.5 h-3.5 rounded-full ring-1 ring-black/15 shrink-0"
                  >
                    <circle cx="8" cy="8" r="8" fill={selectedColor.hex} />
                  </svg>
                  <span>Warna dipilih: {selectedColor.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaMode('3d')}
                  className="text-ink underline underline-offset-4 hover:text-sage transition-colors whitespace-nowrap cursor-pointer"
                >
                  Lihat warna ini dalam 3D interaktif
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <LazyThreeFrameCanvas
                frame={frame}
                selectedColor={selectedColor}
                lensTint={lensTint}
                onLensTintChange={setLensTint}
              />
              <p className="text-xs text-muted">
                Geser untuk memutar frame 360°, periksa engsel, dan uji simulasi warna lensa pada varian{' '}
                <span className="text-ink">{selectedColor.name}</span>.
              </p>
            </div>
          )}

          {/* Optical Millimeter Specifications */}
          <section className="pt-4 border-t border-line space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium tracking-[-0.02em] text-ink">
                Dimensi & Spesifikasi Optik
              </h2>
              <span className="text-xs text-muted tabular-nums">
                Kode ukuran: {frame.dimensions.lensWidth}–{frame.dimensions.bridgeWidth}–
                {frame.dimensions.templeLength}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5 py-4 border-y border-line tabular-nums">
              <div>
                <div className="text-xs text-muted">Lebar Lensa</div>
                <div className="text-base text-ink mt-0.5">{frame.dimensions.lensWidth} mm</div>
              </div>
              <div>
                <div className="text-xs text-muted">Lebar Bridge</div>
                <div className="text-base text-ink mt-0.5">{frame.dimensions.bridgeWidth} mm</div>
              </div>
              <div>
                <div className="text-xs text-muted">Panjang Gagang</div>
                <div className="text-base text-ink mt-0.5">{frame.dimensions.templeLength} mm</div>
              </div>
              <div>
                <div className="text-xs text-muted">Tinggi Lensa</div>
                <div className="text-base text-ink mt-0.5">{frame.dimensions.lensHeight} mm</div>
              </div>
              <div>
                <div className="text-xs text-muted">Lebar Total Frame</div>
                <div className="text-base text-ink mt-0.5">{frame.dimensions.totalWidth} mm</div>
              </div>
              <div>
                <div className="text-xs text-muted">Berat Tanpa Lensa</div>
                <div className="text-base text-ink mt-0.5">{frame.weightGrams} gram</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted tabular-nums">
              <span>
                {fitAssessmentLabel} · Jarak pusat optik frame {decentration.framePD} mm
              </span>
              <span>
                {userPd
                  ? `Dihitung dari PD hasil scan Anda (${userPd} mm)`
                  : `Dihitung pada referensi PD rata-rata (${referencePd} mm)`}
              </span>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Contiguous Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          {/* Quiet Metadata, Title, Rating & Price */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <span>{frame.brand}</span>
              <span aria-hidden="true">·</span>
              <span>{materialLabel(frame.material)}</span>
              <span aria-hidden="true">·</span>
              <span>{frameShapeLabel(frame.shape)}</span>
              {frame.isPolarized && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-sage">Sun Polarized</span>
                </>
              )}
              {frame.isNew && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-ink">Rilis Baru</span>
                </>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink text-balance">
              {frame.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted tabular-nums">
              <span className="inline-flex items-center gap-1 text-ink">
                <Star className="w-3.5 h-3.5 fill-current" />
                {frame.rating.toFixed(1)}
              </span>
              <span>({frame.reviewsCount} ulasan terverifikasi)</span>
              <span aria-hidden="true">·</span>
              <span className={frame.stock > 0 ? 'text-body' : 'text-muted'}>
                {frame.stock > 0 ? `Tersedia (${frame.stock} unit)` : 'Stok habis'}
              </span>
            </div>

            <div className="pt-1">
              <div className="text-2xl md:text-3xl font-normal tracking-[-0.03em] text-ink tabular-nums">
                {formatRupiah(frame.price)}
              </div>
              <p className="text-xs text-muted mt-1">
                Harga termasuk frame & lensa standar tanpa resep · PPN 11% dihitung saat checkout.
              </p>
            </div>
          </div>

          <p className="text-sm md:text-base text-body leading-relaxed border-t border-line pt-5">
            {frame.description}
          </p>

          {/* Interactive Color Variant Selector */}
          <div className="space-y-3 border-t border-line pt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Pilihan Warna</span>
              <span className="text-ink font-medium">{selectedColor.name}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {frame.colors.map((color) => {
                const active = selectedColor.name === color.name;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Pilih warna ${color.name}`}
                    aria-pressed={active}
                    title={color.name}
                    className={`h-10 pl-2.5 pr-3.5 rounded-full border text-xs flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'border-ink bg-soft text-ink font-medium'
                        : 'border-line hover:border-line-strong text-body hover:text-ink'
                    }`}
                  >
                    <svg
                      viewBox="0 0 18 18"
                      aria-hidden="true"
                      className="w-4 h-4 rounded-full ring-1 ring-black/15 shrink-0"
                    >
                      <circle cx="9" cy="9" r="9" fill={color.hex} />
                    </svg>
                    <span>{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Face Shape Compatibility Check */}
          <div className="space-y-3 border-t border-line pt-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">Kecocokan Bentuk Wajah</span>
              <button
                type="button"
                onClick={onOpenFinder}
                className="inline-flex items-center gap-1 text-xs text-sage hover:text-ink transition-colors whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Scan wajah AI</span>
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-full bg-soft overflow-x-auto no-scrollbar">
              {FACE_SHAPES.map((shape) => {
                const active = userFaceShape === shape;
                return (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => onSelectFaceShape(active ? null : shape)}
                    aria-pressed={active}
                    className={`flex-1 min-w-fit h-8 px-3 rounded-full text-xs whitespace-nowrap transition-colors cursor-pointer ${
                      active ? 'bg-white text-ink font-medium shadow-card' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {faceShapeLabel(shape)}
                  </button>
                );
              })}
            </div>

            {match && userFaceShape ? (
              <div className="p-4 rounded-2xl bg-sage-tint/70 space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-ink tabular-nums">
                  <span>
                    Wajah {faceShapeLabel(userFaceShape)}: {match.verdict}
                  </span>
                  <span>Cocok {match.score}%</span>
                </div>
                <p className="text-xs text-body leading-relaxed">{match.guidance}</p>
              </div>
            ) : (
              <p className="text-xs text-muted leading-relaxed">
                Direkomendasikan untuk wajah{' '}
                <span className="text-ink">
                  {frame.fitFaceShapes.map((s) => faceShapeLabel(s)).join(' · ')}
                </span>
                . Pilih bentuk wajah di atas untuk melihat skor kecocokan personal.
              </p>
            )}
          </div>

          {/* Contiguous Purchase Actions */}
          <div className="space-y-2.5 border-t border-line pt-5">
            <button
              type="button"
              disabled={frame.stock <= 0}
              onClick={() => onDirectCheckout(frame, selectedColor)}
              className="w-full h-12 px-6 rounded-full bg-ink hover:bg-ink-soft disabled:opacity-50 text-white text-sm font-medium shadow-float flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Checkout Sekarang · {formatRupiah(frame.price)}</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={frame.stock <= 0}
                onClick={() => onConfigureLenses(frame, selectedColor)}
                className="h-11 px-4 rounded-full border border-ink hover:bg-soft disabled:opacity-50 text-ink text-xs font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Atur Lensa Resep</span>
              </button>

              <button
                type="button"
                disabled={frame.stock <= 0}
                onClick={() => onQuickAddToCart(frame, selectedColor)}
                className="h-11 px-4 rounded-full border border-line hover:border-ink disabled:opacity-50 text-ink text-xs font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah ke Keranjang</span>
              </button>
            </div>
          </div>

          {/* Service & Craftsmanship Notes */}
          <ul className="space-y-2 border-t border-line pt-5 text-xs text-muted">
            <li>Gratis pengiriman berasuransi ke seluruh Indonesia</li>
            <li>Garansi kecocokan & penyetelan engsel 30 hari</li>
            <li>Termasuk hardcase pelindung & kain mikrofiber optik</li>
          </ul>
        </div>
      </div>

      {/* Related Frames Section */}
      {relatedFrames.length > 0 && (
        <section className="space-y-6 border-t border-line pt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-normal tracking-[-0.03em] text-ink">
                Frame Serupa dari Koleksi
              </h2>
              <p className="text-sm text-muted mt-1">
                Pilihan siluet atau material senada yang bisa langsung dibandingkan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedFrames.map((rel, idx) => {
              const tint = ['bg-mist', 'bg-sage-tint', 'bg-stone'][idx % 3];
              const relMatch = userFaceShape
                ? calculateFaceFrameMatchScore(userFaceShape, rel.shape)
                : null;

              return (
                <article
                  key={rel.id}
                  onClick={() => onSelectRelatedFrame(rel)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectRelatedFrame(rel);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Lihat detail ${rel.name}`}
                  className="group rounded-3xl border border-line bg-white overflow-hidden flex flex-col transition-shadow hover:shadow-float cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <div className={`relative ${tint} p-5 pb-0`}>
                    <div className="aspect-[4/3] rounded-t-2xl overflow-hidden bg-white shadow-card">
                      <img
                        src={rel.imageUrl}
                        alt={rel.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <span>{materialLabel(rel.material)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{frameShapeLabel(rel.shape)}</span>
                        {relMatch && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-sage tabular-nums">Cocok {relMatch.score}%</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-normal tracking-[-0.03em] text-ink group-hover:underline underline-offset-4">
                        {rel.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-line text-sm tabular-nums text-ink">
                      <span>{formatRupiah(rel.price)}</span>
                      <span className="text-xs text-muted group-hover:text-ink transition-colors">
                        Lihat detail →
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
