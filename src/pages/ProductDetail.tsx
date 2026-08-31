import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FrameViewer } from '../components/ui/FrameViewer';
import { ProductCard } from '../components/ui/ProductCard';
import { generateWhyThisFrame } from '../services/geminiService';
import {
  Eye,
  ShoppingBag,
  Heart,
  Sparkles,
  MapPin,
  ShieldCheck,
  Check,
  Ruler,
  Layers,
  ArrowLeft,
  Share2,
  ChevronRight,
  Info,
  Store,
  Box,
} from 'lucide-react';
import { FaceShape } from '../types';

export const ProductDetail: React.FC<{ productId: string }> = ({ productId }) => {
  const { products, getProductById, getSellerById, addToCart, toggleWishlist, isWishlisted, navigate, faceAnalysis } =
    useApp();

  const product = getProductById(productId) || products[0];
  const seller = getSellerById(product.sellerId);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.defaultColor);
  const [selectedPrescription, setSelectedPrescription] = useState<'Non-Prescription' | 'Single Vision' | 'Blue Light Block' | 'Progressive'>('Single Vision');
  const [activeFaceShape, setActiveFaceShape] = useState<FaceShape>(
    faceAnalysis?.faceShape || product.bestForFaceShapes[0] || 'Oval'
  );
  const [whyThisFrameExplanation, setWhyThisFrameExplanation] = useState<string>(
    product.whyThisFrameTemplate || ''
  );
  const [loadingAiReason, setLoadingAiReason] = useState(false);

  // Sync color if product changes
  useEffect(() => {
    setSelectedColor(product.defaultColor);
    setSelectedImageIndex(0);
  }, [product]);

  // Load / Update "Why this frame?" AI explanation
  useEffect(() => {
    let isMounted = true;
    async function fetchReason() {
      setLoadingAiReason(true);
      const text = await generateWhyThisFrame(
        product,
        activeFaceShape,
        faceAnalysis?.stylePreference || 'Minimal'
      );
      if (isMounted) {
        setWhyThisFrameExplanation(text);
        setLoadingAiReason(false);
      }
    }
    fetchReason();
    return () => {
      isMounted = false;
    };
  }, [product, activeFaceShape, faceAnalysis]);

  const wishlisted = isWishlisted(product.id);

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

  const currentColorHex =
    product.frameColors.find((c) => c.name === selectedColor)?.hex || '#1A1A1A';

  const similarProducts = products
    .filter((p) => p.id !== product.id && (p.frameShape === product.frameShape || p.sellerId === product.sellerId))
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8 space-y-16">
      {/* Top Breadcrumbs */}
      <div className="flex items-center justify-between text-xs text-black/50">
        <button
          onClick={() => navigate('/explore')}
          className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-black hover:text-orange-700 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-black font-semibold">{product.name}</span>
        </div>
      </div>

      {/* Main Product Presentation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column: Interactive Visuals & Gallery */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visual Display */}
          <div className="relative w-full aspect-[4/3] bg-white rounded-[40px] border border-black/5 p-8 flex items-center justify-center overflow-hidden shadow-sm">
            {/* Spotlight / Try-On Prompt */}
            <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
              <span className="px-3 py-1 bg-[#F5F2ED] text-black text-[10px] font-bold uppercase tracking-wider rounded-full border border-black/10">
                {product.frameShape}
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-full">
                In Stock ({product.stock} left)
              </span>
            </div>

            <button
              onClick={() => navigate(`/try-on/${product.id}`)}
              className="absolute top-6 right-6 z-10 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg hover:bg-orange-700 transition-all flex items-center gap-1.5"
            >
              <Eye size={13} />
              <span>Try Now (AR)</span>
            </button>

            {/* Selected Photo vs Vector Overlay */}
            {product.images[selectedImageIndex] ? (
              <img
                src={product.images[selectedImageIndex]}
                alt={`${product.name} - View ${selectedImageIndex + 1}`}
                className="w-full h-full object-contain p-4 transition-all duration-500 hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedFallback) {
                    target.dataset.triedFallback = 'true';
                    target.src = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80';
                  }
                }}
              />
            ) : (
              <FrameViewer
                shape={product.frameShape}
                colorHex={currentColorHex}
                width={360}
                height={200}
                scale={1.2}
              />
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative w-24 h-20 bg-white rounded-2xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                  selectedImageIndex === idx
                    ? 'border-black shadow-md scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80';
                    }
                  }}
                />
              </button>
            ))}

            {/* Vector Blueprint Thumbnail */}
            <button
              onClick={() => setSelectedImageIndex(-1)}
              className={`relative w-24 h-20 bg-[#F5F2ED] rounded-2xl border-2 flex flex-col items-center justify-center p-2 flex-shrink-0 transition-all ${
                selectedImageIndex === -1
                  ? 'border-black shadow-md scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <FrameViewer shape={product.frameShape} colorHex={currentColorHex} width={50} height={25} />
              <span className="text-[9px] font-bold uppercase tracking-tighter mt-1 text-black/60">
                Blueprint
              </span>
            </button>
          </div>

          {/* Dimensions Diagram Box */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2">
                <Ruler size={14} className="text-orange-700" />
                <span>Optical Frame Dimensions (mm)</span>
              </h3>
              <span className="text-xs text-black/50 font-medium">Weight: {product.weightGrams} grams</span>
            </div>

            <div className="grid grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-[#F5F2ED] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-black/40 block">Lens Width</span>
                <span className="text-sm font-bold text-black">{product.dimensions.lensWidth} mm</span>
              </div>
              <div className="p-3 bg-[#F5F2ED] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-black/40 block">Bridge</span>
                <span className="text-sm font-bold text-black">{product.dimensions.bridgeWidth} mm</span>
              </div>
              <div className="p-3 bg-[#F5F2ED] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-black/40 block">Temple</span>
                <span className="text-sm font-bold text-black">{product.dimensions.templeLength} mm</span>
              </div>
              <div className="p-3 bg-[#F5F2ED] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-black/40 block">Frame Width</span>
                <span className="text-sm font-bold text-black">{product.dimensions.frameWidth} mm</span>
              </div>
              <div className="p-3 bg-[#F5F2ED] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-black/40 block">Lens Height</span>
                <span className="text-sm font-bold text-black">{product.dimensions.lensHeight} mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details, Colorway, AI Section & Purchasing */}
        <div className="lg:col-span-5 space-y-8">
          {/* Header Info */}
          <div className="space-y-3 pb-6 border-b border-black/10">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-bold text-orange-700 flex items-center gap-1">
                <MapPin size={13} />
                <span>{product.sellerName} • {product.sellerLocation}, Indonesia</span>
              </span>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-2.5 rounded-full border transition-all ${
                  wishlisted
                    ? 'bg-orange-700 text-white border-orange-700'
                    : 'bg-white text-black/60 border-black/10 hover:border-black'
                }`}
                title="Save to wishlist"
              >
                <Heart size={16} className={wishlisted ? 'fill-white' : ''} />
              </button>
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif italic text-black leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 pt-1">
              <span className="text-3xl font-medium tracking-tight text-black">
                {formattedPrice}
              </span>
              {formattedOriginalPrice && (
                <span className="text-base text-black/40 line-through">
                  {formattedOriginalPrice}
                </span>
              )}
            </div>

            <p className="text-sm text-black/70 leading-relaxed pt-2">
              {product.description}
            </p>
          </div>

          {/* Color Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-black/40">
                Frame Color
              </span>
              <span className="font-bold text-black">{selectedColor}</span>
            </div>

            <div className="flex items-center gap-3">
              {product.frameColors.map((color) => {
                const isSelected = selectedColor === color.name;
                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`group flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all ${
                      isSelected
                        ? 'border-black bg-white shadow-xs font-bold text-black'
                        : 'border-black/10 bg-[#F5F2ED] text-black/70 hover:border-black/30'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-xs">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prescription / Lens Selection */}
          <div className="space-y-3">
            <span className="font-bold uppercase tracking-wider text-xs text-black/40 block">
              Optical Lens Type
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'Non-Prescription', extra: 'Frame Only' },
                { type: 'Single Vision', extra: 'Included' },
                { type: 'Blue Light Block', extra: '+Rp 150.000' },
                { type: 'Progressive', extra: '+Rp 350.000' },
              ].map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => setSelectedPrescription(opt.type as any)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedPrescription === opt.type
                      ? 'bg-black text-white border-black font-semibold'
                      : 'bg-white text-black/70 border-black/10 hover:border-black/30'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.type}</div>
                  <div className="text-[10px] opacity-70">{opt.extra}</div>
                </button>
              ))}
            </div>
          </div>

          {/* "WHY THIS FRAME?" AI Section */}
          <div className="bg-[#EFECE6] p-6 rounded-3xl border border-black/10 space-y-3 relative overflow-hidden" id="why-this-frame-section">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-700">
                <Sparkles size={14} />
                <span>Why This Frame for You?</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-black/50">
                <span>Simulating Face:</span>
                <select
                  value={activeFaceShape}
                  onChange={(e) => setActiveFaceShape(e.target.value as FaceShape)}
                  className="bg-white/80 px-2 py-0.5 rounded-md text-[10px] font-bold text-black border border-black/10 focus:outline-none"
                >
                  <option value="Oval">Oval</option>
                  <option value="Round">Round</option>
                  <option value="Square">Square</option>
                  <option value="Heart">Heart</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Oblong">Oblong</option>
                </select>
              </div>
            </div>

            <p className="text-sm font-serif italic text-black/85 leading-relaxed">
              {loadingAiReason ? (
                <span className="animate-pulse text-black/50">Consulting optical styling AI...</span>
              ) : (
                `"${whyThisFrameExplanation}"`
              )}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-black/60">
              <span className="bg-white/70 px-2.5 py-1 rounded-full">
                Material: {product.material}
              </span>
              <span className="bg-white/70 px-2.5 py-1 rounded-full">
                Suits {product.bestForFaceShapes.join(', ')}
              </span>
            </div>
          </div>

          {/* Action CTAs: TRY ON FACE + VIEW IN REAL SIZE + ADD TO CART */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate(`/try-on/${product.id}`)}
                className="w-full py-4 bg-[#1A1A1A] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                id="product-detail-try-now-btn"
              >
                <Eye size={15} className="text-orange-400 group-hover:scale-110 transition-transform" />
                <span>Try On My Face (AR)</span>
              </button>

              <button
                onClick={() => navigate(`/ar-display/${product.id}`)}
                className="w-full py-4 bg-[#F5F2ED] text-black border border-black/15 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer group"
                id="product-detail-ar-display-btn"
              >
                <Box size={15} className="text-orange-700 group-hover:text-white group-hover:scale-110 transition-transform" />
                <span>View in Real Size (1:1)</span>
              </button>
            </div>

            <button
              onClick={() => addToCart(product, selectedColor, selectedPrescription)}
              className="w-full py-4 border border-black/20 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              id="product-detail-add-cart-btn"
            >
              <ShoppingBag size={15} />
              <span>Add to Cart ({formattedPrice})</span>
            </button>
          </div>

          {/* SME Story & Guarantees */}
          {seller && (
            <div className="pt-6 border-t border-black/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={seller.avatar}
                    alt={seller.name}
                    className="w-12 h-12 rounded-full object-cover border border-black/10"
                  />
                  <div>
                    <h4 className="font-serif italic text-base text-black font-semibold">
                      Crafted by {seller.name}
                    </h4>
                    <p className="text-xs text-black/50">
                      {seller.location}, {seller.province} • Active since {seller.foundedYear}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/store/${seller.id}`)}
                  className="px-3.5 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider rounded-full hover:bg-orange-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  id="product-detail-view-storefront-btn"
                >
                  <Store size={12} />
                  <span>Visit Storefront</span>
                </button>
              </div>

              <p className="text-xs text-black/70 leading-relaxed bg-[#F5F2ED] p-4 rounded-2xl">
                {seller.story}
              </p>

              <div className="flex items-center gap-6 text-[11px] text-black/60 font-semibold">
                <span className="flex items-center gap-1 text-emerald-700">
                  <ShieldCheck size={14} /> Free 30-Day Fit Guarantee
                </span>
                <span>•</span>
                <span>Insured Nationwide Shipping</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Artisan Frames */}
      {similarProducts.length > 0 && (
        <div className="pt-12 border-t border-black/10 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-black/40 block mb-1">
                More from our Ateliers
              </span>
              <h2 className="text-3xl font-serif italic text-black">Similar Handcrafted Eyewear</h2>
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="text-xs font-bold uppercase tracking-widest text-orange-700 hover:underline"
            >
              View Full Collection
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
