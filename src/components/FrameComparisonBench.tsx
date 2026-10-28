import React from 'react';
import { OpticalFrame, FaceShape } from '../types';
import { X, Plus, Camera, ShoppingBag, Check, Sparkles, SlidersHorizontal } from 'lucide-react';
import { calculateFaceFrameMatchScore } from '../utils/opticalMath';

interface FrameComparisonBenchProps {
  allFrames: OpticalFrame[];
  comparedFrames: OpticalFrame[];
  onAddFrame: (frame: OpticalFrame) => void;
  onRemoveFrame: (frameId: string) => void;
  onSelectFrameForTryOn: (frame: OpticalFrame) => void;
  onConfigureLenses: (frame: OpticalFrame) => void;
  userFaceShape?: FaceShape;
}

export const FrameComparisonBench: React.FC<FrameComparisonBenchProps> = ({
  allFrames,
  comparedFrames,
  onAddFrame,
  onRemoveFrame,
  onSelectFrameForTryOn,
  onConfigureLenses,
  userFaceShape = 'Oval',
}) => {
  const maxSlots = 4;
  const availableFramesToAdd = allFrames.filter((f) => !comparedFrames.some((c) => c.id === f.id));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            Optical Geometry Bench
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">Side-by-Side Comparison</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Compare millimeter dimensions, material grade, and facial contour synergy across up to 4 frames.
          </p>
        </div>

        {/* Quick add dropdown if slots available */}
        {comparedFrames.length < maxSlots && availableFramesToAdd.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Add to bench:</span>
            <select
              aria-label="Add frame to comparison bench"
              onChange={(e) => {
                const found = allFrames.find((f) => f.id === e.target.value);
                if (found) onAddFrame(found);
                e.target.value = '';
              }}
              defaultValue=""
              className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            >
              <option value="" disabled>
                Select frame to add...
              </option>
              {availableFramesToAdd.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.shape} · ${f.price})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {comparedFrames.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-neutral-900/50 border border-neutral-800/80">
          <p className="text-sm text-neutral-400 mb-4">No frames currently on the bench.</p>
          <button
            onClick={() => {
              allFrames.slice(0, 3).forEach((f) => onAddFrame(f));
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs shadow-lg hover:bg-amber-400 transition-colors"
          >
            Load Top 3 Recommended Frames
          </button>
        </div>
      ) : (
        /* Comparison Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparedFrames.map((frame) => {
            const match = calculateFaceFrameMatchScore(userFaceShape, frame.shape);

            return (
              <div
                key={frame.id}
                className="relative rounded-3xl bg-neutral-900 border border-neutral-800 p-5 flex flex-col justify-between shadow-xl"
              >
                {/* Remove Button */}
                <button
                  onClick={() => onRemoveFrame(frame.id)}
                  aria-label={`Remove ${frame.name} from comparison`}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Frame Image & Identity */}
                <div>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-950 mb-4">
                    <img src={frame.imageUrl} alt={frame.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {match.score}% {userFaceShape} Match
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-white">{frame.name}</h3>
                  <div className="text-xs text-neutral-400 mb-4">${frame.price} · {frame.shape}</div>

                  {/* Comparison Specs Table */}
                  <div className="space-y-2.5 text-xs border-t border-neutral-800/80 pt-3">
                    <div className="flex justify-between py-1 border-b border-neutral-800/40">
                      <span className="text-neutral-400">Material Grade:</span>
                      <span className="text-neutral-200 font-medium text-right max-w-[130px] truncate">
                        {frame.material}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-800/40">
                      <span className="text-neutral-400">Weight:</span>
                      <span className="text-white font-mono font-bold">
                        {frame.weightGrams} grams
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-800/40">
                      <span className="text-neutral-400">Lens Width:</span>
                      <span className="text-white font-mono font-bold">{frame.dimensions.lensWidth} mm</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-800/40">
                      <span className="text-neutral-400">Bridge Distance:</span>
                      <span className="text-white font-mono font-bold">{frame.dimensions.bridgeWidth} mm</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-800/40">
                      <span className="text-neutral-400">Total Frame Width:</span>
                      <span className="text-white font-mono font-bold">{frame.dimensions.totalWidth} mm</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-800/40">
                      <span className="text-neutral-400">Lens Height:</span>
                      <span className="text-white font-mono font-bold">{frame.dimensions.lensHeight} mm</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-neutral-400">Polarized Option:</span>
                      <span className="text-neutral-200">{frame.isPolarized ? 'Included' : 'Customizable'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 space-y-2">
                  <button
                    onClick={() => onSelectFrameForTryOn(frame)}
                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    AR Try-On
                  </button>

                  <button
                    onClick={() => onConfigureLenses(frame)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Configure Lenses
                  </button>
                </div>
              </div>
            );
          })}

          {/* Empty Slot Placeholder */}
          {comparedFrames.length < maxSlots && (
            <div className="rounded-3xl border-2 border-dashed border-neutral-800/80 p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[420px]">
              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-xs text-neutral-400 max-w-[160px]">
                Add another frame to compare technical dimensions
              </p>
              {availableFramesToAdd.length > 0 && (
                <button
                  onClick={() => onAddFrame(availableFramesToAdd[0])}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-medium transition-colors"
                >
                  Add {availableFramesToAdd[0].name}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
