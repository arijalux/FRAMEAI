import React from 'react';
import { OpticalFrame, FaceShape } from '../types';
import { X, Plus, Camera, ShoppingBag, Check, Sparkles, SlidersHorizontal } from 'lucide-react';
import { formatRupiah, faceShapeLabel, frameShapeLabel, materialLabel } from '../utils/format';
import { calculateFaceFrameMatchScore } from '../utils/opticalMath';

interface FrameComparisonBenchProps {
  allFrames: OpticalFrame[];
  comparedFrames: OpticalFrame[];
  onAddFrame: (frame: OpticalFrame) => void;
  onRemoveFrame: (frameId: string) => void;
  onSelectFrameForTryOn: (frame: OpticalFrame) => void;
  onConfigureLenses: (frame: OpticalFrame) => void;
  onBrowseCatalog: () => void;
  userFaceShape?: FaceShape;
}

export const FrameComparisonBench: React.FC<FrameComparisonBenchProps> = ({
  allFrames,
  comparedFrames,
  onAddFrame,
  onRemoveFrame,
  onSelectFrameForTryOn,
  onConfigureLenses,
  onBrowseCatalog,
  userFaceShape,
}) => {
  const maxSlots = 4;
  const availableFramesToAdd = allFrames.filter((f) => !comparedFrames.some((c) => c.id === f.id));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-line">
        <div>
          <div className="flex items-center gap-2 text-sage text-xs font-medium mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            Perbandingan Frame
          </div>
          <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">Bandingkan Berdampingan</h2>
          <p className="text-xs text-muted mt-1">
            Bandingkan dimensi, material, dan kecocokan dengan bentuk wajah untuk maksimal 4 frame.
          </p>
        </div>

        {/* Quick add dropdown if slots available */}
        {comparedFrames.length < maxSlots && availableFramesToAdd.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Tambahkan:</span>
            <select
              aria-label="Tambahkan frame ke perbandingan"
              onChange={(e) => {
                const found = allFrames.find((f) => f.id === e.target.value);
                if (found) onAddFrame(found);
                e.target.value = '';
              }}
              defaultValue=""
              className="px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink focus:outline-none focus:border-ink"
            >
              <option value="" disabled>
                Pilih frame...
              </option>
              {availableFramesToAdd.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({frameShapeLabel(f.shape)} · {formatRupiah(f.price)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {comparedFrames.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/50 border border-line">
          <p className="text-sm text-muted mb-4">
            Belum ada frame untuk dibandingkan. Tekan + pada kartu frame di Koleksi.
          </p>
          <button
            onClick={onBrowseCatalog}
            className="h-11 px-5 rounded-full bg-ink text-white font-medium text-sm hover:bg-ink-soft transition-colors"
          >
            Pilih frame di Koleksi
          </button>
        </div>
      ) : (
        /* Comparison Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparedFrames.map((frame) => {
            const match = userFaceShape ? calculateFaceFrameMatchScore(userFaceShape, frame.shape) : null;

            return (
              <div
                key={frame.id}
                className="relative rounded-3xl bg-white border border-line p-5 flex flex-col justify-between shadow-card"
              >
                {/* Remove Button */}
                <button
                  onClick={() => onRemoveFrame(frame.id)}
                  aria-label={`Hapus ${frame.name} dari perbandingan`}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 hover:bg-soft-strong text-muted hover:text-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Frame Image & Identity */}
                <div>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-soft mb-4">
                    <img src={frame.imageUrl} alt={frame.name} className="w-full h-full object-cover" />
                    {match && userFaceShape && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs bg-white/90 text-ink">
                        Cocok {match.score}% · {faceShapeLabel(userFaceShape)}
                      </div>
                    )}
                  </div>

                  <h3 className="font-normal tracking-[-0.03em] text-lg text-ink">{frame.name}</h3>
                  <div className="text-xs text-muted mb-4">{formatRupiah(frame.price)} · {frameShapeLabel(frame.shape)}</div>

                  {/* Comparison Specs Table */}
                  <div className="space-y-2.5 text-xs border-t border-line pt-3">
                    <div className="flex justify-between py-1 border-b border-line">
                      <span className="text-muted">Material:</span>
                      <span className="text-ink font-medium text-right max-w-[130px] truncate">
                        {materialLabel(frame.material)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-line">
                      <span className="text-muted">Berat:</span>
                      <span className="text-ink tabular-nums font-medium">
                        {frame.weightGrams} gram
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-line">
                      <span className="text-muted">Lebar Lensa:</span>
                      <span className="text-ink tabular-nums font-medium">{frame.dimensions.lensWidth} mm</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-line">
                      <span className="text-muted">Lebar Bridge:</span>
                      <span className="text-ink tabular-nums font-medium">{frame.dimensions.bridgeWidth} mm</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-line">
                      <span className="text-muted">Lebar Total:</span>
                      <span className="text-ink tabular-nums font-medium">{frame.dimensions.totalWidth} mm</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-line">
                      <span className="text-muted">Tinggi Lensa:</span>
                      <span className="text-ink tabular-nums font-medium">{frame.dimensions.lensHeight} mm</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-muted">Opsi Polarized:</span>
                      <span className="text-ink">{frame.isPolarized ? 'Termasuk' : 'Bisa Ditambahkan'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 space-y-2">
                  <button
                    onClick={() => onSelectFrameForTryOn(frame)}
                    className="w-full py-2.5 px-3 rounded-full bg-soft-strong hover:bg-line-strong text-ink font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-sage" />
                    Coba AR
                  </button>

                  <button
                    onClick={() => onConfigureLenses(frame)}
                    className="w-full py-2.5 px-3 rounded-full bg-ink hover:bg-ink-soft text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Atur Lensa
                  </button>
                </div>
              </div>
            );
          })}

          {/* Empty Slot Placeholder */}
          {comparedFrames.length < maxSlots && (
            <div className="rounded-3xl border-2 border-dashed border-line p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[420px]">
              <div className="w-12 h-12 rounded-full bg-white border border-line flex items-center justify-center text-muted">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-xs text-muted max-w-[160px]">
                Tambah frame lain untuk dibandingkan
              </p>
              {availableFramesToAdd.length > 0 && (
                <button
                  onClick={() => onAddFrame(availableFramesToAdd[0])}
                  className="px-4 py-2 rounded-full bg-soft-strong hover:bg-line-strong text-xs text-ink font-medium transition-colors"
                >
                  Tambah {availableFramesToAdd[0].name}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
