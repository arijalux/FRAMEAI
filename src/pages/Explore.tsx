import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ui/ProductCard';
import { Search, Filter, SlidersHorizontal, X, Sparkles, MapPin, Check, RotateCcw, Building2, Store } from 'lucide-react';
import { FrameShape, FrameStyle, Product } from '../types';

export const Explore: React.FC = () => {
  const { products, sellers, currentPath, navigate } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedShapes, setSelectedShapes] = useState<FrameShape[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<FrameStyle[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(2000000);
  const [sortBy, setSortBy] = useState<
    'featured' | 'trending' | 'price-asc' | 'price-desc' | 'rating' | 'try-ons' | 'newest'
  >('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL query params if any (e.g. /explore?shape=Rectangle or /explore?seller=optik-melati)
  useEffect(() => {
    const safePath = (currentPath || '').toString();
    if (safePath.includes('?')) {
      const queryStr = safePath.split('?')[1];
      const params = new URLSearchParams(queryStr);
      const shapeParam = params.get('shape');
      if (shapeParam) {
        setSelectedShapes([shapeParam as FrameShape]);
      }
      const sellerParam = params.get('seller');
      if (sellerParam) {
        setSelectedSellers([sellerParam]);
      }
      const locParam = params.get('location');
      if (locParam) {
        setSelectedLocations([locParam]);
      }
    }
  }, [currentPath]);

  const categories = ['All', 'Eyeglasses', 'Sunglasses', 'Blue Light', 'Artisan Custom'];
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
  
  // Location list representing all Indonesian regional clusters
  const allLocations = [
    { label: 'Bandung', key: 'Bandung' },
    { label: 'Yogyakarta', key: 'Yogyakarta' },
    { label: 'Surabaya', key: 'Surabaya' },
    { label: 'Bali / Denpasar', key: 'Bali' },
    { label: 'Jakarta', key: 'Jakarta' },
    { label: 'Malang', key: 'Malang' },
    { label: 'Semarang', key: 'Semarang' },
    { label: 'Solo', key: 'Solo' },
  ];

  const allMaterials = [
    'Italian Acetate',
    'Bio-Acetate',
    'Recycled Ocean Bio-Acetate',
    'Japanese Titanium',
    'Javanese Teak & Bamboo',
    'Stainless Steel',
    'Ultralight TR90',
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

  const toggleLocation = (locKey: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locKey) ? prev.filter((l) => l !== locKey) : [...prev, locKey]
    );
  };

  const toggleSeller = (sellerId: string) => {
    setSelectedSellers((prev) =>
      prev.includes(sellerId) ? prev.filter((s) => s !== sellerId) : [...prev, sellerId]
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
    setSelectedSellers([]);
    setSelectedShapes([]);
    setSelectedStyles([]);
    setSelectedLocations([]);
    setSelectedMaterials([]);
    setMaxPrice(2000000);
    setSortBy('featured');
  };

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    selectedSellers.length +
    selectedShapes.length +
    selectedStyles.length +
    selectedLocations.length +
    selectedMaterials.length +
    (maxPrice < 2000000 ? 1 : 0) +
    (searchQuery ? 1 : 0);

  // Interleave products from different SMEs for Featured sorting
  const interleaveMultiSmeProducts = (items: Product[]): Product[] => {
    const bySeller = new Map<string, Product[]>();
    items.forEach((item) => {
      const list = bySeller.get(item.sellerId) || [];
      list.push(item);
      bySeller.set(item.sellerId, list);
    });

    // Sort products within each seller
    bySeller.forEach((list) => {
      list.sort((a, b) => {
        const scoreA = (a.isSpotlight ? 1000 : 0) + (a.trendScore || 0);
        const scoreB = (b.isSpotlight ? 1000 : 0) + (b.trendScore || 0);
        return scoreB - scoreA;
      });
    });

    // Distinct regional round-robin order: Bandung -> Yogya -> Surabaya -> Bali -> Jakarta -> Malang -> Semarang -> Solo
    const preferredOrder = [
      'optik-melati',
      'mata-rupa-studio',
      'kaca-selatan',
      'nusa-frames',
      'lensa-kota',
      'terang-atelier',
      'bening-works',
      'ruang-mata',
    ];

    const sellerIds = Array.from(bySeller.keys()).sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const result: Product[] = [];
    let hasMore = true;
    let round = 0;

    while (hasMore) {
      hasMore = false;
      for (const sId of sellerIds) {
        const list = bySeller.get(sId);
        if (list && round < list.length) {
          result.push(list[round]);
          if (round + 1 < list.length) {
            hasMore = true;
          }
        }
      }
      round++;
    }

    return result;
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSeller = p.sellerName.toLowerCase().includes(q);
        const matchesLoc = p.sellerLocation.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesShape = p.frameShape.toLowerCase().includes(q);
        const matchesMaterial = p.material.toLowerCase().includes(q);
        if (!matchesName && !matchesSeller && !matchesLoc && !matchesDesc && !matchesShape && !matchesMaterial) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }

      // Selected Sellers
      if (selectedSellers.length > 0) {
        const matchesSelectedSeller = selectedSellers.some(
          (sel) =>
            p.sellerId === sel ||
            p.sellerId === `seller-${sel}` ||
            p.sellerName.toLowerCase().includes(sel.toLowerCase())
        );
        if (!matchesSelectedSeller) return false;
      }

      // Frame Shapes
      if (selectedShapes.length > 0 && !selectedShapes.includes(p.frameShape)) {
        return false;
      }

      // Aesthetic Styles
      if (
        selectedStyles.length > 0 &&
        !p.style.some((s) => selectedStyles.includes(s))
      ) {
        return false;
      }

      // Locations (with Denpasar/Bali matching)
      if (selectedLocations.length > 0) {
        const matchLocation = selectedLocations.some((loc) => {
          if (loc === 'Bali' || loc === 'Denpasar') {
            return (
              p.sellerLocation === 'Denpasar' ||
              p.sellerLocation === 'Bali' ||
              p.sellerId === 'nusa-frames'
            );
          }
          return p.sellerLocation.toLowerCase() === loc.toLowerCase();
        });
        if (!matchLocation) return false;
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
      return interleaveMultiSmeProducts(filtered);
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
    selectedSellers,
    selectedShapes,
    selectedStyles,
    selectedLocations,
    selectedMaterials,
    maxPrice,
    sortBy,
  ]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    categories.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = products.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, [products]);

  // Counts by location
  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allLocations.forEach((loc) => {
      counts[loc.key] = products.filter((p) => {
        if (loc.key === 'Bali') {
          return p.sellerLocation === 'Denpasar' || p.sellerLocation === 'Bali' || p.sellerId === 'nusa-frames';
        }
        return p.sellerLocation.toLowerCase() === loc.key.toLowerCase();
      }).length;
    });
    return counts;
  }, [products]);

  // Counts by seller
  const sellerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sellers.forEach((s) => {
      counts[s.id] = products.filter((p) => p.sellerId === s.id || p.sellerName.toLowerCase() === s.name.toLowerCase()).length;
    });
    return counts;
  }, [products, sellers]);

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8 space-y-8">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-black/10 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest font-bold text-orange-700">
            <Sparkles size={14} />
            <span>Indonesian Multi-SME Eyewear Marketplace</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif italic text-[#1A1A1A]">
            Explore Artisan Eyewear
          </h1>
          <p className="text-sm text-black/60 mt-1 max-w-xl leading-relaxed">
            Discover {products.length} bespoke frames crafted by {sellers.length} independent optical ateliers across Bandung, Yogyakarta, Surabaya, Bali, Jakarta, Malang, Semarang, and Solo.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-80 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            placeholder="Search frames, shape, or SME..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-black/10 rounded-full text-xs font-medium text-black focus:outline-none focus:border-black placeholder:text-black/40 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
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
              <option value="featured">Featured / Marketplace Spotlight</option>
              <option value="trending">Trending Frames (Most Popular)</option>
              <option value="try-ons">Most Tried-On (AR)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Additions</option>
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

          {selectedSellers.map((sId) => {
            const sellerObj = sellers.find((s) => s.id === sId);
            const name = sellerObj ? sellerObj.name : sId;
            return (
              <span
                key={sId}
                onClick={() => toggleSeller(sId)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer hover:bg-black transition-colors"
              >
                <span>Artisan: {name}</span>
                <X size={12} />
              </span>
            );
          })}

          {selectedLocations.map((locKey) => (
            <span
              key={locKey}
              onClick={() => toggleLocation(locKey)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-black/20 text-black text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer hover:bg-black hover:text-white transition-colors"
            >
              <span>City: {locKey}</span>
              <X size={12} />
            </span>
          ))}

          {selectedShapes.map((shape) => (
            <span
              key={shape}
              onClick={() => toggleShape(shape)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer hover:bg-orange-700 transition-colors"
            >
              <span>{shape}</span>
              <X size={12} />
            </span>
          ))}

          {selectedStyles.map((style) => (
            <span
              key={style}
              onClick={() => toggleStyle(style)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer hover:bg-black transition-colors"
            >
              <span>{style}</span>
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

          {/* SME Location Filter */}
          <div className="space-y-3">
            <span className="text-[11px] uppercase tracking-widest font-bold text-black/40 block flex items-center justify-between">
              <span>SME Location</span>
              <span className="text-[9px] text-black/30 font-normal">Indonesian Hubs</span>
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {allLocations.map((loc) => {
                const isSelected = selectedLocations.includes(loc.key);
                const count = locationCounts[loc.key] ?? 0;
                return (
                  <label
                    key={loc.key}
                    onClick={() => toggleLocation(loc.key)}
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
                      <span className={isSelected ? 'font-bold text-black' : ''}>{loc.label}</span>
                    </div>
                    <span className="text-[10px] text-black/40 font-mono">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Artisan / SME Filter */}
          <div className="space-y-3 pt-4 border-t border-black/5">
            <span className="text-[11px] uppercase tracking-widest font-bold text-black/40 block flex items-center justify-between">
              <span>Artisan / SME</span>
              <span className="text-[9px] text-black/30 font-normal">{sellers.length} Ateliers</span>
            </span>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {sellers.map((seller) => {
                const isSelected = selectedSellers.includes(seller.id);
                const count = sellerCounts[seller.id] ?? 0;
                return (
                  <label
                    key={seller.id}
                    onClick={() => toggleSeller(seller.id)}
                    className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-[#F5F2ED] text-xs text-black/80 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-orange-700 border-orange-700 text-white'
                            : 'border-black/20 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={10} />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs ${isSelected ? 'font-bold text-black' : ''}`}>
                          {seller.name}
                        </span>
                        <span className="text-[9px] text-black/40">{seller.location}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-black/40 font-mono">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Frame Shapes */}
          <div className="space-y-3 pt-4 border-t border-black/5">
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
            <div className="flex flex-wrap gap-1.5">
              {allStyles.map((style) => {
                const isSelected = selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-orange-700 text-white border-orange-700 shadow-xs'
                        : 'bg-transparent text-black/70 border-black/15 hover:border-black'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Material Filter */}
          <div className="space-y-3 pt-4 border-t border-black/5">
            <span className="text-[11px] uppercase tracking-widest font-bold text-black/40 block">
              Handcrafted Material
            </span>
            <div className="space-y-1.5">
              {allMaterials.map((mat) => {
                const isSelected = selectedMaterials.includes(mat);
                const count = products.filter((p) => p.material.toLowerCase().includes(mat.toLowerCase())).length;
                return (
                  <label
                    key={mat}
                    onClick={() => toggleMaterial(mat)}
                    className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-[#F5F2ED] text-xs text-black/80 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-black border-black text-white' : 'border-black/20 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={9} />}
                      </div>
                      <span className={`text-[11px] ${isSelected ? 'font-bold text-black' : ''}`}>{mat}</span>
                    </div>
                    <span className="text-[9px] text-black/40 font-mono">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3 pt-4 border-t border-black/5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-widest font-bold text-black/40">
                Budget Ceiling
              </span>
              <span className="text-xs font-bold text-black">
                Rp {maxPrice.toLocaleString('id-ID')}
              </span>
            </div>
            <input
              type="range"
              min="200000"
              max="2000000"
              step="25000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-black/40">
              <span>Rp 200k (Entry)</span>
              <span>Rp 2.0M (Masterpiece)</span>
            </div>
          </div>

          {/* Find My Frame Callout */}
          <div className="p-4 bg-[#F5F2ED] rounded-2xl border border-black/5 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-orange-700 flex items-center gap-1">
              <Sparkles size={11} />
              AI Face Fit Advisor
            </span>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Scan your facial proportions and let Gemini match the ideal frame shape for your jawline.
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
                SHOWING {filteredProducts.length} HANDCRAFTED {filteredProducts.length === 1 ? 'FRAME' : 'FRAMES'}
              </p>
              <p className="text-[11px] text-black/50 mt-0.5">
                {activeFilterCount > 0
                  ? `Filtered across ${new Set(filteredProducts.map((p) => p.sellerId)).size} independent ateliers`
                  : `Curated across all ${sellers.length} Indonesian optical ateliers`}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-black/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AR Try-On & Spatial Fit Ready</span>
            </div>
          </div>

          {/* Grid of Product Cards */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
                No handcrafted frames match these filters
              </h3>
              <p className="text-xs sm:text-sm text-black/60 max-w-md mx-auto leading-relaxed">
                We couldn't find any artisan frames matching your current selection. Try resetting filters or exploring other regions.
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
                  View Eyeglasses (14)
                </button>
                <button
                  onClick={() => {
                    resetFilters();
                    setSelectedLocations(['Bali']);
                  }}
                  className="px-5 py-3 bg-[#F5F2ED] text-black rounded-full text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all cursor-pointer"
                >
                  View Bali Ateliers (3)
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

