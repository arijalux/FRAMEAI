import React from 'react';
import { useApp } from '../context/AppContext';
import { FrameViewer } from '../components/ui/FrameViewer';
import {
  Layers,
  X,
  Eye,
  ShoppingBag,
  Plus,
  ArrowLeft,
  Sparkles,
  Check,
  Ruler,
} from 'lucide-react';

export const Compare: React.FC = () => {
  const { compareList, products, getProductById, removeFromCompare, clearCompare, addToCart, navigate } = useApp();

  const comparedProducts = compareList
    .map((id) => getProductById(id))
    .filter(Boolean) as typeof products;

  const handleRemove = (productId: string) => {
    removeFromCompare(productId);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-black/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-orange-700 mb-2">
            <Layers size={14} />
            <span>Side-by-Side Optical Bench</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif italic text-black">
            Compare Frame Specifications
          </h1>
          <p className="text-sm text-black/60 max-w-lg mt-1">
            Examine millimeter dimensions, weights, and face shape suitability side-by-side.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {comparedProducts.length > 0 && (
            <button
              onClick={() => clearCompare()}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              title="Clear all compared frames"
            >
              Clear Matrix
            </button>
          )}
          <button
            onClick={() => navigate('/explore')}
            className="text-xs font-bold uppercase tracking-widest text-black/70 hover:text-black flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-black/10 hover:border-black transition-all"
          >
            <ArrowLeft size={13} />
            <span>Explore Frames</span>
          </button>
        </div>
      </div>

      {/* Comparison Grid or Empty State */}
      {comparedProducts.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-black/5 p-12 text-center space-y-5 shadow-xs max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-[#F5F2ED] rounded-full flex items-center justify-center mx-auto text-black/40">
            <Layers size={28} />
          </div>
          <h3 className="text-2xl font-serif italic text-black">Comparison Bench is Empty</h3>
          <p className="text-xs text-black/60 max-w-md mx-auto leading-relaxed">
            All frames have been removed from the comparison bench. Browse the BJ Homemade catalog and select up to 4 models to compare millimeter dimensions, weights, and face shape compatibility.
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="px-8 py-3.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Add Frames to Compare</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="min-w-[800px] bg-white rounded-[40px] border border-black/5 p-8 shadow-sm space-y-8">
            {/* Header Row: Visuals, Names, and Quick Actions */}
            <div
              className="grid gap-6 items-start"
              style={{
                gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(0, 1fr))`,
              }}
            >
              {/* First Col: Metric Label Header */}
              <div className="p-4 flex flex-col justify-end h-full">
                <span className="text-xs uppercase tracking-widest font-bold text-black/40">
                  Specification Breakdown
                </span>
                <p className="text-sm text-black/60 mt-1 font-serif italic">
                  {comparedProducts.length} Frames on bench
                </p>
              </div>

              {comparedProducts.map((p) => (
                <div
                  key={p.id}
                  className="relative bg-[#F5F2ED] rounded-3xl p-5 border border-black/5 flex flex-col justify-between h-full group transition-all"
                  id={`compare-card-${p.id}`}
                >
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all text-black/70 shadow-xs cursor-pointer z-10"
                    title="Hapus frame dari perbandingan"
                    type="button"
                    id={`compare-remove-${p.id}`}
                  >
                    <X size={15} />
                  </button>

                  <div className="w-full h-36 flex items-center justify-center">
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="max-h-28 object-contain"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = 'true';
                          target.src = '/images/products/product-01-teak-rect-main.svg';
                        }
                      }}
                    />
                  </div>

                  <div className="text-center pt-2 space-y-1">
                    <h3
                      onClick={() => navigate(`/product/${p.id}`)}
                      className="font-serif italic text-lg text-black hover:text-orange-700 transition-colors cursor-pointer"
                    >
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-black/50 font-medium">{p.frameShape} • {p.category}</p>
                    <p className="text-base font-bold text-black pt-1">
                      Rp {p.price.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="pt-4 flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/try-on/${p.id}`)}
                      className="w-full py-2.5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>Try In AR</span>
                    </button>
                    <button
                      onClick={() => addToCart(p)}
                      className="w-full py-2 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-wider border border-black/15 hover:bg-black hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShoppingBag size={12} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Specs Rows */}
            <div className="space-y-4 pt-6 border-t border-black/10 text-xs">
              {/* Silhouette */}
              <div
                className="grid gap-6 py-3 border-b border-black/5 items-center"
                style={{
                  gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(0, 1fr))`,
                }}
              >
                <span className="font-bold uppercase tracking-wider text-black/40">Frame Shape</span>
                {comparedProducts.map((p) => (
                  <span key={p.id} className="font-semibold text-black">{p.frameShape}</span>
                ))}
              </div>

              {/* Material */}
              <div
                className="grid gap-6 py-3 border-b border-black/5 items-center"
                style={{
                  gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(0, 1fr))`,
                }}
              >
                <span className="font-bold uppercase tracking-wider text-black/40">Craft Material</span>
                {comparedProducts.map((p) => (
                  <span key={p.id} className="text-black/80">{p.material}</span>
                ))}
              </div>

              {/* Weight */}
              <div
                className="grid gap-6 py-3 border-b border-black/5 items-center"
                style={{
                  gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(0, 1fr))`,
                }}
              >
                <span className="font-bold uppercase tracking-wider text-black/40">Weight</span>
                {comparedProducts.map((p) => (
                  <span key={p.id} className="font-semibold text-black">{p.weightGrams} grams</span>
                ))}
              </div>

              {/* Lens Width */}
              <div
                className="grid gap-6 py-3 border-b border-black/5 items-center"
                style={{
                  gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(0, 1fr))`,
                }}
              >
                <span className="font-bold uppercase tracking-wider text-black/40">Lens Width</span>
                {comparedProducts.map((p) => (
                  <span key={p.id} className="text-black">{p.dimensions.lensWidth} mm</span>
                ))}
              </div>

              {/* Bridge Width */}
              <div
                className="grid gap-6 py-3 border-b border-black/5 items-center"
                style={{
                  gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(0, 1fr))`,
                }}
              >
                <span className="font-bold uppercase tracking-wider text-black/40">Bridge Width</span>
                {comparedProducts.map((p) => (
                  <span key={p.id} className="text-black">{p.dimensions.bridgeWidth} mm</span>
                ))}
              </div>

              {/* Temple Length */}
              <div
                className="grid gap-6 py-3 border-b border-black/5 items-center"
                style={{
                  gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(0, 1fr))`,
                }}
              >
                <span className="font-bold uppercase tracking-wider text-black/40">Temple Length</span>
                {comparedProducts.map((p) => (
                  <span key={p.id} className="text-black">{p.dimensions.templeLength} mm</span>
                ))}
              </div>

              {/* Total Frame Width */}
              <div
                className="grid gap-6 py-3 border-b border-black/5 items-center"
                style={{
                  gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(0, 1fr))`,
                }}
              >
                <span className="font-bold uppercase tracking-wider text-black/40">Total Width</span>
                {comparedProducts.map((p) => (
                  <span key={p.id} className="font-semibold text-black">{p.dimensions.frameWidth} mm</span>
                ))}
              </div>

              {/* Best For Face Shapes */}
              <div
                className="grid gap-6 py-3 items-center"
                style={{
                  gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(0, 1fr))`,
                }}
              >
                <span className="font-bold uppercase tracking-wider text-black/40">Best Face Shapes</span>
                {comparedProducts.map((p) => (
                  <div key={p.id} className="flex flex-wrap gap-1">
                    {p.bestForFaceShapes.map((shape) => (
                      <span
                        key={shape}
                        className="px-2.5 py-0.5 bg-[#F5F2ED] rounded-full text-[10px] font-bold text-black"
                      >
                        {shape}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
