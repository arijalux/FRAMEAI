import React, { useState, useEffect, Suspense, lazy } from 'react';
import { OpticalFrame, CartItem, Order, OrderStatus, FaceAnalysisResult, FrameShape, FrameMaterial, FaceShape } from './types';
import { INITIAL_FRAMES } from './data/initialFrames';
import {
  fetchCatalogFrames,
  fetchAllOrders,
  saveFrameToDb,
  updateOrderStatusInDb,
  checkIsAdmin,
  auth,
  loginWithGoogle,
  logoutUser,
  onAuthStateChanged,
  User,
} from './lib/firebase';
import { calculateFaceFrameMatchScore } from './utils/opticalMath';
import { formatRupiah, faceShapeLabel, frameShapeLabel, materialLabel } from './utils/format';

// Components
import { LazyThreeFrameCanvas } from './components/LazyThreeFrameCanvas';
import { LensConfiguratorModal } from './components/LensConfiguratorModal';
import { ShoppingBagDrawer } from './components/ShoppingBagDrawer';
import { UserSavedLooksModal } from './components/UserSavedLooksModal';
import CircularCarousel from './components/CircularCarousel';

// Secondary views are code-split so the catalog loads fast
const ARFaceTryOn = lazy(() => import('./components/ARFaceTryOn').then((m) => ({ default: m.ARFaceTryOn })));
const FrameComparisonBench = lazy(() =>
  import('./components/FrameComparisonBench').then((m) => ({ default: m.FrameComparisonBench }))
);
const AIFrameFinder = lazy(() => import('./components/AIFrameFinder').then((m) => ({ default: m.AIFrameFinder })));
const SellerOperationsPortal = lazy(() =>
  import('./components/SellerOperationsPortal').then((m) => ({ default: m.SellerOperationsPortal }))
);

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
  ArrowUpRight,
  LayoutGrid,
  Store,
  Plus,
  Shield,
  Sun,
  Flame,
} from 'lucide-react';

export default function App() {
  // Navigation View
  const [activeView, setActiveView] = useState<'home' | 'catalog' | 'ar_tryon' | '3d_studio' | 'compare' | 'finder' | 'seller'>('home');

  // Catalog & Frame State
  const [frames, setFrames] = useState<OpticalFrame[]>(INITIAL_FRAMES);
  const [selectedFrame, setSelectedFrame] = useState<OpticalFrame>(INITIAL_FRAMES[0]);
  // Starts empty: comparing begins from a frame the visitor picks in Koleksi
  const [comparedFrames, setComparedFrames] = useState<OpticalFrame[]>([]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [shapeFilter, setShapeFilter] = useState<string>('All');
  const [materialFilter, setMaterialFilter] = useState<string>('All');
  const [polarizedOnly, setPolarizedOnly] = useState<boolean>(false);
  // Unknown until the visitor picks a shape, runs the AI face scan or completes Cari dengan AI;
  // match scores are hidden until then rather than assuming a face shape
  const [userFaceShape, setUserFaceShape] = useState<FaceShape | null>(null);
  // Free-text question sent to Gemini from the navbar's AI search button
  const [aiQuery, setAiQuery] = useState<string>('');

  // AI & Modals
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysisResult | null>(null);
  const [isLensConfiguratorOpen, setIsLensConfiguratorOpen] = useState<boolean>(false);
  const [isBagOpen, setIsBagOpen] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);

  // Cart & Orders State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  // Orders placed by this visitor (shown in their vault) vs. every order (admin portal only)
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  // Auth User
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Load Catalog from Firestore
  useEffect(() => {
    fetchCatalogFrames().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setFrames(loaded);
        setSelectedFrame(loaded[0]);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setCurrentUser(usr);
      const admin = await checkIsAdmin(usr);
      setIsAdmin(admin);
      setAllOrders(admin ? await fetchAllOrders().catch(() => []) : []);
    });

    return () => unsubscribe();
  }, []);

  // Leave the merchant portal if the user signs out or is not an admin
  useEffect(() => {
    if (activeView === 'seller' && !isAdmin) setActiveView('catalog');
  }, [activeView, isAdmin]);

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
      // Best match first once we know the face shape; otherwise keep catalog order
      if (!userFaceShape) return 0;
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

  // Merchant portal writes: update the UI optimistically, roll back if Firestore rejects it
  const handleSaveFrame = async (updated: OpticalFrame, isNew: boolean) => {
    const previous = frames;
    setFrames((prev) => (isNew ? [updated, ...prev] : prev.map((f) => (f.id === updated.id ? updated : f))));
    try {
      await saveFrameToDb(updated);
    } catch (e) {
      console.error(e);
      setFrames(previous);
      alert('Frame gagal disimpan. Periksa akses admin Anda lalu coba lagi.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const previous = allOrders;
    setAllOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    try {
      await updateOrderStatusInDb(orderId, status);
    } catch (e) {
      console.error(e);
      setAllOrders(previous);
      alert('Status pesanan gagal diperbarui. Silakan coba lagi.');
    }
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

  // AR try-on and the 3D inspector start from a chosen frame (card buttons), so they aren't nav items
  const navItems: { view: typeof activeView; label: string }[] = [
    { view: 'catalog', label: 'Koleksi' },
    ...(isAdmin ? [{ view: 'seller' as const, label: 'Portal Toko' }] : []),
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans">
      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center shrink-0">
            <button onClick={() => setActiveView('home')} aria-label="Beranda frameai" className="flex items-center gap-2 text-left">
              <span className="w-8 h-8 rounded-full border-[1.5px] border-ink flex items-center justify-center">
                <Eye className="w-4 h-4 text-ink" />
              </span>
              <span className="hidden sm:inline text-xl font-medium tracking-[-0.04em] text-ink">frameai</span>
            </button>
          </div>

          {/* Search: Enter filters Koleksi; the AI button asks Gemini in natural language */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setActiveView('catalog');
            }}
            className="relative flex-1 max-w-xl"
          >
            <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Cari frame"
              placeholder="Cari frame, atau tanya AI..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView !== 'catalog' && e.target.value) setActiveView('catalog');
              }}
              className="w-full h-10 pl-10 pr-12 rounded-full bg-soft text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-ink [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              onClick={() => {
                setAiQuery(searchQuery.trim());
                setActiveView('finder');
              }}
              aria-label="Cari dengan AI"
              title={searchQuery.trim() ? 'Tanya AI tentang pencarian ini' : 'Cari dengan AI'}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink hover:bg-ink-soft text-white flex items-center justify-center transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center gap-2 shrink-0">
            {navItems.map((item) => {
              const Icon = item.view === 'seller' ? Store : LayoutGrid;
              return (
                <button
                  key={item.view}
                  onClick={() => setActiveView(item.view)}
                  aria-label={item.label}
                  title={item.label}
                  aria-current={activeView === item.view ? 'page' : undefined}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                    activeView === item.view ? 'border-ink bg-ink text-white' : 'border-line hover:bg-soft text-ink'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}

            <button
              onClick={() => setIsBagOpen(true)}
              aria-label="Buka Keranjang Belanja"
              className="relative w-9 h-9 rounded-full border border-line hover:bg-soft text-ink flex items-center justify-center transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-ink text-white text-[10px] font-medium flex items-center justify-center tabular-nums">
                  {cartItems.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={handleAuthAction}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full text-sm text-muted hover:text-ink whitespace-nowrap transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{currentUser ? currentUser.displayName || 'Akun' : 'Masuk'}</span>
            </button>
          </div>
        </div>

      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-10 space-y-12">
        <Suspense fallback={<div className="py-24 text-center text-sm text-faint">Memuat...</div>}>
        {/* VIEW 0: Landing page */}
        {activeView === 'home' && (
          <div className="space-y-24">
            {/* Hero */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-4 lg:pt-10">
              <div className="space-y-7">
                <h1 className="text-[2.4rem] md:text-6xl font-normal tracking-[-0.045em] leading-[1.04] text-ink">
                  Coba. Bandingkan. Pilih.
                  <br />
                  Kacamata yang pas, dibantu AI.
                </h1>

                <p className="text-lg text-muted leading-relaxed max-w-lg">
                  Jawab beberapa pertanyaan, scan wajahmu, dan biarkan Gemini memilihkan frame yang paling cocok. Lalu coba
                  langsung lewat kamera.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                    setAiQuery('');
                    setActiveView('finder');
                  }}
                    className="h-12 px-6 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Cari dengan AI
                  </button>
                  <button
                    onClick={() => setActiveView('catalog')}
                    className="h-12 px-6 rounded-full border border-line hover:border-ink text-ink text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Cari di katalog
                  </button>
                </div>

                <p className="text-xs text-muted">Gratis ongkir ke seluruh Indonesia. Garansi pas 30 hari.</p>
              </div>

              {/* 3D ring of catalog frames; clicking one opens its lens configurator */}
              <div className="relative h-[420px] sm:h-[520px] -mx-4 sm:mx-0 text-ink">
                <CircularCarousel
                  items={frames.map((f) => ({
                    src: f.imageUrl,
                    alt: f.name,
                    title: f.name,
                    subtitle: `${materialLabel(f.material)} · ${formatRupiah(f.price)}`,
                  }))}
                  preset="cylinder"
                  intro="rise"
                  cardWidth={220}
                  aspectRatio={0.8}
                  speed={14}
                  fadeColor="#ffffff"
                  innerShade={0.85}
                  cornerRadius={20}
                  captions
                  onItemClick={(_item, index) => {
                    setSelectedFrame(frames[index]);
                    setIsLensConfiguratorOpen(true);
                  }}
                />
              </div>
            </section>

            {/* Editorial statement */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end border-t border-line pt-16">
              <h2 className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.08] text-ink">
                Lebih sedikit menebak.
                <br />
                Lebih banyak yang pas.
              </h2>
              <div className="space-y-6 max-w-md md:justify-self-end">
                <p className="text-lg text-muted leading-relaxed">
                  Setiap frame diberi skor kecocokan dengan bentuk wajahmu, diukur dalam milimeter, dan bisa dicoba
                  langsung sebelum dipesan.
                </p>
                <button
                  onClick={() => setActiveView('catalog')}
                  className="h-12 px-6 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  Lihat koleksi
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 1: Catalog, focused on choosing frames */}
        {activeView === 'catalog' && (
          <div className="space-y-10">
            {/* Catalog */}
            <section className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">Koleksi</h2>
                  <p className="text-muted">
                    {userFaceShape
                      ? `${filteredFrames.length} frame, diurutkan dari yang paling cocok untuk wajah ${faceShapeLabel(userFaceShape).toLowerCase()}.`
                      : `${filteredFrames.length} frame. Pilih bentuk wajahmu untuk melihat skor kecocokan.`}
                  </p>
                </div>

                {/* Face shape: drives match scores and best-match sorting; tap again to clear */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-muted">Bentuk wajah</span>
                  <div className="flex gap-1 p-1 rounded-full bg-soft max-w-full overflow-x-auto no-scrollbar">
                    {(['Oval', 'Square', 'Round', 'Heart', 'Diamond'] as FaceShape[]).map((shape) => (
                      <button
                        key={shape}
                        onClick={() => setUserFaceShape((cur) => (cur === shape ? null : shape))}
                        aria-pressed={userFaceShape === shape}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-sm transition-all ${
                          userFaceShape === shape ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
                        }`}
                      >
                        {faceShapeLabel(shape)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                    setAiQuery('');
                    setActiveView('finder');
                  }}
                    className="flex items-center gap-1.5 text-sm text-sage hover:text-ink"
                  >
                    <Sparkles className="w-4 h-4" />
                    Belum tahu? Cari dengan AI
                  </button>
                </div>

                {/* Filters stay on one row; on phones the row scrolls sideways. Text search lives in the navbar. */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                  <select
                    aria-label="Filter frame berdasarkan bentuk"
                    value={shapeFilter}
                    onChange={(e) => setShapeFilter(e.target.value)}
                    className="shrink-0 h-10 px-4 rounded-full bg-soft text-sm text-ink focus:outline-none"
                  >
                    <option value="All">Semua bentuk</option>
                    <option value="Geometric">Geometris</option>
                    <option value="Square">Kotak</option>
                    <option value="Round">Bulat</option>
                    <option value="Aviator">Aviator</option>
                    <option value="Cat-Eye">Cat-Eye</option>
                    <option value="Oval">Oval</option>
                  </select>
                  <select
                    aria-label="Filter frame berdasarkan material"
                    value={materialFilter}
                    onChange={(e) => setMaterialFilter(e.target.value)}
                    className="shrink-0 h-10 px-4 rounded-full bg-soft text-sm text-ink focus:outline-none"
                  >
                    <option value="All">Semua material</option>
                    <option value="Aerospace Titanium">Titanium Aerospace</option>
                    <option value="Italian Acetate">Asetat Italia</option>
                    <option value="Eco-Polymer">Eko-Polimer</option>
                    <option value="Mixed Titanium Acetate">Kombinasi Titanium & Asetat</option>
                  </select>
                  <button
                    onClick={() => setPolarizedOnly((p) => !p)}
                    className={`shrink-0 h-10 px-4 rounded-full text-sm flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                      polarizedOnly ? 'bg-ink text-white' : 'bg-soft text-ink hover:bg-soft-strong'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Sun polarized
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFrames.map((frame, idx) => {
                  const match = userFaceShape ? calculateFaceFrameMatchScore(userFaceShape, frame.shape) : null;
                  // Rotate through the soft panel tints like an editorial grid
                  const tint = ['bg-sand', 'bg-mist', 'bg-sage-tint', 'bg-stone'][idx % 4];

                  return (
                    <article
                      key={frame.id}
                      className="group rounded-3xl border border-line bg-white overflow-hidden flex flex-col transition-shadow hover:shadow-float"
                    >
                      <div className={`relative ${tint} p-5 pb-0`}>
                        {match && (
                          <span className="inline-block mb-4 px-2.5 py-1 rounded-full bg-white/90 text-xs text-ink">
                            Cocok {match.score}%
                          </span>
                        )}
                        <div className="aspect-[4/3] rounded-t-2xl overflow-hidden shadow-card">
                          <img
                            src={frame.imageUrl}
                            alt={frame.name}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-xs text-muted">{materialLabel(frame.material)}</span>
                            <h3 className="text-xl font-normal tracking-[-0.03em] text-ink">{frame.name}</h3>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedFrame(frame);
                              setIsLensConfiguratorOpen(true);
                            }}
                            aria-label={`Atur lensa untuk ${frame.name}`}
                            className="shrink-0 w-10 h-10 rounded-full border border-line group-hover:bg-ink group-hover:text-white group-hover:border-ink text-ink flex items-center justify-center transition-colors"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {frame.colors.map((c) => (
                            <span
                              key={c.name}
                              title={c.name}
                              className="w-4 h-4 rounded-full ring-1 ring-black/10"
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                          <span className="ml-auto text-base tabular-nums text-ink">{formatRupiah(frame.price)}</span>
                        </div>

                        <div className="mt-auto pt-4 border-t border-line flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedFrame(frame);
                              setActiveView('ar_tryon');
                            }}
                            className="flex-1 h-10 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Camera className="w-4 h-4" />
                            Coba AR
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFrame(frame);
                              setActiveView('3d_studio');
                            }}
                            title="Lihat 3D"
                            aria-label={`Lihat ${frame.name} dalam 3D`}
                            className="w-10 h-10 rounded-full border border-line hover:border-ink text-ink flex items-center justify-center transition-colors"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAddToCompare(frame)}
                            title="Bandingkan"
                            aria-label={`Bandingkan ${frame.name}`}
                            className="w-10 h-10 rounded-full border border-line hover:border-ink text-ink flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Shortcut back to the comparison once frames have been added from Koleksi */}
        {activeView === 'catalog' && comparedFrames.length > 0 && (
          <button
            onClick={() => setActiveView('compare')}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 h-12 pl-5 pr-2 rounded-full bg-ink text-white text-sm font-medium shadow-float flex items-center gap-3"
          >
            Bandingkan {comparedFrames.length} frame
            <span className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </button>
        )}

        {/* VIEW 2: Real-time Live AR Try-On */}
        {activeView === 'ar_tryon' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">Cermin Fitting Augmented Reality</h2>
                <p className="text-xs text-muted">
                  Pelacakan titik wajah terkalibrasi lewat kamera live atau foto model.
                </p>
              </div>
              <button
                onClick={() => setActiveView('catalog')}
                className="px-4 py-2 rounded-full bg-white border border-line text-xs text-body hover:text-ink"
              >
                Kembali ke Katalog
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
                <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">Inspeksi Optik 3D Presisi</h2>
                <p className="text-xs text-muted">
                  Putar 360°, periksa engsel titanium, ganti lapisan lensa, dan lihat dimensi dalam milimeter.
                </p>
              </div>
              <button
                onClick={() => setActiveView('catalog')}
                className="px-4 py-2 rounded-full bg-white border border-line text-xs text-body hover:text-ink"
              >
                Kembali ke Katalog
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <LazyThreeFrameCanvas
                  frame={selectedFrame}
                  selectedColor={selectedFrame.colors[0]}
                  lensTint="clear"
                />
              </div>

              <div className="lg:col-span-4 rounded-3xl bg-white border border-line p-6 space-y-6">
                <div>
                  <span className="text-[10px] font-medium text-sage">
                    Spesifikasi Optik
                  </span>
                  <h3 className="font-normal tracking-[-0.03em] text-2xl text-ink mt-1">{selectedFrame.name}</h3>
                  <p className="text-xs text-muted mt-1">{selectedFrame.description}</p>
                </div>

                <div className="space-y-2 text-xs border-y border-line py-4 tabular-nums">
                  <div className="flex justify-between text-body">
                    <span>Bentuk:</span>
                    <span className="text-ink font-sans">{frameShapeLabel(selectedFrame.shape)}</span>
                  </div>
                  <div className="flex justify-between text-body">
                    <span>Material:</span>
                    <span className="text-ink font-sans">{materialLabel(selectedFrame.material)}</span>
                  </div>
                  <div className="flex justify-between text-body">
                    <span>Berat:</span>
                    <span className="text-ink">{selectedFrame.weightGrams} gram</span>
                  </div>
                  <div className="flex justify-between text-body">
                    <span>Lebar Lensa:</span>
                    <span className="text-ink">{selectedFrame.dimensions.lensWidth} mm</span>
                  </div>
                  <div className="flex justify-between text-body">
                    <span>Lebar Bridge:</span>
                    <span className="text-ink">{selectedFrame.dimensions.bridgeWidth} mm</span>
                  </div>
                  <div className="flex justify-between text-body">
                    <span>Lebar Total:</span>
                    <span className="text-ink">{selectedFrame.dimensions.totalWidth} mm</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setIsLensConfiguratorOpen(true)}
                    className="w-full py-3 px-4 rounded-full bg-ink hover:bg-ink-soft text-white font-medium text-xs flex items-center justify-center gap-2 shadow-card transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Atur Lensa Resep ({formatRupiah(selectedFrame.price)})
                  </button>

                  <button
                    onClick={() => setActiveView('ar_tryon')}
                    className="w-full py-3 px-4 rounded-full bg-soft-strong hover:bg-line-strong text-ink font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-sage" />
                    Coba dengan AR Live
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
            onAddFrame={(f) => setComparedFrames((prev) => (prev.some((p) => p.id === f.id) ? prev : [...prev, f]))}
            onBrowseCatalog={() => setActiveView('catalog')}
            onRemoveFrame={handleRemoveFromCompare}
            onSelectFrameForTryOn={(f) => {
              setSelectedFrame(f);
              setActiveView('ar_tryon');
            }}
            onConfigureLenses={(f) => {
              setSelectedFrame(f);
              setIsLensConfiguratorOpen(true);
            }}
            userFaceShape={userFaceShape ?? undefined}
          />
        )}

        {/* VIEW 5: Cari dengan AI (questionnaire → face scan → Gemini picks) */}
        {activeView === 'finder' && (
          <AIFrameFinder
            key={aiQuery || 'guided'}
            aiQuery={aiQuery || undefined}
            frames={frames}
            faceAnalysis={faceAnalysis}
            onScanResult={(res) => {
              setFaceAnalysis(res);
              setUserFaceShape(res.faceShape);
            }}
            onPickFaceShape={(shape) => setUserFaceShape(shape)}
            onSelectFrameForTryOn={(f) => {
              setSelectedFrame(f);
              setActiveView('ar_tryon');
            }}
            onConfigureLenses={(f) => {
              setSelectedFrame(f);
              setIsLensConfiguratorOpen(true);
            }}
          />
        )}

        {/* VIEW 6: Merchant Portal */}
        {activeView === 'seller' && isAdmin && (
          <SellerOperationsPortal
            frames={frames}
            orders={allOrders}
            onUpdateFrameStock={(id, newStock) => {
              const frame = frames.find((f) => f.id === id);
              if (frame) handleSaveFrame({ ...frame, stock: newStock }, false);
            }}
            onAddNewFrame={(newFrame) => handleSaveFrame(newFrame, true)}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-line">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-sm text-muted">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full border-[1.5px] border-ink flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-ink" />
            </span>
            <span className="text-lg font-medium tracking-[-0.04em] text-ink">frameai</span>
            <span className="ml-2">Kacamata yang pas, dibantu AI. © 2026</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button onClick={() => setActiveView('home')} className="hover:text-ink transition-colors">
              Beranda
            </button>
            {navItems.map((item) => (
              <button key={item.view} onClick={() => setActiveView(item.view)} className="hover:text-ink transition-colors">
                {item.label}
              </button>
            ))}
            <button onClick={() => {
                    setAiQuery('');
                    setActiveView('finder');
                  }} className="hover:text-ink transition-colors">
              Cari dengan AI
            </button>
            <button onClick={() => setIsVaultOpen(true)} className="hover:text-ink transition-colors">
              Look & pesanan saya
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
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
          setMyOrders((prev) => [newOrder, ...prev]);
          if (isAdmin) setAllOrders((prev) => [newOrder, ...prev]);
          setCartItems([]);
        }}
      />

      <UserSavedLooksModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        orders={myOrders}
      />
    </div>
  );
}
