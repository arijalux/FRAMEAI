import React, { useState, useEffect } from 'react';
import { OpticalFrame, CartItem, Order, FaceAnalysisResult, FrameShape, FrameMaterial, FaceShape } from './types';
import { INITIAL_FRAMES } from './data/initialFrames';
import { fetchCatalogFrames, auth, loginWithGoogle, logoutUser, onAuthStateChanged, User } from './lib/firebase';
import { calculateFaceFrameMatchScore } from './utils/opticalMath';

// Components
import { ThreeFrameCanvas, LensTint } from './components/ThreeFrameCanvas';
import { ARFaceTryOn } from './components/ARFaceTryOn';
import { AIFaceAnalyzerModal } from './components/AIFaceAnalyzerModal';
import { LensConfiguratorModal } from './components/LensConfiguratorModal';
import { FrameComparisonBench } from './components/FrameComparisonBench';
import { FindMyFrameQuiz } from './components/FindMyFrameQuiz';
import { ShoppingBagDrawer } from './components/ShoppingBagDrawer';
import { SellerOperationsPortal } from './components/SellerOperationsPortal';
import { UserSavedLooksModal } from './components/UserSavedLooksModal';

// Icons
import {
  Sparkles,
  Camera,
  ShoppingBag,
  SlidersHorizontal,
  Eye,
  Sliders,
  Check,
  Search,
  Filter,
  User as UserIcon,
  HelpCircle,
  Layers,
  ArrowRight,
  Shield,
  Sun,
  Flame,
  Award,
} from 'lucide-react';

export default function App() {
  // Navigation View
  const [activeView, setActiveView] = useState<'catalog' | 'ar_tryon' | '3d_studio' | 'compare' | 'quiz' | 'seller'>('catalog');

  // Catalog & Frame State
  const [frames, setFrames] = useState<OpticalFrame[]>(INITIAL_FRAMES);
  const [selectedFrame, setSelectedFrame] = useState<OpticalFrame>(INITIAL_FRAMES[0]);
  const [comparedFrames, setComparedFrames] = useState<OpticalFrame[]>([INITIAL_FRAMES[0], INITIAL_FRAMES[1], INITIAL_FRAMES[2]]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [shapeFilter, setShapeFilter] = useState<string>('All');
  const [materialFilter, setMaterialFilter] = useState<string>('All');
  const [polarizedOnly, setPolarizedOnly] = useState<boolean>(false);
  const [userFaceShape, setUserFaceShape] = useState<FaceShape>('Oval');

  // AI & Modals
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysisResult | null>(null);
  const [isFaceAnalyzerOpen, setIsFaceAnalyzerOpen] = useState<boolean>(false);
  const [isLensConfiguratorOpen, setIsLensConfiguratorOpen] = useState<boolean>(false);
  const [isBagOpen, setIsBagOpen] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);

  // Cart & Orders State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-729401',
      userId: 'customer-init',
      customerName: 'Claire Beaumont',
      customerEmail: 'claire.b@luxury.fr',
      items: [
        {
          id: 'item-demo-1',
          frame: INITIAL_FRAMES[0],
          selectedColor: INITIAL_FRAMES[0].colors[0],
          lensConfig: {
            type: 'single_vision',
            index: '1.67_ultrathin',
            blueLightFilter: true,
            photochromic: false,
            antiReflective: true,
          },
          calculatedPrice: 475,
          quantity: 1,
        },
      ],
      totalAmount: 514.18,
      status: 'crafting_lenses',
      shippingAddress: {
        address: '14 Rue du Faubourg Saint-Honoré',
        city: 'Paris',
        postalCode: '75008',
        country: 'France',
      },
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // Auth User
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load Catalog from Firestore
  useEffect(() => {
    fetchCatalogFrames().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setFrames(loaded);
        setSelectedFrame(loaded[0]);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
    });

    return () => unsubscribe();
  }, []);

  // Filtered frames
  const filteredFrames = frames
    .filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.material.toLowerCase().includes(searchQuery.toLowerCase());
      const matchShape = shapeFilter === 'All' || f.shape === shapeFilter;
      const matchMat = materialFilter === 'All' || f.material === materialFilter;
      const matchPolarized = !polarizedOnly || f.isPolarized;
      return matchSearch && matchShape && matchMat && matchPolarized;
    })
    .sort((a, b) => {
      // Sort by face shape match synergy
      const scoreA = calculateFaceFrameMatchScore(userFaceShape, a.shape).score;
      const scoreB = calculateFaceFrameMatchScore(userFaceShape, b.shape).score;
      return scoreB - scoreA;
    });

  // Cart operations
  const handleAddToCart = (frame: OpticalFrame, color: any, lensConfig: any, totalPrice: number) => {
    const newItem: CartItem = {
      id: 'cart-' + Date.now(),
      frame,
      selectedColor: color,
      lensConfig,
      calculatedPrice: totalPrice,
      quantity: 1,
    };
    setCartItems((prev) => [...prev, newItem]);
    setIsBagOpen(true);
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateCartQuantity = (id: string, qty: number) => {
    setCartItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity: qty } : it)));
  };

  // Compare Bench
  const handleAddToCompare = (frame: OpticalFrame) => {
    if (comparedFrames.some((f) => f.id === frame.id)) return;
    if (comparedFrames.length >= 4) {
      setComparedFrames([...comparedFrames.slice(1), frame]);
    } else {
      setComparedFrames([...comparedFrames, frame]);
    }
    setActiveView('compare');
  };

  const handleRemoveFromCompare = (frameId: string) => {
    setComparedFrames((prev) => prev.filter((f) => f.id !== frameId));
  };

  // Auth toggle
  const handleAuthAction = async () => {
    if (currentUser) {
      await logoutUser();
    } else {
      try {
        await loginWithGoogle();
      } catch (e) {
        console.warn('Google sign-in popup closed or cancelled:', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-neutral-950 via-amber-950/40 to-neutral-950 border-b border-neutral-800/60 py-2 px-4 text-center text-xs tracking-wider font-medium text-neutral-300 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Complimentary Worldwide Insured Delivery · 30-Day Flawless Optical Fit Guarantee</span>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveView('catalog')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Eye className="w-5 h-5 text-neutral-950 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-serif font-bold text-xl tracking-wider text-white flex items-center gap-1">
                  Frame<span className="text-amber-400 font-sans font-black">AI</span>
                </span>
                <span className="text-[10px] tracking-widest uppercase text-neutral-400 block -mt-1 font-mono">
                  Optical Studio
                </span>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-neutral-900/60 p-1 rounded-2xl border border-neutral-800/80 text-xs font-semibold">
              <button
                onClick={() => setActiveView('catalog')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  activeView === 'catalog' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Collection
              </button>
              <button
                onClick={() => setActiveView('ar_tryon')}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeView === 'ar_tryon' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Live AR Studio
              </button>
              <button
                onClick={() => setActiveView('3d_studio')}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeView === '3d_studio' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                3D Inspector
              </button>
              <button
                onClick={() => setActiveView('compare')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  activeView === 'compare' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Compare ({comparedFrames.length})
              </button>
              <button
                onClick={() => setActiveView('quiz')}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeView === 'quiz' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Find My Frame
              </button>
              <button
                onClick={() => setActiveView('seller')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  activeView === 'seller' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Store Portal
              </button>
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Face Scan Trigger Button */}
            <button
              onClick={() => setIsFaceAnalyzerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Face Scan</span>
              {faceAnalysis && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Saved Looks Vault */}
            <button
              onClick={() => setIsVaultOpen(true)}
              title="Saved Looks & Orders Vault"
              aria-label="Saved Looks Vault"
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 transition-colors"
            >
              <Award className="w-4 h-4" />
            </button>

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsBagOpen(true)}
              aria-label="Open Shopping Bag"
              className="relative p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-neutral-950 font-bold text-[10px] flex items-center justify-center font-mono shadow-md">
                  {cartItems.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>

            {/* User Profile / Auth Button */}
            <button
              onClick={handleAuthAction}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
              <span>{currentUser ? currentUser.displayName || 'Account' : 'Sign In'}</span>
            </button>
          </div>
        </div>

        {/* Mobile View Subnav */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto pt-3 border-t border-neutral-800/80 mt-2 text-xs">
          <button
            onClick={() => setActiveView('catalog')}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeView === 'catalog' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'}`}
          >
            Collection
          </button>
          <button
            onClick={() => setActiveView('ar_tryon')}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeView === 'ar_tryon' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'}`}
          >
            AR Try-On
          </button>
          <button
            onClick={() => setActiveView('3d_studio')}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeView === '3d_studio' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'}`}
          >
            3D Studio
          </button>
          <button
            onClick={() => setActiveView('compare')}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeView === 'compare' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'}`}
          >
            Compare
          </button>
          <button
            onClick={() => setActiveView('quiz')}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeView === 'quiz' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'}`}
          >
            Quiz
          </button>
          <button
            onClick={() => setActiveView('seller')}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeView === 'seller' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'}`}
          >
            Seller Portal
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 space-y-12">
        {/* VIEW 1: Catalog View */}
        {activeView === 'catalog' && (
          <div className="space-y-10">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-amber-950/20 border border-neutral-800/80 p-8 md:p-14 shadow-2xl">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Intelligent Eyewear Discovery & Virtual Fitting
                </div>

                <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                  Haute Optique, Calibrated by AI.
                </h1>

                <p className="text-sm md:text-base text-neutral-300 leading-relaxed font-light">
                  Experience real-time AR try-on, Gemini facial geometry analysis, and aerospace-grade materials
                  engineered to harmonize with your distinctive facial contours.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    onClick={() => setIsFaceAnalyzerOpen(true)}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-xl shadow-amber-500/15 transition-all hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4" />
                    Instant Face Shape Scan
                  </button>
                  <button
                    onClick={() => setActiveView('ar_tryon')}
                    className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs flex items-center gap-2 border border-neutral-700 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    Launch AR Mirror
                  </button>
                </div>
              </div>

              {/* Face Shape Preset Quick Selectors */}
              <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-wrap items-center gap-3">
                <span className="text-xs text-neutral-400 font-medium">Harmonize for Face Shape:</span>
                {(['Oval', 'Square', 'Round', 'Heart', 'Diamond'] as FaceShape[]).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setUserFaceShape(shape)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      userFaceShape === shape
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                        : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by silhouette, material, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    aria-label="Filter frames by shape"
                    value={shapeFilter}
                    onChange={(e) => setShapeFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200"
                  >
                    <option value="All">All Silhouettes</option>
                    <option value="Geometric">Geometric</option>
                    <option value="Square">Square</option>
                    <option value="Round">Round</option>
                    <option value="Aviator">Aviator</option>
                    <option value="Cat-Eye">Cat-Eye</option>
                    <option value="Oval">Oval</option>
                  </select>

                  <select
                    aria-label="Filter frames by material"
                    value={materialFilter}
                    onChange={(e) => setMaterialFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200"
                  >
                    <option value="All">All Materials</option>
                    <option value="Aerospace Titanium">Aerospace Titanium</option>
                    <option value="Italian Acetate">Italian Acetate</option>
                    <option value="Eco-Polymer">Eco-Polymer</option>
                    <option value="Mixed Titanium Acetate">Mixed Titanium Acetate</option>
                  </select>

                  <button
                    onClick={() => setPolarizedOnly((p) => !p)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      polarizedOnly ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Polarized Sun Only
                  </button>
                </div>
              </div>
            </div>

            {/* Optical Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFrames.map((frame) => {
                const match = calculateFaceFrameMatchScore(userFaceShape, frame.shape);

                return (
                  <div
                    key={frame.id}
                    className="group rounded-3xl bg-neutral-900 border border-neutral-800/80 hover:border-amber-500/50 p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5"
                  >
                    <div>
                      {/* Image Preview with Floating Badges */}
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-950 mb-4">
                        <img
                          src={frame.imageUrl}
                          alt={frame.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Top Left Match Score Badge */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-950/80 backdrop-blur-md text-amber-400 border border-amber-500/30">
                          {match.score}% {userFaceShape} Match
                        </div>

                        {/* Top Right Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                          {frame.isBestseller && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950 uppercase tracking-wider">
                              Bestseller
                            </span>
                          )}
                          {frame.isNew && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-neutral-950 uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>

                        {/* Color Swatch Dots */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 p-1 rounded-full bg-neutral-950/70 backdrop-blur-sm border border-neutral-800">
                          {frame.colors.map((c) => (
                            <span
                              key={c.name}
                              title={c.name}
                              className="w-3.5 h-3.5 rounded-full border border-white/20"
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Frame Identity */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif font-bold text-white text-lg group-hover:text-amber-400 transition-colors">
                            {frame.name}
                          </h3>
                          <p className="text-xs text-neutral-400">{frame.material}</p>
                        </div>
                        <span className="font-mono font-bold text-base text-amber-400">${frame.price}</span>
                      </div>

                      {/* Technical Dimension Pills */}
                      <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-neutral-400">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800">
                          {frame.dimensions.lensWidth}□{frame.dimensions.bridgeWidth}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800">
                          {frame.weightGrams}g
                        </span>
                        <span className="text-neutral-500">{frame.shape}</span>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="mt-5 pt-3 border-t border-neutral-800/80 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedFrame(frame);
                            setActiveView('ar_tryon');
                          }}
                          className="py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          AR Try-On
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFrame(frame);
                            setActiveView('3d_studio');
                          }}
                          className="py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-neutral-400" />
                          3D Inspect
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedFrame(frame);
                            setIsLensConfiguratorOpen(true);
                          }}
                          className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lenses
                        </button>
                        <button
                          onClick={() => handleAddToCompare(frame)}
                          className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          Compare +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: Real-time Live AR Try-On */}
        {activeView === 'ar_tryon' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-white">Augmented Reality Fitting Mirror</h2>
                <p className="text-xs text-neutral-400">
                  Calibrated facial landmark tracking over live camera or high-fashion model presets.
                </p>
              </div>
              <button
                onClick={() => setActiveView('catalog')}
                className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white"
              >
                Back to Catalog
              </button>
            </div>

            <ARFaceTryOn
              frames={frames}
              activeFrame={selectedFrame}
              onSelectFrame={setSelectedFrame}
              userPd={faceAnalysis?.estimatedPd || 63}
            />
          </div>
        )}

        {/* VIEW 3: Interactive 3D Frame Inspection Studio */}
        {activeView === '3d_studio' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-white">3D Precision Optical Inspector</h2>
                <p className="text-xs text-neutral-400">
                  Rotate 360°, inspect titanium hinges, toggle lens coatings, and calibrate millimeter dimensions.
                </p>
              </div>
              <button
                onClick={() => setActiveView('catalog')}
                className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white"
              >
                Back to Catalog
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <ThreeFrameCanvas
                  frame={selectedFrame}
                  selectedColor={selectedFrame.colors[0]}
                  lensTint="clear"
                />
              </div>

              <div className="lg:col-span-4 rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Optical Specifications
                  </span>
                  <h3 className="font-serif font-bold text-2xl text-white mt-1">{selectedFrame.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1">{selectedFrame.description}</p>
                </div>

                <div className="space-y-2 text-xs border-y border-neutral-800 py-4 font-mono">
                  <div className="flex justify-between text-neutral-300">
                    <span>Shape:</span>
                    <span className="text-white font-sans">{selectedFrame.shape}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Material:</span>
                    <span className="text-white font-sans">{selectedFrame.material}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Weight:</span>
                    <span className="text-white">{selectedFrame.weightGrams} grams</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Lens Width:</span>
                    <span className="text-white">{selectedFrame.dimensions.lensWidth} mm</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Bridge Distance:</span>
                    <span className="text-white">{selectedFrame.dimensions.bridgeWidth} mm</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Total Width:</span>
                    <span className="text-white">{selectedFrame.dimensions.totalWidth} mm</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setIsLensConfiguratorOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Configure Prescription Lenses (${selectedFrame.price})
                  </button>

                  <button
                    onClick={() => setActiveView('ar_tryon')}
                    className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    Try On in Live AR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: Comparison Bench */}
        {activeView === 'compare' && (
          <FrameComparisonBench
            allFrames={frames}
            comparedFrames={comparedFrames}
            onAddFrame={(f) => setComparedFrames([...comparedFrames, f])}
            onRemoveFrame={handleRemoveFromCompare}
            onSelectFrameForTryOn={(f) => {
              setSelectedFrame(f);
              setActiveView('ar_tryon');
            }}
            onConfigureLenses={(f) => {
              setSelectedFrame(f);
              setIsLensConfiguratorOpen(true);
            }}
            userFaceShape={userFaceShape}
          />
        )}

        {/* VIEW 5: Smart Quiz */}
        {activeView === 'quiz' && (
          <FindMyFrameQuiz
            frames={frames}
            onSelectFrameForTryOn={(f) => {
              setSelectedFrame(f);
              setActiveView('ar_tryon');
            }}
            onConfigureLenses={(f) => {
              setSelectedFrame(f);
              setIsLensConfiguratorOpen(true);
            }}
            onCompleteQuiz={(detected) => setUserFaceShape(detected)}
          />
        )}

        {/* VIEW 6: Merchant Portal */}
        {activeView === 'seller' && (
          <SellerOperationsPortal
            frames={frames}
            orders={orders}
            onUpdateFrameStock={(id, newStock) => {
              setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, stock: newStock } : f)));
            }}
            onAddNewFrame={(newFrame) => {
              setFrames((prev) => [newFrame, ...prev]);
            }}
            onUpdateOrderStatus={(id, status) => {
              setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800 bg-neutral-950 py-10 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Eye className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-white tracking-wider">FrameAI Atelier</span>
            <span>© 2026 FrameAI Inc. All optical algorithms certified.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setActiveView('catalog')} className="hover:text-white transition-colors">
              Collection
            </button>
            <button onClick={() => setActiveView('ar_tryon')} className="hover:text-white transition-colors">
              Virtual AR Try-On
            </button>
            <button onClick={() => setActiveView('compare')} className="hover:text-white transition-colors">
              Geometry Bench
            </button>
            <button onClick={() => setActiveView('seller')} className="hover:text-white transition-colors">
              Merchant Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <AIFaceAnalyzerModal
        isOpen={isFaceAnalyzerOpen}
        onClose={() => setIsFaceAnalyzerOpen(false)}
        frames={frames}
        onApplyAnalysis={(res) => {
          setFaceAnalysis(res);
          setUserFaceShape(res.faceShape);
        }}
        onSelectFrameForTryOn={(f) => {
          setSelectedFrame(f);
          setActiveView('ar_tryon');
        }}
      />

      <LensConfiguratorModal
        frame={selectedFrame}
        isOpen={isLensConfiguratorOpen}
        onClose={() => setIsLensConfiguratorOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <ShoppingBagDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveCartItem}
        onUpdateQuantity={handleUpdateCartQuantity}
        onOrderPlaced={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
          setCartItems([]);
        }}
      />

      <UserSavedLooksModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        orders={orders}
      />
    </div>
  );
}
