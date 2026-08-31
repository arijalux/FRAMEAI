import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ui/ProductCard';
import { FrameViewer } from '../components/ui/FrameViewer';
import {
  Sparkles,
  ArrowRight,
  Eye,
  Camera,
  Layers,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Heart,
  ShoppingBag,
} from 'lucide-react';
import { FrameShape, FrameStyle } from '../types';

export const Home: React.FC = () => {
  const { navigate, products, sellers, addToCart, toggleWishlist, isWishlisted } = useApp();

  const spotlightProducts = products.length > 0 ? products.slice(0, 6) : [];
  const [heroCardIndex, setHeroCardIndex] = useState(0);
  const [cardDirection, setCardDirection] = useState(1);
  const [isHeroAutoPlay, setIsHeroAutoPlay] = useState(true);

  const currentHeroProduct = spotlightProducts[heroCardIndex] || products[0];
  const nextProductPreview = spotlightProducts[(heroCardIndex + 1) % spotlightProducts.length];
  const nextNextProductPreview = spotlightProducts[(heroCardIndex + 2) % spotlightProducts.length];

  // Auto rotate cards every 5s if user is not hovering
  useEffect(() => {
    if (!isHeroAutoPlay || spotlightProducts.length <= 1) return;
    const timer = setInterval(() => {
      setCardDirection(1);
      setHeroCardIndex((prev) => (prev + 1) % spotlightProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHeroAutoPlay, spotlightProducts.length]);

  const handleNextHeroCard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (spotlightProducts.length <= 1) return;
    setCardDirection(1);
    setHeroCardIndex((prev) => (prev + 1) % spotlightProducts.length);
  };

  const handlePrevHeroCard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (spotlightProducts.length <= 1) return;
    setCardDirection(-1);
    setHeroCardIndex((prev) => (prev - 1 + spotlightProducts.length) % spotlightProducts.length);
  };

  const handleSelectHeroCard = (index: number) => {
    if (index === heroCardIndex) return;
    setCardDirection(index > heroCardIndex ? 1 : -1);
    setHeroCardIndex(index);
  };

  // Trending Frames Formula: trendScore = (views * 0.1) + (tryOns * 0.4) + (wishlists * 0.2) + (purchases * 1.0)
  const trendingProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Sort all products by calculated trend score
    const scored = [...products].map((p) => {
      const v = p.views ?? 1000;
      const t = p.tryOns ?? 300;
      const w = p.wishlists ?? 100;
      const b = p.purchases ?? 50;
      const calculatedScore = p.trendScore || (v * 0.1 + t * 0.4 + w * 0.2 + b * 1.0);
      return { product: p, score: calculatedScore };
    });

    scored.sort((a, b) => b.score - a.score);

    // Pick top products with SME diversity (1 per unique SME first, then remaining top)
    const selected: typeof products = [];
    const seenSellers = new Set<string>();

    for (const item of scored) {
      if (!seenSellers.has(item.product.sellerId) && selected.length < 8) {
        seenSellers.add(item.product.sellerId);
        selected.push(item.product);
      }
    }

    // If still less than 8, fill with next top scored products
    for (const item of scored) {
      if (selected.length >= 8) break;
      if (!selected.some((p) => p.id === item.product.id)) {
        selected.push(item.product);
      }
    }

    return selected;
  }, [products]);

  // Carousel state for Trending Handcrafted Frames
  const [trendingIndex, setTrendingIndex] = useState(0);
  const [artisanIndex, setArtisanIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 640) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(4);
      }
    };
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const maxTrendingIndex = Math.max(0, trendingProducts.length - cardsPerView);
  const maxArtisanIndex = Math.max(0, sellers.length - cardsPerView);

  const handleNextTrending = () => {
    setTrendingIndex((prev) => (prev >= maxTrendingIndex ? 0 : prev + 1));
  };

  const handlePrevTrending = () => {
    setTrendingIndex((prev) => (prev <= 0 ? maxTrendingIndex : prev - 1));
  };

  const handleNextArtisan = () => {
    setArtisanIndex((prev) => (prev >= maxArtisanIndex ? 0 : prev + 1));
  };

  const handlePrevArtisan = () => {
    setArtisanIndex((prev) => (prev <= 0 ? maxArtisanIndex : prev - 1));
  };

  const shapes: { shape: FrameShape; desc: string; iconShape: FrameShape }[] = [
    { shape: 'Rectangle', desc: 'Balances round & oval curves', iconShape: 'Rectangle' },
    { shape: 'Round', desc: 'Softens square & angular lines', iconShape: 'Round' },
    { shape: 'Browline', desc: 'Elevates intellectual presence', iconShape: 'Browline' },
    { shape: 'Cat-Eye', desc: 'Lifts cheekbones with elegance', iconShape: 'Cat-Eye' },
    { shape: 'Aviator', desc: 'Timeless double bridge statement', iconShape: 'Aviator' },
    { shape: 'Geometric', desc: 'Faceted architectural edges', iconShape: 'Geometric' },
  ];

  const styles: { style: FrameStyle; tag: string; bg: string }[] = [
    { style: 'Minimal', tag: 'Pure lines & weightless titanium', bg: 'bg-[#EFECE6]' },
    { style: 'Professional', tag: 'Commanding boardroom presence', bg: 'bg-[#E8E4DE]' },
    { style: 'Casual', tag: 'Effortless everyday comfort', bg: 'bg-[#F2EEE9]' },
    { style: 'Vintage', tag: 'Hand-carved teak & mid-century acetates', bg: 'bg-[#E5DFD7]' },
    { style: 'Bold', tag: 'Dramatic silhouettes & rich colors', bg: 'bg-[#EFE8DF]' },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION - Stitch Clean Minimalism Architecture */}
      <section className="relative pt-6 sm:pt-12 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 pr-0 lg:pr-6">
              <div className="flex items-center gap-3 mb-6 text-black/50 text-xs sm:text-sm tracking-widest uppercase font-semibold">
                <div className="w-10 sm:w-12 h-px bg-black/20"></div>
                <span>SME Eyewear Marketplace</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-[76px] xl:text-[84px] leading-[0.95] sm:leading-[0.9] font-serif font-light mb-8 tracking-tight text-[#1A1A1A]">
                Find the frame <br />
                that fits your <span className="italic font-normal">face</span> <br />
                and your <span className="italic font-normal text-orange-700">style.</span>
              </h1>

              <p className="text-base sm:text-lg text-black/65 max-w-lg mb-10 leading-relaxed font-normal">
                Discover handcrafted eyewear from Indonesian artisans. Our AI analyzes your facial structure and personal aesthetics for the perfect stylistic match.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate('/find-my-frame')}
                  className="px-8 sm:px-10 py-4 sm:py-5 bg-[#1A1A1A] text-white rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  id="hero-find-frame-btn"
                >
                  <Sparkles size={16} />
                  <span>Find My Frame</span>
                </button>

                <button
                  onClick={() => navigate('/explore')}
                  className="px-8 sm:px-10 py-4 sm:py-5 border border-black/20 bg-transparent rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-white transition-all cursor-pointer"
                  id="hero-explore-btn"
                >
                  Explore Frames
                </button>
              </div>

              {/* Artisan Locations Footnote */}
              <div className="mt-12 pt-8 border-t border-black/10 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-black/50">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Active Ateliers:</span>
                <span className="text-black/80 font-medium">Bandung • Yogyakarta • Surabaya • Denpasar • Jakarta • Malang • Semarang • Solo</span>
              </div>
            </div>

            {/* Right Showcase Column - Interactive Floating Motion Card Stack */}
            <div
              className="lg:col-span-5 relative flex items-center justify-center py-6 sm:py-8 my-2 sm:my-4 select-none"
              onMouseEnter={() => setIsHeroAutoPlay(false)}
              onMouseLeave={() => setIsHeroAutoPlay(true)}
              id="hero-card-container"
            >
              {/* Back Card Stack Layer 2 */}
              {nextNextProductPreview && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[390px] sm:max-w-[430px] h-[500px] sm:h-[540px] bg-[#E2DDD5] rounded-[40px] rotate-3 blur-[0.5px] scale-[0.92] transition-all duration-500 hidden sm:block pointer-events-none -z-20 opacity-60 shadow-sm"
                  aria-hidden="true"
                />
              )}

              {/* Back Card Stack Layer 1 */}
              {nextProductPreview && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[410px] sm:max-w-[450px] h-[515px] sm:h-[555px] bg-[#E8E4DE] rounded-[40px] -rotate-3 transition-transform hover:rotate-0 duration-700 hidden sm:block pointer-events-none -z-10 shadow-md"
                  aria-hidden="true"
                />
              )}

              {/* Main White Card with AnimatePresence Motion */}
              <div className="relative w-full max-w-[420px] sm:max-w-[460px] min-h-[530px] sm:min-h-[570px] z-10">
                <AnimatePresence mode="wait" custom={cardDirection}>
                  {currentHeroProduct && (
                    <motion.div
                      key={currentHeroProduct.id}
                      custom={cardDirection}
                      initial={(dir: number) => ({
                        opacity: 0,
                        x: dir > 0 ? 50 : -50,
                        scale: 0.94,
                        rotate: dir > 0 ? 2 : -2,
                      })}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        rotate: 0,
                        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                      }}
                      exit={(dir: number) => ({
                        opacity: 0,
                        x: dir > 0 ? -50 : 50,
                        scale: 0.94,
                        rotate: dir > 0 ? -2 : 2,
                        transition: { duration: 0.25, ease: 'easeIn' },
                      })}
                      className="w-full min-h-[530px] sm:min-h-[570px] h-full bg-white rounded-[36px] sm:rounded-[40px] shadow-2xl p-6 sm:p-8 flex flex-col justify-between border border-black/5"
                    >
                      {/* Card Header & Switcher Controls */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-orange-700 block">
                              Spotlight Artisan
                            </span>
                            <span className="text-[10px] text-black/30 font-bold">•</span>
                            <span className="text-[10px] font-mono font-bold text-black/40">
                              {String(heroCardIndex + 1).padStart(2, '0')}/{String(spotlightProducts.length).padStart(2, '0')}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-black/75 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="text-orange-700" />
                            {currentHeroProduct.sellerLocation}, Indonesia
                          </span>
                        </div>

                        {/* Interactive Next & Prev Switcher */}
                        <div className="flex items-center gap-1.5 bg-[#F5F2ED] p-1 rounded-full border border-black/5">
                          <button
                            onClick={(e) => handlePrevHeroCard(e)}
                            className="w-7 h-7 rounded-full bg-white hover:bg-black hover:text-white text-black/70 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                            title="Previous Frame"
                            aria-label="Previous Frame"
                            type="button"
                            id="hero-card-prev-btn"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            onClick={(e) => handleNextHeroCard(e)}
                            className="w-7 h-7 rounded-full bg-white hover:bg-black hover:text-white text-black/70 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                            title="Next Frame"
                            aria-label="Next Frame"
                            type="button"
                            id="hero-card-next-btn"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Card Canvas Visual */}
                      <div className="flex-grow flex flex-col items-center justify-center py-2">
                        <div
                          onClick={() => navigate(`/product/${currentHeroProduct.id}`)}
                          className="w-full h-44 sm:h-48 bg-[#F5F2ED] rounded-3xl flex items-center justify-center overflow-hidden relative group cursor-pointer border border-black/5"
                        >
                          <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 bg-white/90 backdrop-blur-xs rounded-full text-[9px] font-bold tracking-wider text-black uppercase border border-black/5">
                            {currentHeroProduct.material}
                          </div>

                          <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 backdrop-blur-[2px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/try-on/${currentHeroProduct.id}`);
                              }}
                              className="bg-white hover:bg-black hover:text-white text-black px-5 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase shadow-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye size={13} />
                              <span>Try in AR</span>
                            </button>
                          </div>

                          {/* Frame Visual Display */}
                          <div className="text-8xl opacity-10 font-serif select-none absolute">FRAME</div>
                          <FrameViewer
                            shape={currentHeroProduct.frameShape}
                            colorHex="#1A1A1A"
                            width={280}
                            height={140}
                            scale={1.05}
                          />
                        </div>

                        <div className="mt-4 text-center">
                          <h2
                            onClick={() => navigate(`/product/${currentHeroProduct.id}`)}
                            className="text-2xl sm:text-3xl font-serif mb-1 italic text-black hover:text-orange-700 transition-colors cursor-pointer"
                          >
                            {currentHeroProduct.name}
                          </h2>
                          <p className="text-xs sm:text-sm text-black/50 mb-1.5">
                            Crafted by <span className="font-semibold text-black/70">{currentHeroProduct.sellerName}</span>
                          </p>
                          <p className="text-lg sm:text-xl font-medium tracking-tight text-black font-serif">
                            Rp {currentHeroProduct.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Card Dots Indicator */}
                      <div className="flex items-center justify-center gap-1.5 py-1.5">
                        {spotlightProducts.map((p, idx) => (
                          <button
                            key={p.id}
                            onClick={() => handleSelectHeroCard(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              idx === heroCardIndex
                                ? 'w-6 bg-orange-700'
                                : 'w-1.5 bg-black/15 hover:bg-black/30'
                            }`}
                            aria-label={`Lihat frame ${idx + 1}`}
                            type="button"
                          />
                        ))}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex gap-2.5 pt-3 border-t border-black/5">
                        <button
                          onClick={() => toggleWishlist(currentHeroProduct.id)}
                          className={`flex-1 h-12 flex items-center justify-center gap-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                            isWishlisted(currentHeroProduct.id)
                              ? 'bg-orange-700 text-white shadow-xs'
                              : 'bg-[#F5F2ED] text-black hover:bg-black/10'
                          }`}
                          type="button"
                        >
                          <Heart size={13} className={isWishlisted(currentHeroProduct.id) ? 'fill-white text-white' : ''} />
                          <span>{isWishlisted(currentHeroProduct.id) ? 'Saved' : 'Wishlist'}</span>
                        </button>

                        <button
                          onClick={() => addToCart(currentHeroProduct)}
                          className="flex-[2] h-12 flex items-center justify-center gap-1.5 bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xs cursor-pointer"
                          type="button"
                        >
                          <ShoppingBag size={14} />
                          <span>Add To Cart</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING FRAMES CAROUSEL */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-orange-700 flex items-center gap-1.5 mb-2">
              <Sparkles size={14} />
              Curated Eyewear
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif italic text-[#1A1A1A]">Trending Handcrafted Frames</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Carousel Navigation Controls */}
            {trendingProducts.length > cardsPerView && (
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-black/10 shadow-2xs">
                <button
                  onClick={handlePrevTrending}
                  className="w-8 h-8 rounded-full bg-[#F5F2ED] hover:bg-black hover:text-white text-black/70 flex items-center justify-center transition-all cursor-pointer"
                  title="Previous frame"
                  aria-label="Previous frame"
                  type="button"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[11px] font-mono font-bold text-black/50 px-2 select-none">
                  {trendingIndex + 1}–{Math.min(trendingIndex + cardsPerView, trendingProducts.length)} / {trendingProducts.length}
                </span>
                <button
                  onClick={handleNextTrending}
                  className="w-8 h-8 rounded-full bg-[#F5F2ED] hover:bg-black hover:text-white text-black/70 flex items-center justify-center transition-all cursor-pointer"
                  title="Next frame"
                  aria-label="Next frame"
                  type="button"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <button
              onClick={() => navigate('/explore')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/70 hover:text-black transition-colors"
            >
              <span>View All ({products.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Carousel Viewport Window (showing 4 cards on desktop) */}
        <div className="relative overflow-hidden w-full pb-2">
          <div
            className="flex transition-transform duration-500 ease-out gap-6"
            style={{
              transform: `translateX(calc(-${trendingIndex} * ( (100% + 24px) / ${cardsPerView} )))`,
            }}
          >
            {trendingProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  width: `calc((100% - ${(cardsPerView - 1) * 24}px) / ${cardsPerView})`,
                }}
                className="shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        {trendingProducts.length > cardsPerView && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: maxTrendingIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setTrendingIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  trendingIndex === idx
                    ? 'w-6 bg-black'
                    : 'w-2 bg-black/20 hover:bg-black/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
                type="button"
              />
            ))}
          </div>
        )}
      </section>

      {/* SHOP BY FRAME SHAPE */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest font-bold text-black/40 mb-2 block">
            Optical Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif italic mb-3">Shop by Frame Shape</h2>
          <p className="text-sm text-black/60">
            Every facial geometry is complemented by distinct frame contours. Explore the signatures.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {shapes.map((item) => (
            <div
              key={item.shape}
              onClick={() => navigate(`/explore?shape=${item.shape}`)}
              className="bg-white rounded-3xl p-5 border border-black/5 text-center flex flex-col items-center justify-between hover:shadow-lg hover:border-black/20 hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="w-full h-24 bg-[#F5F2ED] rounded-2xl flex items-center justify-center mb-3 group-hover:bg-[#EFECE6] transition-colors">
                <FrameViewer shape={item.iconShape} colorHex="#1A1A1A" width={110} height={60} />
              </div>
              <h3 className="font-serif italic text-base text-black mb-1">{item.shape}</h3>
              <p className="text-[10px] text-black/50 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VIRTUAL TRY-ON AR PROMOTION BANNER */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="bg-[#1A1A1A] text-white rounded-[40px] p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest">
                <Camera size={13} className="text-orange-400" />
                <span>Interactive Mirror & AR</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-serif font-light leading-tight">
                Try frames instantly with your <span className="italic text-orange-400">camera.</span>
              </h2>

              <p className="text-sm sm:text-base text-white/70 max-w-lg leading-relaxed">
                Experience real-time virtual fitting. Adjust bridge widths, compare two artisan frames side-by-side, switch colorways, and take high-resolution snapshots.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => navigate('/try-on/frame-the-architect')}
                  className="px-8 py-4 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all flex items-center gap-2 shadow-lg"
                >
                  <Eye size={15} />
                  <span>Launch Virtual Try-On</span>
                </button>

                <button
                  onClick={() => navigate('/compare')}
                  className="px-8 py-4 border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Layers size={15} />
                  <span>Compare Specs</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[340px] aspect-[3/4] bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-between text-center backdrop-blur-xs">
                <div className="w-full flex justify-between text-[10px] uppercase font-bold tracking-widest text-white/40">
                  <span>Live Facial Tracker</span>
                  <span className="text-emerald-400 flex items-center gap-1">● 60 FPS</span>
                </div>

                <div className="relative w-44 h-44 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center my-4">
                  <FrameViewer shape="Rectangle" colorHex="#FFFFFF" width={180} height={90} />
                  <div className="absolute inset-x-0 h-0.5 bg-orange-500/80 animate-pulse"></div>
                </div>

                <div className="text-xs text-white/80">
                  <p className="font-serif italic text-sm text-white">The Architect (Onyx Black)</p>
                  <p className="text-[11px] text-white/50">Optik Melati • Bandung</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL INDONESIAN SME SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-orange-700 mb-2 block">
              Heritage & Craftsmanship
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif italic text-[#1A1A1A]">Indonesian Artisan Spotlight</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Carousel Navigation Controls */}
            {sellers.length > cardsPerView && (
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-black/10 shadow-2xs">
                <button
                  onClick={handlePrevArtisan}
                  className="w-8 h-8 rounded-full bg-[#F5F2ED] hover:bg-black hover:text-white text-black/70 flex items-center justify-center transition-all cursor-pointer"
                  title="Previous atelier"
                  aria-label="Previous atelier"
                  type="button"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[11px] font-mono font-bold text-black/50 px-2 select-none">
                  {artisanIndex + 1}–{Math.min(artisanIndex + cardsPerView, sellers.length)} / {sellers.length}
                </span>
                <button
                  onClick={handleNextArtisan}
                  className="w-8 h-8 rounded-full bg-[#F5F2ED] hover:bg-black hover:text-white text-black/70 flex items-center justify-center transition-all cursor-pointer"
                  title="Next atelier"
                  aria-label="Next atelier"
                  type="button"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <button
              onClick={() => navigate('/explore')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/70 hover:text-black transition-colors"
            >
              <span>All {sellers.length} Ateliers</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Carousel Viewport Window (showing 4 cards on desktop) */}
        <div className="relative overflow-hidden w-full pb-2">
          <div
            className="flex transition-transform duration-500 ease-out gap-6"
            style={{
              transform: `translateX(calc(-${artisanIndex} * ( (100% + 24px) / ${cardsPerView} )))`,
            }}
          >
            {sellers.map((seller) => (
              <div
                key={seller.id}
                style={{
                  width: `calc((100% - ${(cardsPerView - 1) * 24}px) / ${cardsPerView})`,
                }}
                className="shrink-0"
              >
                <div
                  onClick={() => navigate(`/store/${seller.id}`)}
                  className="bg-white rounded-[32px] p-6 border border-black/5 hover:shadow-xl hover:border-black/20 transition-all cursor-pointer flex flex-col justify-between group h-full"
                >
                  <div>
                    <div className="relative h-40 rounded-2xl overflow-hidden mb-4">
                      <img
                        src={seller.bannerImage}
                        alt={seller.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 bg-black/80 backdrop-blur-md text-white rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={11} className="text-orange-400" />
                        <span>{seller.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={seller.avatar}
                        alt={seller.name}
                        className="w-10 h-10 rounded-full object-cover border border-black/10 shrink-0"
                      />
                      <div>
                        <h3 className="font-serif italic text-base sm:text-lg text-black group-hover:text-orange-700 transition-colors line-clamp-1">
                          {seller.name}
                        </h3>
                        <p className="text-[11px] text-black/50">Est. {seller.foundedYear} • {seller.specialty}</p>
                      </div>
                    </div>

                    <p className="text-xs text-black/65 leading-relaxed mb-4 line-clamp-2">
                      {seller.shortDescription || seller.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs font-semibold text-black/70">
                    <span className="text-[11px]">{seller.productCount} Designs</span>
                    <span className="text-orange-700 flex items-center gap-1 text-[11px] group-hover:translate-x-1 transition-transform">
                      Visit Store <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        {sellers.length > cardsPerView && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: maxArtisanIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setArtisanIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  artisanIndex === idx
                    ? 'w-6 bg-black'
                    : 'w-2 bg-black/20 hover:bg-black/40'
                }`}
                aria-label={`Go to atelier slide ${idx + 1}`}
                type="button"
              />
            ))}
          </div>
        )}
      </section>

      {/* HOW FIND MY FRAME WORKS */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="bg-[#EAE6DF] rounded-[40px] p-8 sm:p-14 border border-black/5">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-bold text-black/40 mb-2 block">
              Four-Step AI Styling Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif italic mb-3">How FRAMEAI Works</h2>
            <p className="text-sm text-black/60">
              We bridge traditional Indonesian optical handcraft with intelligent facial styling algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Share Your Style',
                desc: 'Select your preferred vibe (Minimal, Vintage, Bold) and daily usage scenarios.',
              },
              {
                step: '02',
                title: 'AI Facial Scan',
                desc: 'Upload a selfie or allow camera capture for facial proportion and contour analysis.',
              },
              {
                step: '03',
                title: 'Virtual Try-On',
                desc: 'See realistic virtual frames on your face with millimeter scale calibration.',
              },
              {
                step: '04',
                title: 'Artisan Delivery',
                desc: 'Handcrafted by Indonesian SMEs with prescription fitting delivered to your door.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-3xl p-6 border border-black/5 flex flex-col justify-between">
                <div>
                  <span className="text-3xl font-serif italic text-orange-700 font-bold block mb-3">
                    {item.step}
                  </span>
                  <h3 className="font-serif italic text-lg text-black mb-2">{item.title}</h3>
                  <p className="text-xs text-black/60 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/find-my-frame')}
              className="px-10 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md inline-flex items-center gap-2"
            >
              <Sparkles size={14} />
              <span>Begin Find My Frame</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
