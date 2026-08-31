import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ui/ProductCard';
import {
  Store,
  MapPin,
  Star,
  ShieldCheck,
  Award,
  Package,
  Sparkles,
  ArrowLeft,
  Calendar,
  Layers,
  HeartHandshake,
  SlidersHorizontal,
  Eye,
} from 'lucide-react';
import { FrameShape, Product } from '../types';

export const Storefront: React.FC<{ sellerId: string }> = ({ sellerId }) => {
  const { sellers, products, navigate } = useApp();

  // Find seller
  const seller =
    sellers.find(
      (s) =>
        s.id === sellerId ||
        s.id === `seller-${sellerId}` ||
        s.id.replace('seller-', '') === (sellerId || '').replace('seller-', '')
    ) ||
    sellers[0];

  const sellerProducts = products.filter(
    (p) => p.sellerId === seller.id || p.sellerName.toLowerCase().includes(seller.name.toLowerCase())
  );

  const [selectedShape, setSelectedShape] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const filteredProducts = sellerProducts
    .filter((p) => {
      if (selectedShape === 'All') return true;
      return p.frameShape === selectedShape;
    })
    .sort((a, b) => {
      if (selectedSort === 'price-asc') return a.price - b.price;
      if (selectedSort === 'price-desc') return b.price - a.price;
      return 0;
    });

  const availableShapes = ['All', ...Array.from(new Set(sellerProducts.map((p) => p.frameShape)))];

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8 space-y-12 animate-in fade-in duration-300">
      {/* Top Breadcrumbs */}
      <div className="flex items-center justify-between text-xs text-black/50">
        <button
          onClick={() => navigate('/explore')}
          className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-black hover:text-orange-700 transition-colors"
          id="storefront-back-btn"
        >
          <ArrowLeft size={14} />
          <span>Back to All Ateliers</span>
        </button>

        <div className="flex items-center gap-2">
          <span>Indonesian Artisans</span>
          <span>/</span>
          <span className="text-black font-semibold">{seller.name}</span>
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-md">
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-72 w-full bg-[#E5DFD7] overflow-hidden">
          <img
            src={seller.bannerImage}
            alt={seller.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 sm:left-10 text-white">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20 mb-2">
              <Award size={12} className="text-orange-400" />
              <span>Certified Indonesian Optical SME</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif italic text-white font-medium">
              {seller.name}
            </h1>
          </div>
        </div>

        {/* Profile Details & Story Row */}
        <div className="p-6 sm:p-10 space-y-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-black/5">
            {/* Atelier Info */}
            <div className="flex items-center gap-4 sm:gap-5">
              <img
                src={seller.avatar}
                alt={seller.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-black/10 shadow-xs bg-white shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-serif italic text-black font-semibold">
                    {seller.name}
                  </h2>
                  {seller.verified && (
                    <ShieldCheck size={18} className="text-emerald-700" title="Verified Artisan Partner" />
                  )}
                </div>
                <p className="text-xs text-black/60 flex items-center gap-1.5 mt-0.5">
                  <MapPin size={13} className="text-orange-700" />
                  <span>{seller.location}, {seller.province}</span>
                  <span>•</span>
                  <Calendar size={13} />
                  <span>Est. {seller.foundedYear}</span>
                </p>
              </div>
            </div>

            {/* Seller Key Stats Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="px-4 py-2.5 bg-[#F5F2ED] rounded-2xl border border-black/5 flex items-center gap-2">
                <Star size={15} className="text-amber-600 fill-amber-500" />
                <div>
                  <span className="font-bold text-black">{seller.rating} / 5.0</span>
                  <span className="text-[10px] text-black/40 block">Artisan Rating</span>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-[#F5F2ED] rounded-2xl border border-black/5 flex items-center gap-2">
                <Package size={15} className="text-black/60" />
                <div>
                  <span className="font-bold text-black">{seller.salesCount}+</span>
                  <span className="text-[10px] text-black/40 block">Frames Crafted</span>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-[#F5F2ED] rounded-2xl border border-black/5 flex items-center gap-2">
                <Sparkles size={15} className="text-orange-700" />
                <div>
                  <span className="font-bold text-black">{sellerProducts.length} Models</span>
                  <span className="text-[10px] text-black/40 block">Active Collection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Artisan Heritage Story */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#F5F2ED] p-6 sm:p-8 rounded-3xl border border-black/5">
            <div className="md:col-span-8 space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-orange-700 block">
                Heritage & Craftsmanship Story
              </span>
              <p className="text-sm text-black/80 leading-relaxed font-normal">
                {seller.story || seller.description}
              </p>
            </div>
            <div className="md:col-span-4 space-y-2 border-t md:border-t-0 md:border-l border-black/10 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 block">
                Atelier Specialty
              </span>
              <p className="text-xs font-semibold text-black leading-snug">
                {seller.specialty}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Header & Filters */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-black/10 pb-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-orange-700 flex items-center gap-1.5 mb-1">
              <Store size={14} />
              <span>Artisan Frame Collection</span>
            </span>
            <h2 className="text-3xl font-serif italic text-black">
              Handcrafted by {seller.name} ({filteredProducts.length})
            </h2>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Shape Filter */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-black/10 shadow-xs text-xs font-semibold">
              {availableShapes.map((shape) => (
                <button
                  key={shape}
                  onClick={() => setSelectedShape(shape)}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    selectedShape === shape
                      ? 'bg-black text-white'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="px-4 py-2 bg-white rounded-full border border-black/10 text-xs font-semibold text-black focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-12 text-center border border-black/5 space-y-4">
            <Package size={32} className="text-black/30 mx-auto" />
            <h3 className="text-xl font-serif italic text-black">No frames match this shape</h3>
            <p className="text-xs text-black/60">
              Try selecting "All" to view the complete atelier catalog.
            </p>
            <button
              onClick={() => setSelectedShape('All')}
              className="px-6 py-2.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Trust & Guarantee Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-black/10">
        <div className="bg-white rounded-[28px] p-6 border border-black/5 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-serif italic text-base text-black font-semibold">30-Day Fit Guarantee</h4>
            <p className="text-xs text-black/60 mt-1 leading-relaxed">
              If the hand-beveled frame does not fit comfortably, our atelier will re-adjust or exchange at zero extra cost.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-6 border border-black/5 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-orange-50 text-orange-800 rounded-2xl">
            <Eye size={24} />
          </div>
          <div>
            <h4 className="font-serif italic text-base text-black font-semibold">Virtual AR Sizing</h4>
            <p className="text-xs text-black/60 mt-1 leading-relaxed">
              Experience millimeter-precision AR try-on directly in your web browser before placing an order.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-6 border border-black/5 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-800 rounded-2xl">
            <HeartHandshake size={24} />
          </div>
          <div>
            <h4 className="font-serif italic text-base text-black font-semibold">Direct SME Support</h4>
            <p className="text-xs text-black/60 mt-1 leading-relaxed">
              100% of your eyewear investment directly fuels independent Indonesian optical craftspeople.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
