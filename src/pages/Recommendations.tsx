import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ui/ProductCard';
import { Sparkles, RotateCcw, ArrowRight, Eye, ShoppingBag, CheckCircle2, Sliders } from 'lucide-react';

export const Recommendations: React.FC = () => {
  const { faceAnalysis, recommendations, products, navigate, addToCart } = useApp();

  const topRecommendations = recommendations.slice(0, 3);
  const otherMatches = recommendations.slice(3, 7);

  // If no analysis yet, provide a friendly CTA or fallback
  if (!faceAnalysis && recommendations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 sm:px-12 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-orange-700 shadow-md">
          <Sparkles size={36} />
        </div>
        <h1 className="text-4xl font-serif italic text-black">No Active Frame Profile Found</h1>
        <p className="text-sm text-black/60 max-w-md mx-auto leading-relaxed">
          Complete our short 4-step AI styling assessment to calculate your face proportions and unlock personalized frame recommendations.
        </p>
        <button
          onClick={() => navigate('/find-my-frame')}
          className="px-10 py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md inline-flex items-center gap-2"
        >
          <Sparkles size={14} />
          <span>Launch Find My Frame</span>
        </button>
      </div>
    );
  }

  const profile = faceAnalysis || {
    faceShape: 'Oval' as const,
    stylePreference: 'Minimal' as const,
    usage: 'Work' as const,
    budgetMax: 1800000,
    aiExplanation: 'Your facial proportions balance structured silhouettes with minimal warmth.',
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 space-y-14">
      {/* Top Profile Banner - "Your Frame Profile" */}
      <div className="bg-[#1A1A1A] text-white rounded-[40px] p-8 sm:p-12 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/15">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-3">
              <Sparkles size={12} />
              <span>AI Styling Profile</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-light tracking-tight">
              Your Frame <span className="italic text-orange-400">Profile</span>
            </h1>
            <p className="text-sm text-white/70 max-w-lg mt-2 leading-relaxed">
              Curated specifically for your facial geometry and styling preferences from the BJ Homemade handcrafted collection.
            </p>
          </div>

          <button
            onClick={() => navigate('/find-my-frame')}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 transition-all"
          >
            <RotateCcw size={13} />
            <span>Retake AI Assessment</span>
          </button>
        </div>

        {/* Profile Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block">
              Face Silhouette
            </span>
            <p className="text-2xl font-serif italic text-white font-medium">{profile.faceShape}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block">
              Style Archetype
            </span>
            <p className="text-2xl font-serif italic text-white font-medium">{profile.stylePreference}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block">
              Primary Usage
            </span>
            <p className="text-2xl font-serif italic text-white font-medium">{profile.usage}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block">
              Budget Target
            </span>
            <p className="text-2xl font-serif italic text-white font-medium">
              Rp {profile.budgetMax.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Recommended Products */}
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-orange-700 block mb-1">
              Highest Compatibility
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif italic text-[#1A1A1A]">
              Top 3 Recommended Frames
            </h2>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="text-xs font-bold uppercase tracking-widest text-black/70 hover:text-black flex items-center gap-1.5"
          >
            <span>Explore All Frames</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* 3 Featured Recommendation Cards with High-Detail Rationale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {topRecommendations.map((match, idx) => (
            <div
              key={match.product.id}
              className="bg-white rounded-[36px] p-6 sm:p-8 border border-black/5 shadow-md flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all"
            >
              {/* Card Top Pill */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-black/40">
                  Recommendation #{idx + 1}
                </span>
                <div className="px-3 py-1 bg-orange-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                  <Sparkles size={10} />
                  <span>{match.compatibilityScore}% Compatibility</span>
                </div>
              </div>

              {/* Product Visual */}
              <div
                onClick={() => navigate(`/product/${match.product.id}`)}
                className="relative w-full h-56 bg-[#F5F2ED] rounded-3xl flex items-center justify-center overflow-hidden cursor-pointer group-hover:bg-[#EFECE6] transition-colors mb-4"
              >
                <img
                  src={match.product.thumbnail}
                  alt={match.product.name}
                  className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = '/images/products/product-01-teak-rect-main.svg';
                    }
                  }}
                />

                <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-wider text-black">
                  {match.product.frameShape}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3 flex-grow">
                <div>
                  <h3
                    onClick={() => navigate(`/product/${match.product.id}`)}
                    className="text-2xl font-serif italic text-black hover:text-orange-700 transition-colors cursor-pointer"
                  >
                    {match.product.name}
                  </h3>
                  <p className="text-xs text-black/50 font-medium">
                    {match.product.frameShape} • {match.product.material}
                  </p>
                </div>

                <p className="text-lg font-medium text-black tracking-tight">
                  Rp {match.product.price.toLocaleString('id-ID')}
                </p>

                {/* AI Rationale Box */}
                <div className="p-4 bg-[#F5F2ED] rounded-2xl border border-black/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-orange-700 block">
                    Why this frame?
                  </span>
                  <p className="text-xs font-serif italic text-black/80 leading-relaxed">
                    "{match.aiRationale}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-4 border-t border-black/5 space-y-2">
                <button
                  onClick={() => navigate(`/try-on/${match.product.id}`)}
                  className="w-full py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Eye size={14} />
                  <span>Try Now (AR)</span>
                </button>

                <button
                  onClick={() => addToCart(match.product)}
                  className="w-full py-3 bg-[#F5F2ED] text-black rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={13} />
                  <span>Add To Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Compatible Frames */}
      {otherMatches.length > 0 && (
        <div className="pt-8 border-t border-black/10 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-black/40 block mb-1">
                Extended Selection
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif italic text-black">
                More Frames Suiting Your Profile
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {otherMatches.map((match) => (
              <ProductCard
                key={match.product.id}
                product={match.product}
                compatibilityScore={match.compatibilityScore}
                aiRationale={match.aiRationale}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
