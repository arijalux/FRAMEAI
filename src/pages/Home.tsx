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
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Heart,
  ShoppingBag,
  Sliders,
  CheckCircle2,
  Compass,
  TreeDeciduous,
  Hammer,
  Leaf,
  ScanFace,
} from 'lucide-react';
import { FrameShape } from '../types';

export const Home: React.FC = () => {
  const { navigate, products, addToCart, toggleWishlist, isWishlisted } = useApp();

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

  // Trending Frames
  const trendingProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const scored = [...products].map((p) => {
      const v = p.views ?? 1000;
      const t = p.tryOns ?? 300;
      const w = p.wishlists ?? 100;
      const b = p.purchases ?? 50;
      const calculatedScore = p.trendScore || (v * 0.1 + t * 0.4 + w * 0.2 + b * 1.0);
      return { product: p, score: calculatedScore };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => item.product).slice(0, 10);
  }, [products]);

  // Carousel state for Trending Frames
  const [trendingIndex, setTrendingIndex] = useState(0);
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

  const handleNextTrending = () => {
    setTrendingIndex((prev) => (prev >= maxTrendingIndex ? 0 : prev + 1));
  };

  const handlePrevTrending = () => {
    setTrendingIndex((prev) => (prev <= 0 ? maxTrendingIndex : prev - 1));
  };

  const shapes: { shape: FrameShape; desc: string; iconShape: FrameShape }[] = [
    { shape: 'Rectangle', desc: 'Balances round & oval curves', iconShape: 'Rectangle' },
    { shape: 'Round', desc: 'Softens square & angular lines', iconShape: 'Round' },
    { shape: 'Browline', desc: 'Elevates intellectual presence', iconShape: 'Browline' },
    { shape: 'Cat-Eye', desc: 'Lifts cheekbones with elegance', iconShape: 'Cat-Eye' },
    { shape: 'Aviator', desc: 'Timeless double bridge statement', iconShape: 'Aviator' },
    { shape: 'Geometric', desc: 'Faceted architectural edges', iconShape: 'Geometric' },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION - BJ HOMEMADE */}
      <section className="relative pt-6 sm:pt-12 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 pr-0 lg:pr-6">
              <div className="flex items-center gap-3 mb-6 text-black/60 text-xs sm:text-sm tracking-widest uppercase font-semibold">
                <div className="w-10 sm:w-12 h-px bg-black/20"></div>
                <span className="flex items-center gap-1.5">
                  <TreeDeciduous size={14} className="text-orange-800" />
                  Handcrafted Wooden Eyewear
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-[72px] xl:text-[80px] leading-[0.95] sm:leading-[0.92] font-serif font-light mb-8 tracking-tight text-[#1A1A1A]">
                CRAFTED BY HAND. <br />
                DISCOVERED WITH <span className="italic font-normal text-orange-800">AI.</span>
              </h1>

              <p className="text-base sm:text-lg text-black/70 max-w-lg mb-10 leading-relaxed font-normal">
                Explore handcrafted wooden eyewear from BJ Homemade and find the frame that fits your style through AI-powered recommendations and AR virtual try-on.
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
                  Explore Collection
                </button>
              </div>

              {/* Brand Commitments Strip */}
              <div className="mt-12 pt-8 border-t border-black/10 flex flex-wrap items-center gap-4 sm:gap-8 text-xs text-black/60">
                <div className="flex items-center gap-2">
                  <TreeDeciduous size={14} className="text-orange-800" />
                  <span className="font-semibold text-black/80">Natural Wood Grains</span>
                </div>
                <div className="flex items-center gap-2">
                  <Camera size={14} className="text-orange-800" />
                  <span className="font-semibold text-black/80">AR Webcam Fitting</span>
                </div>
                <div className="flex items-center gap-2">
                  <ScanFace size={14} className="text-orange-800" />
                  <span className="font-semibold text-black/80">Gemini AI Styling</span>
                </div>
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
                        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                      }}
                      exit={(dir: number) => ({
                        opacity: 0,
                        x: dir > 0 ? -50 : 50,
                        scale: 0.94,
                        rotate: dir > 0 ? -2 : 2,
                        transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] },
                      })}
                      className="w-full bg-white rounded-[40px] p-6 sm:p-8 shadow-xl border border-black/5 flex flex-col justify-between"
                      id="hero-featured-card"
                    >
                      {/* Card Header & Controls */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-amber-50 text-amber-950 rounded-full border border-amber-200/60">
                          Handcrafted Wood
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handlePrevHeroCard}
                            className="w-8 h-8 rounded-full bg-[#F5F2ED] hover:bg-black hover:text-white text-black/70 flex items-center justify-center transition-colors cursor-pointer"
                            title="Previous frame"
                            aria-label="Previous frame"
                            type="button"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            onClick={handleNextHeroCard}
                            className="w-8 h-8 rounded-full bg-[#F5F2ED] hover:bg-black hover:text-white text-black/70 flex items-center justify-center transition-colors cursor-pointer"
                            title="Next frame"
                            aria-label="Next frame"
                            type="button"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Frame Visual Display */}
                      <div className="my-6">
                        <div
                          onClick={() => navigate(`/product/${currentHeroProduct.id}`)}
                          className="w-full h-48 sm:h-56 bg-[#F5F2ED] rounded-3xl flex items-center justify-center overflow-hidden cursor-pointer group relative p-4"
                        >
                          {currentHeroProduct.thumbnail ? (
                            <img
                              src={currentHeroProduct.thumbnail}
                              alt={currentHeroProduct.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.dataset.triedFallback) {
                                  target.dataset.triedFallback = 'true';
                                  target.src = '/images/products/product-01-teak-rect-main.svg';
                                }
                              }}
                            />
                          ) : (
                            <FrameViewer
                              shape={currentHeroProduct.frameShape}
                              colorHex="#1A1A1A"
                              width={280}
                              height={140}
                              scale={1.05}
                            />
                          )}
                        </div>

                        <div className="mt-4 text-center">
                          <h2
                            onClick={() => navigate(`/product/${currentHeroProduct.id}`)}
                            className="text-2xl sm:text-3xl font-serif mb-1 italic text-black hover:text-orange-800 transition-colors cursor-pointer"
                          >
                            {currentHeroProduct.name}
                          </h2>
                          <p className="text-xs sm:text-sm text-black/50 mb-1.5">
                            {currentHeroProduct.frameShape} • {currentHeroProduct.material}
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
                                ? 'w-6 bg-orange-800'
                                : 'w-1.5 bg-black/15 hover:bg-black/30'
                            }`}
                            aria-label={`View frame ${idx + 1}`}
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
                              ? 'bg-orange-800 text-white shadow-xs'
                              : 'bg-[#F5F2ED] text-black hover:bg-black/10'
                          }`}
                          type="button"
                        >
                          <Heart size={13} className={isWishlisted(currentHeroProduct.id) ? 'fill-white text-white' : ''} />
                          <span>{isWishlisted(currentHeroProduct.id) ? 'Saved' : 'Wishlist'}</span>
                        </button>

                        <button
                          onClick={() => addToCart(currentHeroProduct)}
                          className="flex-[2] h-12 flex items-center justify-center gap-1.5 bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-orange-800 transition-all shadow-xs cursor-pointer"
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

      {/* BRAND STORY SECTION - THE CRAFT BEHIND THE FRAME */}
      <section id="story" className="max-w-7xl mx-auto px-6 sm:px-12 scroll-mt-24">
        <div className="bg-[#EAE5DC] rounded-[40px] p-8 sm:p-14 border border-black/5 relative overflow-hidden space-y-12">
          {/* Header & Story Narrative */}
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black text-white text-[11px] font-bold uppercase tracking-widest">
              <TreeDeciduous size={13} className="text-orange-400" />
              <span>Our Story • BJ Homemade</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif font-light tracking-tight text-[#1A1A1A] leading-tight">
              Crafted by hand. <br />
              <span className="italic font-normal text-orange-800">Rooted in natural wood and thoughtful design.</span>
            </h2>

            <p className="text-base sm:text-lg text-black/80 font-serif italic leading-relaxed">
              BJ Homemade is an independent Indonesian eyewear studio dedicated to the art of handcrafted wooden frames.
            </p>

            <p className="text-sm sm:text-base text-black/70 leading-relaxed">
              Eyewear sits closer to your personal expression than almost any other object you wear. At BJ Homemade, we craft frames that celebrate the organic texture, grain patterns, warmth, and tactile presence of natural timber. We combine traditional benchcraft with AI-driven discovery and augmented reality, giving you confidence that your chosen frame complements your face.
            </p>
          </div>

          {/* 4 Pillars of Craftsmanship */}
          <div className="space-y-6">
            <div className="border-b border-black/10 pb-3">
              <span className="text-xs uppercase tracking-widest font-bold text-orange-800 block mb-1">
                Core Philosophy
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif italic text-black">The Pillars Behind Every Frame</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/95 rounded-3xl p-6 border border-black/5 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center">
                  <Hammer size={20} />
                </div>
                <h4 className="font-serif italic text-xl text-black">Handcrafted Character</h4>
                <p className="text-xs text-black/70 leading-relaxed">
                  Every frame carries the direct touch of bench craftsmanship. Cut, shaped, filed, and hand-finished individually, ensuring that the character of the making process lives in every subtle contour.
                </p>
              </div>

              <div className="bg-white/95 rounded-3xl p-6 border border-black/5 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center">
                  <TreeDeciduous size={20} />
                </div>
                <h4 className="font-serif italic text-xl text-black">Wooden Material</h4>
                <p className="text-xs text-black/70 leading-relaxed">
                  We work with natural woods including Indonesian Teak, Sonokeling (Rosewood), and Bamboo. Wood offers distinct lightness, natural tactile warmth against the temple, and unique grain lines that make every frame genuinely one of a kind.
                </p>
              </div>

              <div className="bg-white/95 rounded-3xl p-6 border border-black/5 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center">
                  <Compass size={20} />
                </div>
                <h4 className="font-serif italic text-xl text-black">Local Indonesian Craft</h4>
                <p className="text-xs text-black/70 leading-relaxed">
                  BJ Homemade is an independent Indonesian enterprise committed to thoughtful craftsmanship. We believe local artisan production delivers world-class optical ergonomics and distinctive modern silhouettes.
                </p>
              </div>

              <div className="bg-white/95 rounded-3xl p-6 border border-black/5 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center">
                  <Leaf size={20} />
                </div>
                <h4 className="font-serif italic text-xl text-black">Responsible Design</h4>
                <p className="text-xs text-black/70 leading-relaxed">
                  We apply natural plant-oil sealants and organic beeswax polishes to protect the timber while preserving its breathability. Thoughtful assembly, repairable barrel hinges, and durable finishes ensure each pair is built to last.
                </p>
              </div>
            </div>
          </div>

          {/* Timber Spec & Finish Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-white/70 border border-black/5 space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-orange-900">Javanese Teak (Jati)</span>
              <p className="text-xs text-black/70 leading-relaxed">
                Known for golden honey hues, tight interlocking grain, and natural oils that resist humidity and daily wear.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/70 border border-black/5 space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-orange-900">Sonokeling Rosewood</span>
              <p className="text-xs text-black/70 leading-relaxed">
                Deep rich chocolate and violet grain lines, exceptional structural density, and ultra-smooth tactile finish.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/70 border border-black/5 space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-orange-900">Organic Beeswax Polish</span>
              <p className="text-xs text-black/70 leading-relaxed">
                Protected with botanical oils and raw Indonesian beeswax. Completely hypoallergenic and skin-friendly.
              </p>
            </div>
          </div>

          {/* Technology & Craftsmanship Harmony */}
          <div className="bg-[#1C1917] text-white rounded-[32px] p-8 sm:p-10 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-orange-400">
              <Sparkles size={14} />
              <span>Technology & Benchcraft Fusion</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-serif italic">
              Modern Fitting with Digital Precision
            </h3>

            <p className="text-xs sm:text-sm text-white/70 max-w-2xl leading-relaxed">
              Buying handcrafted wooden frames online used to come with uncertainty about face fit and proportional harmony. We bridge this gap directly: discover frames suited to your facial geometry with intelligent AI styling, try them on live with interactive webcam AR, and order directly from our Indonesian workshop.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/find-my-frame')}
                className="px-6 py-3 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 hover:text-white transition-all cursor-pointer shadow-xs"
              >
                Find My Frame (AI)
              </button>
              <button
                onClick={() => navigate('/try-on/frame-uluwatu')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
              >
                Open AR Mirror
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="px-6 py-3 border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
              >
                Browse Collection
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS - BJ HOMEMADE COLLECTION */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-orange-800 flex items-center gap-1.5 mb-2">
              <Sparkles size={14} />
              Handcrafted Catalogue
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif italic text-[#1A1A1A]">BJ Homemade Collection</h2>
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
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/70 hover:text-black transition-colors cursor-pointer"
            >
              <span>View All Frames ({products.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Carousel Viewport Window */}
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
            Optical Geometries
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

      {/* VIRTUAL TRY-ON AR PROMOTION CALLOUT */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="bg-[#1C1917] text-white rounded-[40px] p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest">
                <Camera size={13} className="text-orange-400" />
                <span>Real-Time AR Mirror</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-serif font-light leading-tight">
                Try BJ Homemade <br />
                <span className="italic text-orange-400">in AR.</span>
              </h2>

              <p className="text-sm sm:text-base text-white/70 max-w-lg leading-relaxed">
                See how handcrafted wooden frames look on your face before ordering. Experience real-time virtual fitting with proportion tracking, bridge alignment, and side-by-side comparison.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => navigate('/try-on/frame-the-architect')}
                  className="px-8 py-4 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 hover:text-white transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Eye size={15} />
                  <span>Try On Now</span>
                </button>

                <button
                  onClick={() => navigate('/compare')}
                  className="px-8 py-4 border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Layers size={15} />
                  <span>Compare Specs</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[340px] aspect-[3/4] bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-between text-center backdrop-blur-xs">
                <div className="w-full flex justify-between text-[10px] uppercase font-bold tracking-widest text-white/40">
                  <span>Live Face Mesh</span>
                  <span className="text-emerald-400 flex items-center gap-1">● 60 FPS</span>
                </div>

                <div className="relative w-44 h-44 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center my-4">
                  <FrameViewer shape="Rectangle" colorHex="#FFFFFF" width={180} height={90} />
                  <div className="absolute inset-x-0 h-0.5 bg-orange-500/80 animate-pulse"></div>
                </div>

                <div className="text-xs text-white/80">
                  <p className="font-serif italic text-sm text-white">The Architect (Teak & Sonokeling)</p>
                  <p className="text-[11px] text-white/50">BJ Homemade • Handcrafted Wooden Eyewear</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="bg-[#EAE6DF] rounded-[40px] p-8 sm:p-14 border border-black/5">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-bold text-black/40 mb-2 block">
              Four-Step Shopping Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif italic mb-3">How It Works</h2>
            <p className="text-sm text-black/60">
              Discover, virtually try, compare, and order authentic BJ Homemade wooden frames through one seamless digital experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Share Your Style',
                desc: 'Select your design preferences (Minimal, Classic, Bold) and daily optical requirements.',
              },
              {
                step: '02',
                title: 'AI Facial Analysis',
                desc: 'Gemini AI evaluates facial geometry, jawline contours, and bridge dimensions.',
              },
              {
                step: '03',
                title: 'AR Virtual Mirror',
                desc: 'Try BJ Homemade wooden frames live on your camera with realistic scale and perspective.',
              },
              {
                step: '04',
                title: 'Handcrafted Delivery',
                desc: 'Your custom-fitted frame is prepared and dispatched with a protective wooden case to your address.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-3xl p-6 border border-black/5 flex flex-col justify-between">
                <div>
                  <span className="text-3xl font-serif italic text-orange-800 font-bold block mb-3">
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
              className="px-10 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-800 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Begin AI Assessment</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
