import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, FrameShape, FrameStyle, SellerStructuredInsight, Order } from '../types';
import { generateSellerDemandInsights } from '../services/geminiService';
import {
  Store,
  TrendingUp,
  Package,
  QrCode,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Download,
  Printer,
  CheckCircle2,
  DollarSign,
  Users,
  Layers,
  MapPin,
  ArrowUpRight,
  Lightbulb,
  BarChart3,
  ClipboardList,
  Truck,
  CreditCard,
  User,
  Clock,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Calendar,
  Box,
  Ruler,
  Scan,
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

export const SellerDashboard: React.FC = () => {
  const {
    products,
    sellerAnalytics,
    addProduct,
    deleteProduct,
    updateProduct,
    sellers,
    user,
    currentUser,
    isAuthenticated,
    openAuthModalWithRedirect,
    loginDemoAccount,
    upgradeToSeller,
    navigate,
    currentPath,
    orders,
    updateOrderStatus,
  } = useApp();

  // Onboarding / Register Atelier form state for customer accounts
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingCity, setOnboardingCity] = useState('Bandung');
  const [onboardingSpecialty, setOnboardingSpecialty] = useState('Handcrafted Acetate Eyewear');
  const [onboardingStory, setOnboardingStory] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);

  const currentSeller =
    sellers.find((s) => s.id === user.sellerId) ||
    sellers[0] || {
      id: 'optik-melati',
      name: 'Optik Melati Bandung',
      location: 'Bandung',
      province: 'Jawa Barat',
    };

  type TabType = 'analytics' | 'products' | 'orders' | 'ar-display' | 'ai-insights';
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [structuredInsights, setStructuredInsights] = useState<SellerStructuredInsight[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    const clean = (currentPath || '').toString().split('?')[0];
    if (clean === '/seller/catalog') setActiveTab('products');
    else if (clean === '/seller/orders') setActiveTab('orders');
    else if (clean === '/seller/ar-display' || clean === '/seller/qr') setActiveTab('ar-display');
    else if (clean === '/seller/ai-advisory' || clean === '/seller/ai-insights') setActiveTab('ai-insights');
    else if (clean === '/seller' || clean === '/seller/dashboard') setActiveTab('analytics');
  }, [currentPath]);

  // Handle Tab Switch & Update URL
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'analytics') navigate('/seller');
    else if (tab === 'products') navigate('/seller/catalog');
    else if (tab === 'orders') navigate('/seller/orders');
    else if (tab === 'ar-display') navigate('/seller/ar-display');
    else if (tab === 'ai-insights') navigate('/seller/ai-advisory');
  };

  // New Frame Form State
  const [newFrameName, setNewFrameName] = useState('');
  const [newFrameShape, setNewFrameShape] = useState<FrameShape>('Rectangle');
  const [newFrameMaterial, setNewFrameMaterial] = useState('Italian Acetate');
  const [newFramePrice, setNewFramePrice] = useState<number>(1450000);
  const [newFrameStock, setNewFrameStock] = useState<number>(12);
  const [newFrameWeight, setNewFrameWeight] = useState<number>(18);
  const [newFrameDesc, setNewFrameDesc] = useState('');
  const [newFrameImageUrl, setNewFrameImageUrl] = useState(
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80'
  );

  // QR Code Frame Selection
  const [selectedQrProduct, setSelectedQrProduct] = useState<Product>(
    products[0] || {
      id: 'frame-default',
      name: 'The Architect',
      material: 'Italian Acetate',
      price: 1450000,
      sellerLocation: 'Bandung',
      sellerName: 'Optik Melati',
      thumbnail: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
      frameShape: 'Rectangle',
    } as Product
  );

  // Load AI Insights
  const fetchAiInsights = async () => {
    setLoadingAi(true);
    const insights = await generateSellerDemandInsights(products, sellerAnalytics, currentSeller.name);
    setStructuredInsights(insights);
    setLoadingAi(false);
  };

  useEffect(() => {
    if (activeTab === 'ai-insights' && structuredInsights.length === 0) {
      fetchAiInsights();
    }
  }, [activeTab]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFrameName.trim()) return;

    const newProd: Product = {
      id: `frame-${Date.now()}`,
      slug: newFrameName.toLowerCase().replace(/\s+/g, '-'),
      name: newFrameName,
      category: 'Eyeglasses',
      sellerId: currentSeller.id,
      sellerName: currentSeller.name,
      sellerLocation: currentSeller.location,
      price: Number(newFramePrice),
      description: newFrameDesc || 'Handcrafted frame constructed with optical precision.',
      frameShape: newFrameShape,
      frameColors: [
        { name: 'Onyx Black', hex: '#1A1A1A' },
        { name: 'Amber Tortoise', hex: '#8B4513' },
      ],
      defaultColor: 'Onyx Black',
      material: newFrameMaterial,
      style: ['Minimal', 'Professional'],
      bestForFaceShapes: ['Oval', 'Round', 'Square'],
      usage: ['Everyday', 'Work'],
      dimensions: {
        lensWidth: 50,
        bridgeWidth: 19,
        templeLength: 145,
        frameWidth: 138,
        lensHeight: 40,
      },
      weightGrams: Number(newFrameWeight) || 18,
      images: [newFrameImageUrl],
      thumbnail: newFrameImageUrl,
      rating: 5.0,
      reviewCount: 1,
      stock: Number(newFrameStock) || 10,
      isPublished: true,
      isSpotlight: false,
      isTrending: true,
      tags: ['Handcrafted', currentSeller.location],
      createdAt: new Date().toISOString(),
    };

    addProduct(newProd);
    setIsAddModalOpen(false);
    // Reset fields
    setNewFrameName('');
    setNewFrameDesc('');
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingName.trim()) {
      setOnboardingError('Please enter your atelier or brand name');
      return;
    }
    try {
      setOnboardingLoading(true);
      setOnboardingError(null);
      await upgradeToSeller({
        name: onboardingName.trim(),
        city: onboardingCity.trim(),
        specialty: onboardingSpecialty.trim(),
        story: onboardingStory.trim(),
      });
    } catch (err: any) {
      setOnboardingError(err.message || 'Failed to complete atelier onboarding');
    } finally {
      setOnboardingLoading(false);
    }
  };

  // -------------------------------------------------------------
  // ACCESS RESTRICTION: Non-seller & guest users
  // -------------------------------------------------------------
  if (user.role !== 'seller') {
    return (
      <div className="max-w-4xl mx-auto px-6 sm:px-12 py-16">
        <div className="bg-white rounded-[32px] border border-black/10 p-8 sm:p-12 shadow-xl space-y-8 text-center" id="seller-access-gate">
          <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-200 text-orange-800 flex items-center justify-center mx-auto">
            <Store size={28} />
          </div>

          <div className="space-y-3 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase tracking-widest rounded-full">
              <Lock size={11} />
              <span>Artisan Portal Access</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif italic text-black">
              {isAuthenticated ? 'Atelier Registration Required' : 'Artisan Portal Sign In'}
            </h1>
            <p className="text-xs sm:text-sm text-black/60 leading-relaxed">
              {isAuthenticated
                ? `You are currently signed in as a Customer (${user.email || user.name}). The Seller Dashboard is exclusively for verified optical ateliers, artisans, and workshop partners.`
                : 'The FRAMEAI Seller Dashboard is reserved for Indonesian optical artisans, eyewear craftspeople, and registered partner ateliers.'}
            </p>
          </div>

          {/* Quick Demo Access or Sign In */}
          <div className="max-w-md mx-auto space-y-3 pt-2">
            <button
              onClick={() => loginDemoAccount('seller')}
              className="w-full py-4 px-6 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              id="seller-gate-demo-login-btn"
            >
              <Store size={14} />
              <span>Sign In as Optik Melati Demo Seller</span>
            </button>

            {!isAuthenticated ? (
              <button
                onClick={() => openAuthModalWithRedirect('/seller')}
                className="w-full py-3.5 px-6 bg-[#F5F2ED] hover:bg-[#EAE5DC] text-black rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-black/10 cursor-pointer"
                id="seller-gate-auth-modal-btn"
              >
                <User size={14} />
                <span>Sign In with Custom Seller Account</span>
              </button>
            ) : (
              <button
                onClick={() => setShowOnboardingForm(!showOnboardingForm)}
                className="w-full py-3.5 px-6 bg-white hover:bg-neutral-50 text-black rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-black/20 cursor-pointer"
                id="seller-gate-register-atelier-btn"
              >
                <Plus size={14} />
                <span>{showOnboardingForm ? 'Hide Onboarding Form' : 'Register Your Atelier (Become a Seller)'}</span>
              </button>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 text-xs font-semibold text-black/60 hover:text-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Return to Customer Marketplace</span>
            </button>
          </div>

          {/* Embedded Onboarding Form for authenticated customers */}
          {isAuthenticated && showOnboardingForm && (
            <div className="max-w-lg mx-auto text-left pt-6 border-t border-black/10 space-y-4 animate-in fade-in zoom-in-95">
              <div>
                <h3 className="text-lg font-serif italic text-black font-semibold">Register Your Optical Atelier</h3>
                <p className="text-xs text-black/60">Upgrade your customer account to an active SME Artisan profile.</p>
              </div>

              {onboardingError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {onboardingError}
                </div>
              )}

              <form onSubmit={handleOnboardingSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/60">Atelier / Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Optik Nusantara Bandung"
                    value={onboardingName}
                    onChange={(e) => setOnboardingName(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 bg-[#F5F2ED] rounded-xl text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/60">City / Province</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bandung, Jawa Barat"
                      value={onboardingCity}
                      onChange={(e) => setOnboardingCity(e.target.value)}
                      className="w-full mt-1 px-4 py-2.5 bg-[#F5F2ED] rounded-xl text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/60">Craft Specialty</label>
                    <input
                      type="text"
                      placeholder="e.g. Buffalo Horn & Acetate"
                      value={onboardingSpecialty}
                      onChange={(e) => setOnboardingSpecialty(e.target.value)}
                      className="w-full mt-1 px-4 py-2.5 bg-[#F5F2ED] rounded-xl text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/60">Workshop Story</label>
                  <textarea
                    rows={2}
                    placeholder="Tell customers about your craftsmanship tradition and artisanal techniques..."
                    value={onboardingStory}
                    onChange={(e) => setOnboardingStory(e.target.value)}
                    className="w-full mt-1 px-4 py-2 bg-[#F5F2ED] rounded-xl text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={onboardingLoading}
                  className="w-full py-3.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  id="submit-atelier-onboarding-btn"
                >
                  <span>{onboardingLoading ? 'Registering Atelier...' : 'Register Atelier & Unlock Portal'}</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Paid' || o.status === 'Processing').length;

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8 space-y-8">
      {/* Seller Header with atelier profile info and quick preview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-black/10">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest font-bold text-orange-700">
            <Store size={14} />
            <span>Indonesian Optical SME Atelier Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif italic text-[#1A1A1A]">
            {currentSeller.name}
          </h1>
          <p className="text-xs text-black/60 mt-1 flex items-center gap-2">
            <MapPin size={13} className="text-orange-700" />
            <span>{currentSeller.location}, {currentSeller.province} • Active Artisan Atelier</span>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-full border border-black/10 shadow-xs">
          {[
            { id: 'analytics' as TabType, label: 'Dashboard', icon: TrendingUp },
            { id: 'products' as TabType, label: `Catalog (${products.length})`, icon: Package },
            {
              id: 'orders' as TabType,
              label: `Orders (${orders.length})`,
              icon: ClipboardList,
              badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
            },
            { id: 'ar-display' as TabType, label: 'AR Product Display', icon: Box },
            { id: 'ai-insights' as TabType, label: 'AI Advisory', icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-black text-white shadow-xs'
                  : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  activeTab === tab.id ? 'bg-orange-500 text-white' : 'bg-orange-700 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-[32px] p-6 border border-black/5 shadow-xs space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 block">
                Total SME Revenue
              </span>
              <p className="text-2xl sm:text-3xl font-serif italic text-black font-bold">
                Rp {sellerAnalytics.totalRevenue.toLocaleString('id-ID')}
              </p>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                ↑ +18.4% this month
              </span>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-black/5 shadow-xs space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 block">
                Virtual AR Try-Ons
              </span>
              <p className="text-2xl sm:text-3xl font-serif italic text-black font-bold">
                {sellerAnalytics.tryOns.toLocaleString('id-ID')} sessions
              </p>
              <span className="text-xs text-orange-700 font-semibold">
                High mirror engagement
              </span>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-black/5 shadow-xs space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 block">
                Try-On to Buy Rate
              </span>
              <p className="text-2xl sm:text-3xl font-serif italic text-black font-bold">
                {sellerAnalytics.tryOnConversionRate}%
              </p>
              <span className="text-xs text-black/50 font-medium">
                Indonesian benchmark: 4.2%
              </span>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-black/5 shadow-xs space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 block">
                Active Orders
              </span>
              <p className="text-2xl sm:text-3xl font-serif italic text-black font-bold">
                {orders.length} Orders
              </p>
              <span className="text-xs text-emerald-600 font-semibold">
                {pendingOrdersCount} awaiting dispatch
              </span>
            </div>
          </div>

          {/* Demand & Top Shape Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Top Demanded Face Shapes */}
            <div className="lg:col-span-6 bg-white rounded-[36px] p-6 sm:p-8 border border-black/5 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-orange-700 block mb-1">
                  Demographic Breakdown
                </span>
                <h3 className="text-xl font-serif italic text-black">Customer Face Shape Demand</h3>
              </div>

              <div className="space-y-4">
                {sellerAnalytics.faceShapeDemographics.map((item) => (
                  <div key={item.faceShape} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-black">
                      <span>{item.faceShape} Face Shape</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#F5F2ED] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In-Store AR Product Display Omnichannel Performance */}
            <div className="lg:col-span-6 bg-[#EFECE6] rounded-[36px] p-6 sm:p-8 border border-black/5 space-y-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-orange-700 block mb-1">
                  Virtual Showroom Telemetry
                </span>
                <h3 className="text-xl font-serif italic text-black">
                  In-Store AR Product Display Performance
                </h3>
                <p className="text-xs text-black/60 mt-2 leading-relaxed">
                  Metrics from physical counter standees scanned in {currentSeller.location}. Customers inspect virtual 1:1 real-size frames without physical sample storage constraints.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 bg-white rounded-2xl border border-black/5">
                  <span className="text-[9px] uppercase font-bold text-black/40 block">In-Store Scans</span>
                  <span className="text-xl font-serif italic font-bold text-black">
                    {sellerAnalytics.arDisplayScans || 324}
                  </span>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-black/5">
                  <span className="text-[9px] uppercase font-bold text-black/40 block">Target Detection</span>
                  <span className="text-xl font-serif italic font-bold text-emerald-600">
                    {sellerAnalytics.arMarkerDetectionRate || 86.1}%
                  </span>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-black/5">
                  <span className="text-[9px] uppercase font-bold text-black/40 block">Display → Face AR</span>
                  <span className="text-xl font-serif italic font-bold text-orange-700">
                    {sellerAnalytics.arDisplayToFaceTryOnRate || 55.8}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleTabChange('ar-display')}
                className="w-full py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Box size={14} />
                <span>Open AR Product Display Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT CATALOG MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-serif italic text-black">
                Your Frame Catalog ({products.length})
              </h2>
              <p className="text-xs text-black/50 mt-0.5">
                Manage specifications, inventory counts, and public AR availability.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              id="seller-add-product-btn"
            >
              <Plus size={14} />
              <span>Add New Frame Design</span>
            </button>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-[32px] border border-black/10 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1C1917] text-neutral-200 uppercase tracking-wider font-bold text-[11px] border-b border-black/20 shadow-xs">
                  <tr>
                    <th className="py-4.5 px-6 font-semibold text-neutral-100">Frame Name</th>
                    <th className="py-4.5 px-5 font-semibold text-neutral-200">Shape</th>
                    <th className="py-4.5 px-5 font-semibold text-neutral-200">Material</th>
                    <th className="py-4.5 px-5 font-semibold text-neutral-200">Price (IDR)</th>
                    <th className="py-4.5 px-5 font-semibold text-neutral-200">Stock</th>
                    <th className="py-4.5 px-6 font-semibold text-neutral-200 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-black">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F5F2ED]/50 transition-colors">
                      <td className="p-5 font-semibold flex items-center gap-3">
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover bg-[#F5F2ED]"
                        />
                        <div>
                          <p className="font-serif italic text-sm text-black">{p.name}</p>
                          <p className="text-[10px] text-black/40">{p.weightGrams}g • {p.dimensions.lensWidth}mm lens</p>
                        </div>
                      </td>
                      <td className="p-5 font-medium">{p.frameShape}</td>
                      <td className="p-5 text-black/70">{p.material}</td>
                      <td className="p-5 font-bold">Rp {p.price.toLocaleString('id-ID')}</td>
                      <td className="p-5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.stock > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-5 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/ar-display/${p.id}`)}
                          className="p-2 text-black/60 hover:text-orange-700 cursor-pointer"
                          title="Preview AR Product Display (Real Size)"
                        >
                          <Box size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/product/${p.id}`)}
                          className="p-2 text-black/60 hover:text-black cursor-pointer"
                          title="View customer product page"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQrProduct(p);
                            handleTabChange('ar-display');
                          }}
                          className="p-2 text-black/60 hover:text-orange-700 cursor-pointer"
                          title="Generate AR Display Standee"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-2 text-black/40 hover:text-red-700 cursor-pointer"
                          title="Delete frame"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDER FULFILLMENT & LOGISTICS */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-serif italic text-black">
                Customer Orders & Fulfillment ({orders.length})
              </h2>
              <p className="text-xs text-black/50 mt-0.5">
                Track incoming artisanal orders, packaging status, and courier dispatches across Indonesia.
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border border-black/5 space-y-4">
              <ClipboardList size={36} className="text-black/30 mx-auto" />
              <h3 className="text-xl font-serif italic text-black">No Orders Yet</h3>
              <p className="text-xs text-black/60">
                Customer purchases will appear here in real time for fulfillment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusColors: Record<Order['status'], string> = {
                  Pending: 'bg-amber-100 text-amber-900 border-amber-200',
                  Paid: 'bg-blue-100 text-blue-900 border-blue-200',
                  Processing: 'bg-purple-100 text-purple-900 border-purple-200',
                  Shipped: 'bg-orange-100 text-orange-900 border-orange-200',
                  Delivered: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                };

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-[28px] p-6 border border-black/10 shadow-xs space-y-5 hover:shadow-md transition-all"
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-black/5">
                      <div className="flex items-center gap-3">
                        <span className="font-serif italic font-bold text-lg text-black">
                          #{order.id}
                        </span>
                        <span
                          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                            statusColors[order.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.status}
                        </span>
                        <span className="text-[11px] text-black/50 flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                        </span>
                      </div>

                      {/* Status Transition Quick Select */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-black/40">Update Status:</span>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                          className="px-3 py-1.5 bg-[#F5F2ED] rounded-full border border-black/10 text-xs font-semibold text-black focus:outline-none cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Processing">Processing / Crafting</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Items & Customer Details */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Items */}
                      <div className="md:col-span-6 space-y-3">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 block">
                          Ordered Eyewear
                        </span>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-[#F5F2ED] rounded-2xl">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="w-12 h-12 rounded-xl object-cover bg-white"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-serif italic text-sm font-semibold text-black">
                                {item.productName}
                              </h4>
                              <p className="text-[10px] text-black/50">
                                {item.color} • Qty: {item.quantity}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-black">
                              Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}

                        <div className="flex justify-between items-center pt-2 px-2 text-xs">
                          <span className="font-semibold text-black/60">Total Order Amount:</span>
                          <span className="font-serif italic text-base font-bold text-black">
                            Rp {order.totalAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Customer & Shipping Info */}
                      <div className="md:col-span-6 space-y-3 border-t md:border-t-0 md:border-l border-black/10 pt-4 md:pt-0 md:pl-6">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 block">
                          Shipping & Customer Contact
                        </span>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <User size={14} className="text-black/50 mt-0.5" />
                            <div>
                              <p className="font-semibold text-black">{order.customerName}</p>
                              <p className="text-black/50">{order.customerEmail}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Truck size={14} className="text-orange-700 mt-0.5" />
                            <div>
                              <p className="font-semibold text-black">{order.shippingAddress.courier || 'Courier Express'}</p>
                              <p className="text-black/60">
                                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <CreditCard size={14} className="text-emerald-700" />
                            <span className="text-black/70">
                              Payment: <strong className="text-black">{order.paymentMethod}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AR PRODUCT DISPLAY STUDIO & 1:1 REAL-SIZE STANDEE GENERATOR */}
      {activeTab === 'ar-display' && (
        <div className="space-y-8 animate-in fade-in duration-200" id="ar-product-display-studio">
          {/* Header & Feature Purpose */}
          <div className="bg-white rounded-[36px] p-6 sm:p-8 border border-black/5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-orange-700 flex items-center gap-1.5 mb-1">
                <Box size={14} />
                <span>Virtual Showroom Studio • Real-World Scale 1:1</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif italic text-black">
                AR Product Display Studio
              </h2>
              <p className="text-xs text-black/60 mt-1 max-w-2xl leading-relaxed">
                Showcase your eyewear collection as true-to-life virtual objects in the customer's physical space. Generates printable counter standees with calibrated 100mm optical reference tracking targets.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => navigate(`/ar-display/${selectedQrProduct.id}`)}
                className="px-5 py-2.5 bg-[#F5F2ED] hover:bg-black hover:text-white text-black rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border border-black/10 cursor-pointer"
                id="seller-preview-ar-display-btn"
              >
                <Eye size={14} />
                <span>Launch Customer AR View</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-black text-white hover:bg-orange-700 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                id="seller-print-standee-btn"
              >
                <Printer size={14} />
                <span>Print Standee Card</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Standee Configuration Panel */}
            <div className="lg:col-span-6 bg-white rounded-[36px] p-6 sm:p-8 border border-black/5 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 block mb-1">
                  Step 1 • Standee Setup
                </span>
                <h3 className="text-xl font-serif italic text-black">Configure Display Model</h3>
              </div>

              {/* Eyewear Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-black/60">
                  Select Frame Design
                </label>
                <select
                  value={selectedQrProduct.id}
                  onChange={(e) => {
                    const p = products.find((prod) => prod.id === e.target.value);
                    if (p) setSelectedQrProduct(p);
                  }}
                  className="w-full p-3 bg-[#F5F2ED] rounded-xl text-xs font-semibold text-black border border-black/10 focus:outline-none cursor-pointer"
                  id="standee-product-select"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Rp {p.price.toLocaleString('id-ID')} ({p.frameShape})
                    </option>
                  ))}
                </select>
              </div>

              {/* Millimeter Dimension Verification Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-black/60 flex items-center justify-between">
                  <span>Physical Millimeter Calibration</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">1:1 Precision Active</span>
                </label>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2.5 bg-[#F5F2ED] rounded-xl border border-black/5">
                    <span className="text-[8px] uppercase text-black/40 block font-sans">Width</span>
                    <span className="text-xs font-bold text-orange-700">
                      {selectedQrProduct.frameWidthMm || selectedQrProduct.dimensions?.frameWidth || 138} mm
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F5F2ED] rounded-xl border border-black/5">
                    <span className="text-[8px] uppercase text-black/40 block font-sans">Lens</span>
                    <span className="text-xs font-bold text-black">
                      {selectedQrProduct.lensWidthMm || selectedQrProduct.dimensions?.lensWidth || 51} mm
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F5F2ED] rounded-xl border border-black/5">
                    <span className="text-[8px] uppercase text-black/40 block font-sans">Bridge</span>
                    <span className="text-xs font-bold text-black">
                      {selectedQrProduct.bridgeWidthMm || selectedQrProduct.dimensions?.bridgeWidth || 19} mm
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F5F2ED] rounded-xl border border-black/5">
                    <span className="text-[8px] uppercase text-black/40 block font-sans">Temple</span>
                    <span className="text-xs font-bold text-black">
                      {selectedQrProduct.templeLengthMm || selectedQrProduct.dimensions?.templeLength || 145} mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Marker Specification */}
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-900 uppercase tracking-wider">
                  <Ruler size={14} className="text-orange-700" />
                  <span>Calibrated Reference Marker (100 mm × 100 mm)</span>
                </div>
                <p className="text-[11px] text-orange-950/70 leading-relaxed">
                  The printed standee includes a high-contrast fiducial marker. When customers point their phone at it, FRAMEAI calculates exact optical scale based on the known 100mm physical width.
                </p>
              </div>

              {/* SME Virtual Showroom ROI / Overhead Savings */}
              <div className="p-5 bg-[#1C1917] rounded-2xl text-white space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-orange-400 font-bold block">
                  SME Atelier Value Proposition
                </span>
                <p className="text-xs font-serif italic text-white/90 leading-relaxed">
                  "Displaying your entire {products.length}-frame catalog through AR Product Display eliminates the need to hold Rp 48.5M in physical demo samples on your counter while giving walk-in shoppers real-scale precision."
                </p>
              </div>
            </div>

            {/* High-Resolution Printable Standee Preview */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 mb-3">
                Printable Standee Card Preview (Scale 1:1)
              </span>

              <div
                className="w-full max-w-[370px] bg-white rounded-[32px] p-7 border-2 border-black/15 shadow-2xl text-center space-y-4 print:shadow-none print:border-black"
                id="printable-ar-standee-card"
              >
                {/* Atelier Top Brand Header */}
                <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold text-black/50 border-b border-black/10 pb-2.5">
                  <span>FRAMEAI • Atelier Series</span>
                  <span>{currentSeller.location}</span>
                </div>

                {/* Product Thumbnail */}
                <div className="w-full h-28 bg-[#F5F2ED] rounded-2xl flex items-center justify-center p-2 border border-black/5">
                  <img
                    src={selectedQrProduct.thumbnail}
                    alt={selectedQrProduct.name}
                    className="max-h-22 object-contain"
                  />
                </div>

                {/* Product Specs */}
                <div>
                  <h4 className="font-serif italic text-2xl text-black font-bold">
                    {selectedQrProduct.name}
                  </h4>
                  <p className="text-xs text-black/60 mt-0.5">
                    {selectedQrProduct.material} • Rp {selectedQrProduct.price.toLocaleString('id-ID')}
                  </p>
                  <div className="mt-1 inline-block bg-black/5 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-black/70">
                    W: {selectedQrProduct.frameWidthMm || 138}mm • Lens: {selectedQrProduct.lensWidthMm || 51}mm • Bridge: {selectedQrProduct.bridgeWidthMm || 19}mm
                  </div>
                </div>

                {/* DUAL ELEMENTS: 1. Deep Link QR + 2. Calibrated Optical Marker Target */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FAF8F5] rounded-2xl border border-black/10">
                  {/* 1. QR Code */}
                  <div className="flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                        typeof window !== 'undefined'
                          ? `${window.location.origin}/ar-display/${selectedQrProduct.id}?mode=mobileAR`
                          : `https://frameai.id/ar-display/${selectedQrProduct.id}?mode=mobileAR`
                      )}&format=svg&margin=2`}
                      alt="AR Product Display QR Code"
                      className="w-24 h-24 object-contain mx-auto bg-white p-1 rounded-xl shadow-xs"
                    />
                    <span className="mt-1 text-[8px] font-mono font-bold text-black/60 uppercase">
                      1. Scan QR
                    </span>
                  </div>

                  {/* 2. 100mm Target Reference */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-24 h-24 flex items-center justify-center bg-white p-1 rounded-xl shadow-xs border border-neutral-200">
                      <svg viewBox="0 0 400 400" className="w-full h-full">
                        <rect x="0" y="0" width="400" height="400" fill="#FFFFFF" />
                        <rect x="30" y="30" width="340" height="340" fill="none" stroke="#111" strokeWidth="32" rx="4" />
                        <rect x="70" y="70" width="44" height="44" fill="#111" />
                        <rect x="286" y="70" width="44" height="44" fill="#111" />
                        <rect x="70" y="286" width="44" height="44" fill="#111" />
                        <circle cx="308" cy="308" r="22" fill="#111" />
                        <circle cx="200" cy="200" r="85" fill="none" stroke="#111" strokeWidth="10" />
                        <circle cx="200" cy="200" r="50" fill="none" stroke="#EA580C" strokeWidth="6" />
                        <circle cx="200" cy="200" r="24" fill="#111" />
                      </svg>
                    </div>
                    <span className="mt-1 text-[8px] font-mono font-bold text-orange-700 uppercase">
                      2. 100mm Marker
                    </span>
                  </div>
                </div>

                {/* 3-Step Customer Instructions */}
                <div className="bg-[#F5F2ED] rounded-xl p-3 text-left space-y-1">
                  <p className="text-[10px] font-bold uppercase text-black tracking-wider">
                    How to View in Real Size:
                  </p>
                  <ol className="text-[10px] text-black/70 space-y-0.5 list-decimal list-inside leading-snug">
                    <li>Scan QR with smartphone camera</li>
                    <li>Aim camera at marker to inspect in 1:1 real size</li>
                    <li>Tap 'Try On My Face' to check facial styling</li>
                  </ol>
                </div>

                <div className="text-[9px] text-black/40 uppercase tracking-widest pt-1">
                  Handcrafted by {selectedQrProduct.sellerName}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI ARTISAN ADVISORY / DEMAND INSIGHTS */}
      {activeTab === 'ai-insights' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-orange-700 flex items-center gap-1.5 mb-1">
                <Sparkles size={14} />
                <span>Gemini 3.7 Flash AI Market Advisory</span>
              </span>
              <h2 className="text-3xl font-serif italic text-black">Artisan Production & Trend Insights</h2>
              <p className="text-xs text-black/60 mt-1">
                Real-time analysis powered by customer product views, AR try-ons, and purchase velocity.
              </p>
            </div>

            <button
              onClick={fetchAiInsights}
              disabled={loadingAi}
              className="px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
              id="refresh-ai-insights-btn"
            >
              <Sparkles size={13} />
              <span>{loadingAi ? 'Analyzing Market Data...' : 'Refresh Insights'}</span>
            </button>
          </div>

          {loadingAi ? (
            <div className="bg-white rounded-[36px] p-12 border border-black/5 shadow-xs text-center space-y-4">
              <div className="w-10 h-10 border-3 border-orange-700 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-serif italic text-black/70">
                Evaluating customer try-on telemetry, inventory turnover, and Indonesian face shape demand...
              </p>
            </div>
          ) : structuredInsights.length === 0 ? (
            <div className="bg-white rounded-[36px] p-12 border border-black/5 shadow-xs text-center space-y-4">
              <Sparkles size={32} className="text-orange-700 mx-auto" />
              <h3 className="text-2xl font-serif italic text-black">No Insights Generated Yet</h3>
              <p className="text-xs text-black/60 max-w-md mx-auto">
                Click "Refresh Insights" to evaluate your product performance, AR try-on conversions, and SME market trends with Gemini.
              </p>
              <button
                onClick={fetchAiInsights}
                className="px-6 py-2.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-orange-700 transition-all cursor-pointer"
              >
                Generate Insights
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {structuredInsights.map((item, idx) => {
                const badgeColor =
                  item.type === 'performance'
                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                    : item.type === 'trend'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                    : 'bg-blue-100 text-blue-900 border-blue-200';

                return (
                  <div
                    key={item.id || idx}
                    className="bg-white rounded-[32px] p-6 sm:p-7 border border-black/5 shadow-xs flex flex-col justify-between space-y-5 hover:shadow-md transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${badgeColor}`}
                        >
                          {item.type || 'Insight'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black/30">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* 1. Core Insight */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-orange-700 block">
                          Key Performance Insight
                        </span>
                        <h4 className="text-base font-serif italic font-medium text-black leading-snug">
                          "{item.insight}"
                        </h4>
                      </div>

                      {/* 2. Supporting Metric */}
                      <div className="p-3.5 bg-[#F5F2ED] rounded-2xl border border-black/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-black/50">
                          <BarChart3 size={11} />
                          <span>Supporting Telemetry</span>
                        </div>
                        <p className="text-xs font-semibold text-black leading-relaxed">
                          {item.supportingMetric}
                        </p>
                      </div>
                    </div>

                    {/* 3. Actionable Recommendation */}
                    <div className="p-4 bg-[#1A1A1A] text-white rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-orange-400">
                        <Lightbulb size={12} />
                        <span>Artisan Action Recommendation</span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed pt-0.5">
                        {item.recommendation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADD NEW PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-[36px] p-8 max-w-lg w-full space-y-6 border border-black/10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-black/10">
              <h3 className="font-serif italic text-2xl text-black">Submit New Frame Design</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-black/40 hover:text-black text-sm font-bold uppercase cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase text-black/50">Frame Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Nusantara Wayfarer"
                  value={newFrameName}
                  onChange={(e) => setNewFrameName(e.target.value)}
                  className="w-full p-3 bg-[#F5F2ED] rounded-xl font-medium text-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-black/50">Frame Shape</label>
                  <select
                    value={newFrameShape}
                    onChange={(e) => setNewFrameShape(e.target.value as FrameShape)}
                    className="w-full p-3 bg-[#F5F2ED] rounded-xl font-medium text-black focus:outline-none cursor-pointer"
                  >
                    <option value="Rectangle">Rectangle</option>
                    <option value="Round">Round</option>
                    <option value="Square">Square</option>
                    <option value="Aviator">Aviator</option>
                    <option value="Cat-Eye">Cat-Eye</option>
                    <option value="Browline">Browline</option>
                    <option value="Wayfarer">Wayfarer</option>
                    <option value="Geometric">Geometric</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-black/50">Craft Material</label>
                  <input
                    type="text"
                    value={newFrameMaterial}
                    onChange={(e) => setNewFrameMaterial(e.target.value)}
                    className="w-full p-3 bg-[#F5F2ED] rounded-xl font-medium text-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-black/50">Price (IDR)</label>
                  <input
                    type="number"
                    value={newFramePrice}
                    onChange={(e) => setNewFramePrice(Number(e.target.value))}
                    className="w-full p-3 bg-[#F5F2ED] rounded-xl font-medium text-black focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase text-black/50">Stock</label>
                  <input
                    type="number"
                    value={newFrameStock}
                    onChange={(e) => setNewFrameStock(Number(e.target.value))}
                    className="w-full p-3 bg-[#F5F2ED] rounded-xl font-medium text-black focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase text-black/50">Weight (g)</label>
                  <input
                    type="number"
                    value={newFrameWeight}
                    onChange={(e) => setNewFrameWeight(Number(e.target.value))}
                    className="w-full p-3 bg-[#F5F2ED] rounded-xl font-medium text-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-black/50">Image URL</label>
                <input
                  type="url"
                  value={newFrameImageUrl}
                  onChange={(e) => setNewFrameImageUrl(e.target.value)}
                  className="w-full p-3 bg-[#F5F2ED] rounded-xl font-medium text-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-black/50">Description</label>
                <textarea
                  rows={3}
                  value={newFrameDesc}
                  onChange={(e) => setNewFrameDesc(e.target.value)}
                  placeholder="Artisan handcrafting story and design notes..."
                  className="w-full p-3 bg-[#F5F2ED] rounded-xl font-medium text-black focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 border border-black/20 rounded-full font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-black text-white rounded-full font-bold uppercase hover:bg-orange-700 cursor-pointer"
                >
                  Publish Frame
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
