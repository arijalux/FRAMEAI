import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ui/ProductCard';
import { Search, Filter, SlidersHorizontal, X, Sparkles, Check, RotateCcw } from 'lucide-react';
import { FrameShape, FrameStyle, Product } from '../types';

export const Explore: React.FC = () => {
  const { products, currentPath, navigate } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedShapes, setSelectedShapes] = useState<FrameShape[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<FrameStyle[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(2000000);
  const [sortBy, setSortBy] = useState<
    'featured' | 'trending' | 'price-asc' | 'price-desc' | 'rating' | 'try-ons' | 'newest'
  >('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL query params if any (e.g. /explore?shape=Rectangle)
  useEffect(() => {
    const safePath = (currentPath || '').toString();
    if (safePath.includes('?')) {
      const queryStr = safePath.split('?')[1];
      const params = new URLSearchParams(queryStr);
      const shapeParam = params.get('shape');
      if (shapeParam) {
        setSelectedShapes([shapeParam as FrameShape]);
      }
    }
  }, [currentPath]);

  const categories = ['All', 'Eyeglasses', 'Sunglasses', 'Blue Light', 'Signature Line'];
  const allShapes: FrameShape[] = [
    'Rectangle',
    'Round',
    'Square',
    'Aviator',
    'Cat-Eye',
    'Browline',
    'Wayfarer',
    'Oval',
    'Geometric',
  ];
  const allStyles: FrameStyle[] = ['Minimal', 'Professional', 'Casual', 'Vintage', 'Bold'];

  const allMaterials = [
    'Handcrafted Teak & Bio-Acetate',
    'Natural Teak & Sonokeling',
    'Sustainable Teakwood & Bamboo',
    'Ultralight Teak & Titanium',
    'Organic Sandalwood & Teak',
    'Hand-carved Bamboo & Alloy',
  ];

  const toggleShape = (shape: FrameShape) => {
    setSelectedShapes((prev) =>
      prev.includes(shape) ? prev.filter((s) => s !== shape) : [...prev, shape]
    );
  };

  const toggleStyle = (style: FrameStyle) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedShapes([]);
    setSelectedStyles([]);
    setSelectedMaterials([]);
    setMaxPrice(2000000);
    setSortBy('featured');
  };

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    selectedShapes.length +
    selectedStyles.length +
    selectedMaterials.length +
    (maxPrice < 2000000 ? 1 : 0) +
    (searchQuery ? 1 : 0);

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      // Search query (name, shape, material, style, usage)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchShape = p.frameShape.toLowerCase().includes(q);
        const matchMaterial = p.material.toLowerCase().includes(q);
        const matchStyle = p.style.some((s) => s.toLowerCase().includes(q));
        const matchUsage = p.usage?.some((u) => u.toLowerCase().includes(q));
        if (!matchName && !matchShape && !matchMaterial && !matchStyle && !matchUsage) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Signature Line') {
          if (!p.isSpotlight && !p.isTrending) return false;
        } else if (p.category !== selectedCategory) {
          return false;
        }
      }

      // Shapes
      if (selectedShapes.length > 0 && !selectedShapes.includes(p.frameShape)) {
        return false;
      }

      // Styles
      if (selectedStyles.length > 0 && !p.style.some((s) => selectedStyles.includes(s))) {
        return false;
      }

      // Materials
      if (
        selectedMaterials.length > 0 &&
        !selectedMaterials.some((m) => p.material.toLowerCase().includes(m.toLowerCase()))
      ) {
        return false;
      }

      // Price limit
      if (p.price > maxPrice) {
        return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'featured') {
      return [...filtered].sort((a, b) => (b.isSpotlight ? 1 : 0) - (a.isSpotlight ? 1 : 0));
    } else if (sortBy === 'trending') {
      return [...filtered].sort((a, b) => {
        const scoreA = a.trendScore || ((a.views || 0) * 0.1 + (a.tryOns || 0) * 0.4 + (a.wishlists || 0) * 0.2 + (a.purchases || 0));
        const scoreB = b.trendScore || ((b.views || 0) * 0.1 + (b.tryOns || 0) * 0.4 + (b.wishlists || 0) * 0.2 + (b.purchases || 0));
        return scoreB - scoreA;
      });
    } else if (sortBy === 'price-asc') {
      return [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      return [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      return [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'try-ons') {
      return [...filtered].sort((a, b) => (b.tryOns || 0) - (a.tryOns || 0));
    } else if (sortBy === 'newest') {
      return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedShapes,
    selectedStyles,
    selectedMaterials,
    maxPrice,
    sortBy,
  ]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    categories.forEach((cat) => {
      if (cat === 'Signature Line') {
        counts[cat] = products.filter((p) => p.isSpotlight || p.isTrending).length;
      } else if (cat !== 'All') {
        counts[cat] = products.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, [products]);

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8 space-y-8">
      {/* Header & Page Title */}
      <div 
        id="explore-header-section"
        className="flex flex-row justify-between items-center gap-3 sm:gap-6 pb-5 sm:pb-6 border-b border-black/10 transition-all"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif italic text-[#1A1A1A] tracking-tight whitespace-nowrap">
            BJ Collection
          </h1>
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EAE5DC] border border-black/10 text-[10px] sm:text-xs font-semibold text-orange-800 uppercase tracking-wider whitespace-nowrap">
            {products.length} Frames
          </span>
        </div>

        {/* Search Bar */}
        <div 
          id="explore-search-bar"
          className="w-44 sm:w-64 md:w-72 lg:w-80 shrink-0 relative group"
        >
          <div className="relative flex items-center">
            <Search 
              size={16} 
              className="absolute left-3.5 text-black/40 group-focus-within:text-black transition-colors pointer-events-none" 
            />
            <input
              type="text"
              placeholder="Search frames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-8 sm:pr-9 py-2 sm:py-2.5 bg-white border border-black/15 rounded-full text-xs sm:text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/60 placeholder:text-black/40 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 p-1 rounded-full text-black/40 hover:text-black hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills with Dynamic Counts */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const count = categoryCounts[cat] ?? 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white text-black/70 border border-black/10 hover:border-black/30'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-black/60'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden px-4 py-2.5 bg-white border border-black/15 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
          >
            <Filter size={14} />
            <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </button>

          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-black/10 rounded-full text-xs font-semibold text-black shadow-2xs">
            <span className="text-black/40 uppercase tracking-wider text-[10px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-black focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured Silhouettes</option>
              <option value="trending">Trending (Most Popular)</option>
              <option value="try-ons">Most Tried-On (AR)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Releases</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 bg-[#F5F2ED] p-3.5 rounded-2xl border border-black/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 mr-1">
            Active Filters:
          </span>

          {selectedCategory !== 'All' && (
            <span
              onClick={() => setSelectedCategory('All')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer hover:bg-orange-700 transition-colors"
            >
              <span>Category: {selectedCategory}</span>
              <X size={12} />
            </span>
          )}

          {selectedShapes.map((shape) => (
            <span
              key={shape}
              onClick={() => toggleShape(shape)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer hover:bg-orange-700 transition-colors"
            >
              <span>Shape: {shape}</span>
              <X size={12} />
            </span>
          ))}

          {selectedStyles.map((style) => (
            <span
              key={style}
              onClick={() => toggleStyle(style)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A]/80 text-white text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer hover:bg-orange-700 transition-colors"
            >
              <span>Style: {style}</span>
              <X size={12} />
            </span>
          ))}

          {selectedMaterials.map((mat) => (
            <span
              key={mat}
              onClick={() => toggleMaterial(mat)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer hover:bg-orange-700 transition-colors"
            >
              <span>{mat}</span>
              <X size={12} />
            </span>
          ))}

          {maxPrice < 2000000 && (
            <span
              onClick={() => setMaxPrice(2000000)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-black/20 text-black text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer hover:bg-black hover:text-white transition-colors"
            >
              <span>Max: Rp {maxPrice.toLocaleString('id-ID')}</span>
              <X size={12} />
            </span>
          )}

          <button
            onClick={resetFilters}
            className="text-[10px] font-bold text-orange-700 hover:underline uppercase tracking-widest ml-auto flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>Reset All ({activeFilterCount})</span>
          </button>
        </div>
      )}

      {/* Main Content Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside
          className={`lg:col-span-3 space-y-7 bg-white p-6 rounded-[32px] border border-black/5 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex justify-between items-center pb-4 border-b border-black/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2">
              <SlidersHorizontal size={14} />
              <span>Filter Catalog</span>
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[10px] font-bold uppercase tracking-wider text-orange-700 hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Frame Shapes */}
          <div className="space-y-3">
            <span className="text-[11px] uppercase tracking-widest font-bold text-black/40 block">
              Frame Shape
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {allShapes.map((shape) => {
                const isSelected = selectedShapes.includes(shape);
                const count = products.filter((p) => p.frameShape === shape).length;
                return (
                  <button
                    key={shape}
                    onClick={() => toggleShape(shape)}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-medium text-left transition-all flex items-center justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white border-black font-bold shadow-xs'
                        : 'bg-[#F5F2ED] text-black/70 border-transparent hover:bg-[#EAE6DF]'
                    }`}
                  >
                    <span>{shape}</span>
                    <span className={`text-[9px] font-mono ${isSelected ? 'text-white/70' : 'text-black/40'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aesthetic Style */}
          <div className="space-y-3 pt-4 border-t border-black/5">
            <span className="text-[11px] uppercase tracking-widest font-bold text-black/40 block">
              Aesthetic Style
            </span>
            <div className="space-y-1.5">
              {allStyles.map((style) => {
                const isSelected = selectedStyles.includes(style);
                const count = products.filter((p) => p.style.includes(style)).length;
                return (
                  <label
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-[#F5F2ED] text-xs text-black/80 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-black border-black text-white'
                            : 'border-black/20 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={10} />}
                      </div>
                      <span className={isSelected ? 'font-bold text-black' : ''}>{style}</span>
                    </div>
                    <span className="text-[10px] text-black/40 font-mono">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Premium Materials */}
          <div className="space-y-3 pt-4 border-t border-black/5">
            <span className="text-[11px] uppercase tracking-widest font-bold text-black/40 block">
              Material
            </span>
            <div className="space-y-1.5">
              {allMaterials.map((mat) => {
                const isSelected = selectedMaterials.includes(mat);
                const count = products.filter((p) => p.material.toLowerCase().includes(mat.toLowerCase())).length;
                if (count === 0) return null;
                return (
                  <label
                    key={mat}
                    onClick={() => toggleMaterial(mat)}
                    className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-[#F5F2ED] text-xs text-black/80 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-black border-black text-white'
                            : 'border-black/20 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={10} />}
                      </div>
                      <span className={isSelected ? 'font-bold text-black' : ''}>{mat}</span>
                    </div>
                    <span className="text-[10px] text-black/40 font-mono">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3 pt-4 border-t border-black/5">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="uppercase tracking-widest text-black/40">Max Price</span>
              <span className="text-black font-mono">Rp {maxPrice.toLocaleString('id-ID')}</span>
            </div>
            <input
              type="range"
              min="500000"
              max="2000000"
              step="50000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-black/40 font-mono">
              <span>Rp 500rb</span>
              <span>Rp 2.0jt</span>
            </div>
          </div>

          {/* Find My Frame Callout */}
          <div className="p-4 bg-[#F5F2ED] rounded-2xl border border-black/5 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-orange-700 flex items-center gap-1">
              <Sparkles size={11} />
              AI Face Fit Advisor
            </span>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Scan your facial proportions and let AI match the ideal frame shape for your geometry.
            </p>
            <button
              onClick={() => navigate('/find-my-frame')}
              className="w-full py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors cursor-pointer"
            >
              Launch Find My Frame
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-9">
          {/* Dynamic Counter Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 bg-white px-6 py-4 rounded-2xl border border-black/5">
            <div>
              <p className="text-xs font-bold text-black uppercase tracking-widest">
                SHOWING {filteredProducts.length} {filteredProducts.length === 1 ? 'FRAME' : 'FRAMES'}
              </p>
              <p className="text-[11px] text-black/50 mt-0.5">
                Handcrafted wooden frames with real-time AR try-on and custom sizing.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-black/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AR Face Try-On Ready</span>
            </div>
          </div>

          {/* Grid of Product Cards */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-12 text-center border border-black/5 space-y-4 my-4">
              <div className="w-16 h-16 bg-[#F5F2ED] rounded-full flex items-center justify-center mx-auto text-black/40">
                <Search size={28} />
              </div>
              <h3 className="text-2xl font-serif italic text-black">
                No frames match these filters
              </h3>
              <p className="text-xs sm:text-sm text-black/60 max-w-md mx-auto leading-relaxed">
                We couldn't find any frames matching your current selection. Try resetting filters or choosing a different shape or style.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => {
                    resetFilters();
                    setSelectedCategory('Eyeglasses');
                  }}
                  className="px-5 py-3 bg-[#F5F2ED] text-black rounded-full text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all cursor-pointer"
                >
                  View Eyeglasses
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
