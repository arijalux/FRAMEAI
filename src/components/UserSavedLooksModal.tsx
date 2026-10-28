import React, { useEffect, useState } from 'react';
import { TryOnLook, Order } from '../types';
import { fetchUserTryOnLooks } from '../lib/firebase';
import { X, Camera, Sparkles, Clock, CheckCircle2, Download, Package } from 'lucide-react';
import { formatRupiah, orderStatusLabel } from '../utils/format';

interface UserSavedLooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const UserSavedLooksModal: React.FC<UserSavedLooksModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const [activeTab, setActiveTab] = useState<'looks' | 'orders'>('looks');
  const [savedLooks, setSavedLooks] = useState<TryOnLook[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    const loadLooks = async () => {
      setIsLoading(true);
      try {
        const looks = await fetchUserTryOnLooks();
        setSavedLooks(looks);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadLooks();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-line rounded-3xl overflow-hidden shadow-float my-8">
        {/* Header */}
        <div className="p-6 border-b border-line flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sage-tint border border-sage-line flex items-center justify-center text-sage">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-normal tracking-[-0.03em] text-xl text-ink">Koleksi Saya</h3>
              <p className="text-xs text-muted">Look AR Tersimpan & Pesanan Lensa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-full hover:bg-soft-strong text-muted hover:text-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 bg-white/40 border-b border-line flex gap-2">
          <button
            onClick={() => setActiveTab('looks')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === 'looks'
                ? 'bg-ink text-white shadow-md'
                : 'text-muted hover:text-ink'
            }`}
          >
            Look AR Tersimpan ({savedLooks.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === 'orders'
                ? 'bg-ink text-white shadow-md'
                : 'text-muted hover:text-ink'
            }`}
          >
            Pesanan & Pelacakan ({orders.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {activeTab === 'looks' && (
            <div>
              {isLoading ? (
                <div className="py-16 text-center text-xs text-muted">Memuat look tersimpan...</div>
              ) : savedLooks.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-soft border border-line flex items-center justify-center mx-auto text-faint">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-medium text-ink">Belum ada look tersimpan</h4>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Coba frame apa saja di studio AR, ketuk tombol foto, lalu simpan look Anda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {savedLooks.map((look) => (
                    <div
                      key={look.id}
                      className="p-3 rounded-2xl bg-soft border border-line space-y-2 group"
                    >
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white">
                        <img src={look.snapshotData} alt={look.frameName} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-ink text-white shadow">
                          Cocok {look.matchScore}%
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-ink">{look.frameName}</div>
                          <div className="text-[10px] text-muted">
                            {new Date(look.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        <a
                          href={look.snapshotData}
                          download={`frameai-${look.frameName}.jpg`}
                          className="p-1.5 rounded-lg bg-white hover:bg-soft-strong text-body"
                          title="Unduh Gambar"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-soft border border-line flex items-center justify-center mx-auto text-faint">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-medium text-ink">Belum ada pesanan</h4>
                  <p className="text-xs text-muted">Atur lensa pada frame pilihan dan checkout untuk melacak proses pembuatannya.</p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl bg-soft border border-line space-y-3 text-xs"
                  >
                    <div className="flex justify-between items-center border-b border-line pb-2">
                      <div>
                        <span className="tabular-nums font-medium text-sage">{ord.id}</span>
                        <div className="text-[11px] text-muted">Dipesan {new Date(ord.createdAt).toLocaleDateString('id-ID')}</div>
                      </div>
                      <span className="tabular-nums font-medium text-ink text-sm">{formatRupiah(ord.totalAmount)}</span>
                    </div>

                    {/* Progress tracking line */}
                    <div className="py-2">
                      <div className="text-[11px] text-muted mb-2 font-medium">
                        Status Pesanan:{' '}
                        <span className="text-sage tabular-nums">{orderStatusLabel(ord.status)}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-center">
                        {[
                          { key: 'received', label: '1. Diterima' },
                          { key: 'crafting_lenses', label: '2. Pembuatan Lensa' },
                          { key: 'optical_qc', label: '3. QC Optik' },
                          { key: 'shipped', label: '4. Dikirim' },
                        ].map((s, idx) => {
                          const orderStatusIndex = ['received', 'crafting_lenses', 'optical_qc', 'shipped', 'delivered'].indexOf(ord.status);
                          const isDone = orderStatusIndex >= idx;
                          return (
                            <div key={s.key} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full ${
                                  isDone ? 'bg-ink-soft shadow-sm' : 'bg-soft-strong'
                                }`}
                              />
                              <span className={`text-[10px] ${isDone ? 'text-ink font-medium' : 'text-faint'}`}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
