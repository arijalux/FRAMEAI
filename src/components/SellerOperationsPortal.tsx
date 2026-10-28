import React, { useState } from 'react';
import { OpticalFrame, Order, SellerInsights, OrderStatus } from '../types';
import {
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  DollarSign,
  ChevronRight,
  Sliders,
  X,
} from 'lucide-react';
import { updateOrderStatusInDb } from '../lib/firebase';

interface SellerOperationsPortalProps {
  frames: OpticalFrame[];
  orders: Order[];
  onUpdateFrameStock: (frameId: string, newStock: number) => void;
  onAddNewFrame: (frame: OpticalFrame) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const SellerOperationsPortal: React.FC<SellerOperationsPortalProps> = ({
  frames,
  orders,
  onUpdateFrameStock,
  onAddNewFrame,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'ai_insights'>('inventory');
  const [aiInsights, setAiInsights] = useState<SellerInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);
  const [showAddFrameModal, setShowAddFrameModal] = useState<boolean>(false);

  // New frame form state
  const [newFrameName, setNewFrameName] = useState<string>('');
  const [newFrameShape, setNewFrameShape] = useState<OpticalFrame['shape']>('Geometric');
  const [newFrameMaterial, setNewFrameMaterial] = useState<OpticalFrame['material']>('Aerospace Titanium');
  const [newFramePrice, setNewFramePrice] = useState<number>(320);
  const [newFrameStock, setNewFrameStock] = useState<number>(20);
  const [newFrameDesc, setNewFrameDesc] = useState<string>('Custom atelier handcrafted optical silhouette.');

  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const lowStockFrames = frames.filter((f) => f.stock < 15);

  const fetchAiInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await fetch('/api/seller-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalFrames: frames.length,
          orderCount: orders.length,
          lowStockCount: lowStockFrames.length,
        }),
      });
      const data = await res.json();
      if (data.insights) {
        setAiInsights(data.insights);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleCreateFrame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFrameName) return;

    const frame: OpticalFrame = {
      id: 'frame-' + Date.now(),
      name: newFrameName,
      brand: 'FrameAI Atelier',
      shape: newFrameShape,
      material: newFrameMaterial,
      price: Number(newFramePrice),
      stock: Number(newFrameStock),
      weightGrams: 15.5,
      fitFaceShapes: ['Oval', 'Round', 'Heart'],
      description: newFrameDesc,
      isPolarized: false,
      rating: 5.0,
      reviewsCount: 1,
      isNew: true,
      imageUrl: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=800&q=80',
      model3dPreset: 'geometric',
      colors: [
        { name: 'Brushed Titanium', hex: '#8F9194', acetateTexture: 'metallic' },
        { name: 'Matte Obsidian', hex: '#1C1C1E', acetateTexture: 'matte' },
      ],
      dimensions: {
        lensWidth: 51,
        bridgeWidth: 19,
        templeLength: 145,
        lensHeight: 44,
        totalWidth: 136,
      },
    };

    onAddNewFrame(frame);
    setShowAddFrameModal(false);
    setNewFrameName('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            Merchant & Studio Operations Portal
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">Store Intelligence & Fulfillment</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Manage frame stock levels, track digital lens lab orders, and review Gemini demand insights.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddFrameModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Frame
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Total Optical Catalog</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-white">{frames.length} Models</div>
          <div className="text-[11px] text-neutral-400">Titanium, Acetate, Eco-polymers</div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Lab Orders in Queue</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-white">{orders.length} Active</div>
          <div className="text-[11px] text-emerald-400">100% on-time surfacing rate</div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Gross Platform Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-white font-mono">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-400">Average order value: $340</div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Low Stock Restock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-400">{lowStockFrames.length} Frames</div>
          <div className="text-[11px] text-neutral-400">Under 15 units in vault</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inventory'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Inventory Management ({frames.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Customer Orders & Surfacing ({orders.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('ai_insights');
            if (!aiInsights) fetchAiInsights();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'ai_insights'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Store Intelligence
        </button>
      </div>

      {/* TAB 1: Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider">
            <span>Optical Inventory Stock</span>
            <span>Live Vault Sync</span>
          </div>

          <div className="divide-y divide-neutral-800/80 overflow-x-auto">
            {frames.map((frame) => (
              <div
                key={frame.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-950/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={frame.imageUrl}
                    alt={frame.name}
                    className="w-16 h-12 object-cover rounded-xl bg-neutral-950 border border-neutral-800 shrink-0"
                  />
                  <div>
                    <h4 className="font-serif font-bold text-white text-sm">{frame.name}</h4>
                    <div className="text-xs text-neutral-400">
                      {frame.shape} · {frame.material} · {frame.dimensions.lensWidth}mm lens width
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Price */}
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 block uppercase font-mono">Retail MSRP</span>
                    <span className="font-mono font-bold text-sm text-white">${frame.price}</span>
                  </div>

                  {/* Stock Controls */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 block uppercase font-mono">Vault Stock</span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          frame.stock < 12
                            ? 'text-red-400'
                            : frame.stock < 20
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {frame.stock} units
                      </span>
                    </div>

                    <div className="flex items-center border border-neutral-800 rounded-lg bg-neutral-950 p-0.5">
                      <button
                        onClick={() => onUpdateFrameStock(frame.id, Math.max(0, frame.stock - 1))}
                        aria-label={`Decrease stock for ${frame.name}`}
                        className="w-7 h-7 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-300 font-mono text-sm"
                      >
                        -
                      </button>
                      <button
                        onClick={() => onUpdateFrameStock(frame.id, frame.stock + 5)}
                        aria-label={`Add 5 units for ${frame.name}`}
                        className="w-7 h-7 rounded hover:bg-neutral-800 flex items-center justify-center text-amber-400 font-mono text-xs font-bold"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Order Fulfillment Pipeline */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-sm">
              No orders placed yet. Orders will appear here in real time.
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-xs font-mono text-amber-400 font-bold">{ord.id}</span>
                    <h4 className="font-serif font-bold text-white text-base mt-0.5">
                      {ord.customerName} ({ord.customerEmail})
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-base">
                      ${ord.totalAmount}
                    </span>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ord.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center gap-3 text-xs"
                    >
                      <img
                        src={it.frame.imageUrl}
                        alt={it.frame.name}
                        className="w-12 h-10 object-cover rounded-lg bg-neutral-900"
                      />
                      <div>
                        <div className="font-bold text-white">{it.frame.name} (Qty: {it.quantity})</div>
                        <div className="text-neutral-400">
                          {it.lensConfig.type.replace('_', ' ')} · {it.selectedColor.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Status Advancement */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">Fulfillment Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : ord.status === 'shipped'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">Update Phase:</span>
                    {(['received', 'crafting_lenses', 'optical_qc', 'shipped', 'delivered'] as OrderStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => {
                            onUpdateOrderStatus(ord.id, st);
                            updateOrderStatusInDb(ord.id, st);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            ord.status === st
                              ? 'bg-amber-500 text-neutral-950'
                              : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Gemini AI Store Intelligence */}
      {activeTab === 'ai_insights' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 rounded-3xl bg-neutral-900 border border-neutral-800">
            <div>
              <h3 className="font-serif font-bold text-xl text-white">Gemini Optical Retail Intelligence</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Deep analytical inference of customer try-on patterns, lens upgrades, and supply chain health.
              </p>
            </div>
            <button
              onClick={fetchAiInsights}
              disabled={isLoadingInsights}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInsights ? 'animate-spin' : ''}`} />
              {isLoadingInsights ? 'Analyzing Trends...' : 'Refresh Insights'}
            </button>
          </div>

          {isLoadingInsights && !aiInsights && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">Synthesizing platform try-on telemetry with Gemini 3.8 Flash...</p>
            </div>
          )}

          {aiInsights && (
            <div className="space-y-6 animate-in fade-in">
              {/* Executive Summary */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Executive AI Summary
                </span>
                <p className="text-sm text-neutral-200 leading-relaxed font-sans">{aiInsights.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trending Face Shapes */}
                <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
                  <div className="flex items-center gap-2 text-white font-serif font-bold text-lg">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    Customer Facial Geometry Distribution
                  </div>
                  <div className="space-y-3">
                    {aiInsights.trendingFaceShapes.map((t) => (
                      <div key={t.shape} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-white">{t.shape} Architecture</span>
                          <span className="font-mono text-amber-400 font-bold">{t.percentage}% of try-ons</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${t.percentage}%` }} />
                        </div>
                        <p className="text-[11px] text-neutral-400">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restock & Supply Recommendations */}
                <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
                  <div className="flex items-center gap-2 text-white font-serif font-bold text-lg">
                    <Package className="w-5 h-5 text-emerald-400" />
                    Automated Restock Directives
                  </div>
                  <div className="space-y-3">
                    {aiInsights.restockRecommendations.map((r) => (
                      <div
                        key={r.frameName}
                        className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{r.frameName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              r.urgency === 'High'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {r.urgency} Urgency
                          </span>
                        </div>
                        <p className="text-neutral-400 text-[11px]">{r.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Projected Demand Summary */}
              <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Quarterly Demand Projection
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed">{aiInsights.projectedDemandSummary}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add New Frame Modal */}
      {showAddFrameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-serif font-bold text-lg text-white">Add Optical Frame to Catalog</h3>
              <button
                onClick={() => setShowAddFrameModal(false)}
                aria-label="Close modal"
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFrame} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Frame Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monaco Sculpted Acetate"
                  value={newFrameName}
                  onChange={(e) => setNewFrameName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Shape</label>
                  <select
                    value={newFrameShape}
                    onChange={(e) => setNewFrameShape(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white"
                  >
                    <option value="Geometric">Geometric</option>
                    <option value="Square">Square</option>
                    <option value="Round">Round</option>
                    <option value="Aviator">Aviator</option>
                    <option value="Cat-Eye">Cat-Eye</option>
                    <option value="Oval">Oval</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Material</label>
                  <select
                    value={newFrameMaterial}
                    onChange={(e) => setNewFrameMaterial(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white"
                  >
                    <option value="Aerospace Titanium">Aerospace Titanium</option>
                    <option value="Italian Acetate">Italian Acetate</option>
                    <option value="Eco-Polymer">Eco-Polymer</option>
                    <option value="Mixed Titanium Acetate">Mixed Titanium Acetate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">MSRP ($)</label>
                  <input
                    type="number"
                    required
                    value={newFramePrice}
                    onChange={(e) => setNewFramePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Initial Vault Stock</label>
                  <input
                    type="number"
                    required
                    value={newFrameStock}
                    onChange={(e) => setNewFrameStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Design Notes & Ergonomics</label>
                <textarea
                  rows={2}
                  value={newFrameDesc}
                  onChange={(e) => setNewFrameDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFrameModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                >
                  Publish to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
