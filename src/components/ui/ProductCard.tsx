import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { Heart, Sparkles, Eye, ShoppingBag, Layers, Star, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  compatibilityScore?: number;
  aiRationale?: string;
  showTryOnButton?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compatibilityScore,
  aiRationale,
  showTryOnButton = true,
}) => {
  const { navigate, addToCart, toggleWishlist, isWishlisted, toggleCompare, isCompared } = useApp();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isAddedAnimation, setIsAddedAnimation] = useState(false);

  const wishlisted = isWishlisted(product.id);
  const compared = isCompared(product.id);

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const formattedOriginalPrice = product.originalPrice
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(product.originalPrice)
    : null;

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    setIsAddedAnimation(true);
    setTimeout(() => setIsAddedAnimation(false), 1400);
  };

  return (
    <div
      className="group relative bg-white rounded-[28px] p-5 sm:p-6 shadow-xs hover:shadow-xl hover:border-black/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-black/8 overflow-hidden h-full"
      id={`product-card-${product.id}`}
    >
      <div>
        {/* Card Header: Frame Shape & Actions */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#F5F2ED] text-black text-[10px] font-bold uppercase tracking-wider rounded-full border border-black/5">
              {product.frameShape}
            </span>
            {discountPercent && (
              <span className="px-2 py-0.5 bg-orange-700 text-white rounded-full text-[9px] font-bold tracking-wider uppercase">
                -{discountPercent}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {compatibilityScore !== undefined ? (
              <div className="px-2.5 py-1 bg-orange-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-2xs">
                <Sparkles size={10} />
                <span>{compatibilityScore}% Match</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-[#F5F2ED] px-2 py-0.5 rounded-full text-[10px] font-semibold text-black/70">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                wishlisted
                  ? 'bg-orange-700/10 text-orange-700'
                  : 'bg-[#F5F2ED] text-black/50 hover:bg-black hover:text-white'
              }`}
              title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              aria-label="Wishlist"
              type="button"
            >
              <Heart size={14} className={wishlisted ? 'fill-orange-700' : ''} />
            </button>
          </div>
        </div>

        {/* Frame Visual Canvas */}
        <div
          onClick={() => navigate(`/product/${product.id}`)}
          className="cursor-pointer relative w-full aspect-[4/3] bg-[#F7F5F0] rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-[#EFECE6] transition-colors mb-3.5 border border-black/5"
        >
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-full h-full object-contain p-2 sm:p-3 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedFallback) {
                target.dataset.triedFallback = 'true';
                target.src = '/images/products/product-01-teak-rect-main.svg';
              }
            }}
          />

          {/* Hover AR Try-On Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3 sm:p-4 z-10">
            {showTryOnButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/try-on/${product.id}`);
                }}
                className="w-full py-2.5 bg-white text-black rounded-full text-[11px] font-bold tracking-widest uppercase shadow-md hover:bg-orange-700 hover:text-white transition-all flex items-center justify-center gap-2 transform translate-y-2 group-hover:translate-y-0 duration-300 cursor-pointer"
                type="button"
              >
                <Eye size={14} />
                <span>Virtual Try-On (AR)</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Details: Name, Price, Material, Color */}
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <h3
              onClick={() => navigate(`/product/${product.id}`)}
              className="text-base sm:text-lg font-serif italic text-black group-hover:text-orange-700 transition-colors cursor-pointer line-clamp-1 leading-snug"
              title={product.name}
            >
              {product.name}
            </h3>
            <div className="text-right shrink-0">
              <p className="text-xs sm:text-sm font-bold text-black tracking-tight">{formattedPrice}</p>
              {formattedOriginalPrice && (
                <p className="text-[10px] text-black/40 line-through">{formattedOriginalPrice}</p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-black/60 line-clamp-1">
            {product.material} • {product.weightGrams}g ultralight
          </p>

          {/* AI Rationale (if in recommendation mode) */}
          {aiRationale && (
            <div className="mt-2 p-2.5 bg-[#F5F2ED] rounded-xl text-[11px] italic text-black/75 font-serif border border-black/5 leading-relaxed">
              "{aiRationale}"
            </div>
          )}

          {/* Color Palette Indicators */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {product.frameColors.map((color, idx) => (
                <button
                  key={color.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColorIndex(idx);
                  }}
                  className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                    selectedColorIndex === idx
                      ? 'scale-125 ring-2 ring-black ring-offset-1'
                      : 'border border-black/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name}${selectedColorIndex === idx ? ' (Selected)' : ''}`}
                  type="button"
                />
              ))}
              <span className="text-[10px] text-black/45 ml-1 select-none">
                {product.frameColors.length} {product.frameColors.length === 1 ? 'color' : 'colors'}
              </span>
            </div>

            <button
              onClick={() => navigate(`/product/${product.id}`)}
              className="text-[11px] text-black/50 hover:text-black font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action CTAs: Compare & Cart */}
      <div className="flex items-center gap-2 pt-3.5 mt-3 border-t border-black/6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCompare(product.id);
          }}
          className={`px-3 sm:px-3.5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 min-h-[40px] ${
            compared
              ? 'bg-black text-white shadow-2xs'
              : 'bg-[#F5F2ED] text-black/70 hover:bg-black/10 hover:text-black'
          }`}
          title={compared ? 'In Compare Bench' : 'Compare specifications'}
          aria-label={compared ? 'In Compare Bench' : 'Compare specifications'}
          type="button"
        >
          <Layers size={13} className="shrink-0" />
          <span className="hidden sm:inline lg:hidden xl:inline whitespace-nowrap">{compared ? 'In Compare' : 'Compare'}</span>
        </button>

        <button
          onClick={handleAddToCart}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
            isAddedAnimation
              ? 'bg-emerald-600 text-white'
              : 'bg-black text-white hover:bg-orange-700 shadow-xs'
          }`}
          id={`add-to-cart-btn-${product.id}`}
          title={isAddedAnimation ? 'Added to Bag' : 'Add to Bag'}
          aria-label={isAddedAnimation ? 'Added to Bag' : 'Add to Bag'}
          type="button"
        >
          {isAddedAnimation ? (
            <>
              <Check size={14} className="shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Added!</span>
            </>
          ) : (
            <>
              <ShoppingBag size={13} className="shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Add to Bag</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
