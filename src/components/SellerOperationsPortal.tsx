import React, { useState } from 'react';
import { OpticalFrame, Order, SellerInsights, OrderStatus, CustomDesignRequest, CustomDesignStatus } from '../types';
import { CustomDesignInbox } from './CustomDesignInbox';
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
import { formatRupiah, frameShapeLabel, materialLabel, orderStatusLabel, lensTypeLabel, faceShapeLabel } from '../utils/format';

const URGENCY_LABELS: Record<string, string> = { High: 'Tinggi', Medium: 'Sedang', Low: 'Rendah' };

interface SellerOperationsPortalProps {
  frames: OpticalFrame[];
  orders: Order[];
  onUpdateFrameStock: (frameId: string, newStock: number) => void;
  onAddNewFrame: (frame: OpticalFrame) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  customDesigns: CustomDesignRequest[];
  onUpdateDesignStatus: (designId: string, status: CustomDesignStatus) => void;
}

export const SellerOperationsPortal: React.FC<SellerOperationsPortalProps> = ({
  frames,
  orders,
  onUpdateFrameStock,
  onAddNewFrame,
  onUpdateOrderStatus,
  customDesigns,
  onUpdateDesignStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'custom' | 'ai_insights'>('inventory');
  const [aiInsights, setAiInsights] = useState<SellerInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [showAddFrameModal, setShowAddFrameModal] = useState<boolean>(false);

  // New frame form state
  const [newFrameName, setNewFrameName] = useState<string>('');
  const [newFrameShape, setNewFrameShape] = useState<OpticalFrame['shape']>('Geometric');
  const [newFrameMaterial, setNewFrameMaterial] = useState<OpticalFrame['material']>('Aerospace Titanium');
  const [newFramePrice, setNewFramePrice] = useState<number>(5_000_000);
  const [newFrameStock, setNewFrameStock] = useState<number>(20);
  const [newFrameDesc, setNewFrameDesc] = useState<string>('Frame buatan tangan dengan siluet khas.');

  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const lowStockFrames = frames.filter((f) => f.stock < 15);

  const fetchAiInsights = async () => {
    setIsLoadingInsights(true);
    setInsightsError(null);
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
      const data = await res.json().catch(() => null);
      if (res.ok && data?.insights) {
        setAiInsights(data.insights);
      } else {
        setInsightsError(data?.error || 'Insight AI sedang tidak tersedia.');
      }
    } catch (e) {
      console.error(e);
      setInsightsError('Layanan insight tidak dapat dihubungi.');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-line">
        <div>
          <div className="flex items-center gap-2 text-sage text-xs font-medium mb-1">
            <Sliders className="w-4 h-4" />
            Portal Toko
          </div>
          <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">Inventaris & Pesanan</h2>
          <p className="text-xs text-muted mt-1">
            Kelola stok frame, pantau pesanan, dan lihat insight permintaan dari Gemini.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddFrameModal(true)}
            className="px-4 py-2.5 rounded-full bg-ink hover:bg-ink-soft text-white font-medium text-xs flex items-center gap-1.5 shadow-card transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Frame
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-line space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Total Katalog</span>
            <Package className="w-4 h-4 text-sage" />
          </div>
          <div className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">{frames.length} Model</div>
          <div className="text-[11px] text-muted">Titanium, Asetat, Eko-Polimer</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-line space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Pesanan Masuk</span>
            <Clock className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">{orders.length} Pesanan</div>
          <div className="text-[11px] text-emerald-700">{orders.filter((o) => o.status !== 'delivered').length} belum selesai</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-line space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Total Penjualan</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink tabular-nums">
            {formatRupiah(totalRevenue)}
          </div>
          <div className="text-[11px] text-muted">Rata-rata per pesanan: {formatRupiah(orders.length ? totalRevenue / orders.length : 0)}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-line space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Stok Menipis</span>
            <AlertTriangle className="w-4 h-4 text-sage" />
          </div>
          <div className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-sage">{lowStockFrames.length} Frame</div>
          <div className="text-[11px] text-muted">Di bawah 15 unit</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
            activeTab === 'inventory'
              ? 'bg-ink text-white shadow-md'
              : 'text-muted hover:text-ink hover:bg-white'
          }`}
        >
          Inventaris ({frames.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
            activeTab === 'orders'
              ? 'bg-ink text-white shadow-md'
              : 'text-muted hover:text-ink hover:bg-white'
          }`}
        >
          Pesanan Pelanggan ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
            activeTab === 'custom'
              ? 'bg-ink text-white shadow-md'
              : 'text-muted hover:text-ink hover:bg-white'
          }`}
        >
          Desain Custom ({customDesigns.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('ai_insights');
            if (!aiInsights) fetchAiInsights();
          }}
          className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeTab === 'ai_insights'
              ? 'bg-ink text-white shadow-md'
              : 'text-muted hover:text-ink hover:bg-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Insight AI
        </button>
      </div>

      {/* TAB 1: Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="rounded-3xl bg-white border border-line overflow-hidden shadow-card">
          <div className="p-4 bg-white/60 border-b border-line flex items-center justify-between text-xs font-medium text-muted">
            <span>Stok Frame</span>
            <span>Tersimpan di Firestore</span>
          </div>

          <div className="divide-y divide-line overflow-x-auto">
            {frames.map((frame) => (
              <div
                key={frame.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={frame.imageUrl}
                    alt={frame.name}
                    className="w-16 h-12 object-cover rounded-xl bg-soft border border-line shrink-0"
                  />
                  <div>
                    <h4 className="font-normal tracking-[-0.03em] text-ink text-sm">{frame.name}</h4>
                    <div className="text-xs text-muted">
                      {frameShapeLabel(frame.shape)} · {materialLabel(frame.material)} · lensa {frame.dimensions.lensWidth}mm
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Price */}
                  <div className="text-right">
                    <span className="text-[10px] text-faint block tabular-nums">Harga</span>
                    <span className="tabular-nums font-medium text-sm text-ink">{formatRupiah(frame.price)}</span>
                  </div>

                  {/* Stock Controls */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-faint block tabular-nums">Stok</span>
                      <span
                        className={`tabular-nums font-medium text-sm ${
                          frame.stock < 12
                            ? 'text-red-700'
                            : frame.stock < 20
                            ? 'text-sage'
                            : 'text-emerald-700'
                        }`}
                      >
                        {frame.stock} unit
                      </span>
                    </div>

                    <div className="flex items-center border border-line rounded-lg bg-soft p-0.5">
                      <button
                        onClick={() => onUpdateFrameStock(frame.id, Math.max(0, frame.stock - 1))}
                        aria-label={`Kurangi stok ${frame.name}`}
                        className="w-7 h-7 rounded hover:bg-soft-strong flex items-center justify-center text-body tabular-nums text-sm"
                      >
                        -
                      </button>
                      <button
                        onClick={() => onUpdateFrameStock(frame.id, frame.stock + 5)}
                        aria-label={`Tambah 5 unit ${frame.name}`}
                        className="w-7 h-7 rounded hover:bg-soft-strong flex items-center justify-center text-sage tabular-nums text-xs font-medium"
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
            <div className="p-12 text-center rounded-3xl bg-white border border-line text-muted text-sm">
              Belum ada pesanan.
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="p-6 rounded-3xl bg-white border border-line space-y-4 shadow-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <span className="text-xs tabular-nums text-sage font-medium">{ord.id}</span>
                    <h4 className="font-normal tracking-[-0.03em] text-ink text-base mt-0.5">
                      {ord.customerName} ({ord.customerEmail})
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">
                      {new Date(ord.createdAt).toLocaleDateString('id-ID')}
                    </span>
                    <span className="tabular-nums font-medium text-sage text-base">
                      {formatRupiah(ord.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ord.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 rounded-2xl bg-soft border border-line flex items-center gap-3 text-xs"
                    >
                      <img
                        src={it.frame.imageUrl}
                        alt={it.frame.name}
                        className="w-12 h-10 object-cover rounded-lg bg-white"
                      />
                      <div>
                        <div className="font-medium text-ink">{it.frame.name} (Jumlah: {it.quantity})</div>
                        <div className="text-muted">
                          {lensTypeLabel(it.lensConfig.type)} · {it.selectedColor.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Status Advancement */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30'
                          : ord.status === 'shipped'
                          ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                          : 'bg-sage-tint text-sage border border-sage-line'
                      }`}
                    >
                      {orderStatusLabel(ord.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">Ubah Status:</span>
                    {(['received', 'crafting_lenses', 'optical_qc', 'shipped', 'delivered'] as OrderStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => {
                            onUpdateOrderStatus(ord.id, st);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                            ord.status === st
                              ? 'bg-ink text-white'
                              : 'bg-soft text-muted hover:text-ink border border-line'
                          }`}
                        >
                          {orderStatusLabel(st)}
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

      {/* TAB 3: Custom wooden frame designs sent to BJ Homemade */}
      {activeTab === 'custom' && <CustomDesignInbox designs={customDesigns} onUpdateStatus={onUpdateDesignStatus} />}

      {/* TAB 4: Gemini AI Store Intelligence */}
      {activeTab === 'ai_insights' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 rounded-3xl bg-white border border-line">
            <div>
              <h3 className="font-normal tracking-[-0.03em] text-xl text-ink">Insight Penjualan dari Gemini</h3>
              <p className="text-xs text-muted mt-1">
                Analisis pola try-on pelanggan, tren upgrade lensa, dan kondisi stok.
              </p>
            </div>
            <button
              onClick={fetchAiInsights}
              disabled={isLoadingInsights}
              className="px-4 py-2 rounded-full bg-ink hover:bg-ink-soft text-white font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInsights ? 'animate-spin' : ''}`} />
              {isLoadingInsights ? 'Menganalisis...' : 'Perbarui Insight'}
            </button>
          </div>

          {insightsError && !isLoadingInsights && (
            <div role="alert" className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-700">
              {insightsError}
            </div>
          )}

          {isLoadingInsights && !aiInsights && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sage animate-spin mx-auto" />
              <p className="text-xs text-muted">Menganalisis data dengan Gemini 3.8 Flash...</p>
            </div>
          )}

          {aiInsights && (
            <div className="space-y-6 animate-in fade-in">
              {/* Executive Summary */}
              <div className="p-6 rounded-3xl border border-sage-line space-y-2">
                <span className="text-[10px] font-medium text-sage">
                  Ringkasan AI
                </span>
                <p className="text-sm text-ink leading-relaxed font-sans">{aiInsights.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trending Face Shapes */}
                <div className="p-6 rounded-3xl bg-white border border-line space-y-4">
                  <div className="flex items-center gap-2 text-ink font-normal tracking-[-0.03em] text-lg">
                    <TrendingUp className="w-5 h-5 text-sage" />
                    Sebaran Bentuk Wajah Pelanggan
                  </div>
                  <div className="space-y-3">
                    {aiInsights.trendingFaceShapes.map((t) => (
                      <div key={t.shape} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-ink">Wajah {faceShapeLabel(t.shape)}</span>
                          <span className="tabular-nums text-sage font-medium">{t.percentage}% try-on</span>
                        </div>
                        <div className="w-full bg-soft h-2 rounded-full overflow-hidden">
                          <div className="bg-ink h-full rounded-full" style={{ width: `${t.percentage}%` }} />
                        </div>
                        <p className="text-[11px] text-muted">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restock & Supply Recommendations */}
                <div className="p-6 rounded-3xl bg-white border border-line space-y-4">
                  <div className="flex items-center gap-2 text-ink font-normal tracking-[-0.03em] text-lg">
                    <Package className="w-5 h-5 text-emerald-700" />
                    Rekomendasi Restock
                  </div>
                  <div className="space-y-3">
                    {aiInsights.restockRecommendations.map((r) => (
                      <div
                        key={r.frameName}
                        className="p-3.5 rounded-2xl bg-soft border border-line space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-ink">{r.frameName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              r.urgency === 'High'
                                ? 'bg-red-500/20 text-red-700 border border-red-500/30'
                                : 'bg-sage-tint text-sage border border-sage-line'
                            }`}
                          >
                            Urgensi {URGENCY_LABELS[r.urgency] ?? r.urgency}
                          </span>
                        </div>
                        <p className="text-muted text-[11px]">{r.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Projected Demand Summary */}
              <div className="p-6 rounded-3xl bg-white border border-line space-y-2">
                <span className="text-[10px] font-medium text-muted">
                  Proyeksi Permintaan Kuartal Depan
                </span>
                <p className="text-xs text-body leading-relaxed">{aiInsights.projectedDemandSummary}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add New Frame Modal */}
      {showAddFrameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-line rounded-3xl p-6 space-y-5 shadow-float">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-normal tracking-[-0.03em] text-lg text-ink">Tambah Frame ke Katalog</h3>
              <button
                onClick={() => setShowAddFrameModal(false)}
                aria-label="Tutup"
                className="text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFrame} className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Nama Frame</label>
                <input
                  type="text"
                  required
                  placeholder="cth. Monaco Sculpted Acetate"
                  value={newFrameName}
                  onChange={(e) => setNewFrameName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Bentuk</label>
                  <select
                    value={newFrameShape}
                    onChange={(e) => setNewFrameShape(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink"
                  >
                    <option value="Geometric">Geometris</option>
                    <option value="Square">Kotak</option>
                    <option value="Round">Bulat</option>
                    <option value="Aviator">Aviator</option>
                    <option value="Cat-Eye">Cat-Eye</option>
                    <option value="Oval">Oval</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Material</label>
                  <select
                    value={newFrameMaterial}
                    onChange={(e) => setNewFrameMaterial(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink"
                  >
                    <option value="Aerospace Titanium">Titanium Aerospace</option>
                    <option value="Italian Acetate">Asetat Italia</option>
                    <option value="Eco-Polymer">Eko-Polimer</option>
                    <option value="Mixed Titanium Acetate">Kombinasi Titanium & Asetat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newFramePrice}
                    onChange={(e) => setNewFramePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    value={newFrameStock}
                    onChange={(e) => setNewFrameStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={newFrameDesc}
                  onChange={(e) => setNewFrameDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFrameModal(false)}
                  className="px-4 py-2 rounded-full bg-soft-strong text-body text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-ink hover:bg-ink-soft text-white font-medium text-xs"
                >
                  Simpan ke Katalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
