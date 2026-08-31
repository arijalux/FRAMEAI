import React from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { FrameViewer } from './FrameViewer';
import { Heart, Sparkles, Eye, ShoppingBag, Check, Layers } from 'lucide-react';

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

  return (
    <div
      className="group relative bg-white rounded-[32px] p-6 shadow-xs hover:shadow-xl transition-all duration-500 flex flex-col justify-between border border-black/5 overflow-hidden"
      id={`product-card-${product.id}`}
    >
      {/* Top Header info */}
      <div className="flex justify-between items-start mb-4 z-10">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest font-bold text-black/40">
            {product.sellerLocation}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/store/${product.sellerId}`);
            }}
            className="text-xs font-semibold text-black/80 hover:text-orange-700 hover:underline transition-colors text-left cursor-pointer"
          >
            {product.sellerName}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {compatibilityScore !== undefined && (
            <div className="px-2.5 py-1 bg-orange-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-xs">
              <Sparkles size={10} />
              <span>{compatibilityScore}% Match</span>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              wishlisted
                ? 'bg-orange-700/10 text-orange-700'
                : 'bg-black/5 text-black/50 hover:bg-black/10 hover:text-black'
            }`}
            title="Add to Wishlist"
          >
            <Heart size={14} className={wishlisted ? 'fill-orange-700' : ''} />
          </button>
        </div>
      </div>

      {/* Frame Visual / Photography Canvas */}
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        className="cursor-pointer relative w-full h-52 bg-[#F5F2ED] rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-[#EFECE6] transition-colors my-2"
      >
        {/* Background Image / Subtle Watermark */}
        <img
          src={product.thumbnail}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.triedFallback) {
              target.dataset.triedFallback = 'true';
              target.src = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80';
            }
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
          {showTryOnButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/try-on/${product.id}`);
              }}
              className="w-full py-2.5 bg-white text-black rounded-full text-[11px] font-bold tracking-widest uppercase shadow-lg hover:bg-orange-700 hover:text-white transition-all flex items-center justify-center gap-2 transform translate-y-2 group-hover:translate-y-0 duration-300 cursor-pointer"
            >
              <Eye size={13} />
              <span>TRY ON (AR)</span>
            </button>
          )}
        </div>

        {/* Floating Shape Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-wider text-black/80">
          {product.frameShape}
        </div>
      </div>

      {/* Product Details */}
      <div className="pt-3 flex-grow">
        <div className="flex justify-between items-start">
          <h3
            onClick={() => navigate(`/product/${product.id}`)}
            className="text-lg font-serif italic text-black hover:text-orange-700 transition-colors cursor-pointer line-clamp-1"
          >
            {product.name}
          </h3>
          <div className="text-right">
            <p className="text-sm font-bold text-black tracking-tight">{formattedPrice}</p>
            {formattedOriginalPrice && (
              <p className="text-[11px] text-black/40 line-through">{formattedOriginalPrice}</p>
            )}
          </div>
        </div>

        <p className="text-xs text-black/50 line-clamp-1 mt-1">
          {product.material} • {product.weightGrams}g
        </p>

        {/* AI Rationale (if in recommendation mode) */}
        {aiRationale && (
          <div className="mt-3 p-2.5 bg-[#F5F2ED] rounded-xl text-[11px] italic text-black/75 font-serif border border-black/5 leading-relaxed">
            "{aiRationale}"
          </div>
        )}

        {/* Color Palette Indicators */}
        <div className="flex items-center gap-1.5 mt-3">
          {product.frameColors.map((color) => (
            <span
              key={color.name}
              className="w-3.5 h-3.5 rounded-full border border-black/20"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
          <span className="text-[10px] text-black/40 ml-1">
            {product.frameColors.length} colors
          </span>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center gap-2 pt-4 mt-2 border-t border-black/5">
        <button
          onClick={() => toggleCompare(product.id)}
          className={`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
            compared
              ? 'bg-black text-white'
              : 'bg-[#F5F2ED] text-black/70 hover:bg-black/10 hover:text-black'
          }`}
          title="Compare with other frames"
        >
          <Layers size={12} />
          <span>{compared ? 'Compared' : 'Compare'}</span>
        </button>

        <button
          onClick={() => addToCart(product)}
          className="flex-1 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-1.5"
          id={`add-to-cart-btn-${product.id}`}
        >
          <ShoppingBag size={12} />
          <span>Add To Cart</span>
        </button>
      </div>
    </div>
  );
};
