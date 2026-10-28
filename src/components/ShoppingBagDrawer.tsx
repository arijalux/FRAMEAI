import React, { useState } from 'react';
import { CartItem, Order, ShippingAddress, UserProfile } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatRupiah, lensTypeLabel, PPN_RATE } from '../utils/format';
import { createCustomerOrder, type User } from '../lib/firebase';

interface ShoppingBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onOrderPlaced: (order: Order) => void;
  user: User | null;
  profile: UserProfile | null;
  /** Called instead of opening the checkout form when nobody is signed in */
  onRequireLogin: () => void;
  onSaveAddress: (name: string, address: ShippingAddress) => void;
}

export const ShoppingBagDrawer: React.FC<ShoppingBagDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onUpdateQuantity,
  onOrderPlaced,
  user,
  profile,
  onRequireLogin,
  onSaveAddress,
}) => {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Checkout form
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [country, setCountry] = useState<string>('Indonesia');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState<boolean>(true);

  if (!isOpen) return null;

  // Checkout needs an account: orders are tied to the user and tracked in their profile
  const startCheckout = () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    // Prefill from the account and saved profile, without overwriting anything already typed
    setCustomerName((v) => v || profile?.displayName || user.displayName || '');
    setCustomerEmail((v) => v || user.email || '');
    setAddress((v) => v || profile?.shippingAddress.address || '');
    setCity((v) => v || profile?.shippingAddress.city || '');
    setPostalCode((v) => v || profile?.shippingAddress.postalCode || '');
    setCheckoutStep('checkout');
  };

  const subtotal = items.reduce((acc, it) => acc + it.calculatedPrice * it.quantity, 0);
  const tax = Math.round(subtotal * PPN_RATE);
  const total = subtotal + tax;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCheckoutError(null);

    const orderData: Omit<Order, 'id'> = {
      // Overwritten by createCustomerOrder with the signed-in uid
      userId: '',
      customerName,
      customerEmail,
      items,
      totalAmount: total,
      status: 'crafting_lenses',
      shippingAddress: {
        address,
        city,
        postalCode,
        country,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const orderId = await createCustomerOrder(orderData);
      const completedOrder: Order = { ...orderData, id: orderId };
      setPlacedOrder(completedOrder);
      setCheckoutStep('success');
      onOrderPlaced(completedOrder);
      if (saveAddress) onSaveAddress(customerName, { address, city, postalCode, country });
    } catch (err) {
      // Never show a success screen for an order that was not saved
      console.error(err);
      setCheckoutError('Pesanan gagal dibuat dan tidak ada biaya yang ditagihkan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white border-l border-line h-full flex flex-col justify-between shadow-float animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-line flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-sage" />
            <h3 className="font-normal tracking-[-0.03em] text-lg text-ink">
              {checkoutStep === 'cart'
                ? `Keranjang (${items.reduce((a, b) => a + b.quantity, 0)})`
                : checkoutStep === 'checkout'
                ? 'Checkout'
                : 'Pesanan Dikonfirmasi'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Keranjang"
            className="p-2 rounded-full hover:bg-soft-strong text-muted hover:text-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {checkoutStep === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-soft border border-line flex items-center justify-center mx-auto text-faint">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h4 className="font-display text-lg text-ink font-medium">Keranjang Anda masih kosong</h4>
                  <p className="text-xs text-muted max-w-xs mx-auto">
                    Lihat koleksi frame kami atau gunakan Scan Wajah AI untuk menemukan frame yang paling pas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="p-4 rounded-2xl bg-soft border border-line flex gap-4 relative group"
                    >
                      <img
                        src={it.frame.imageUrl}
                        alt={it.frame.name}
                        className="w-20 h-20 object-cover rounded-xl bg-white shrink-0"
                      />

                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="font-normal tracking-[-0.03em] text-ink text-sm truncate">{it.frame.name}</h4>
                        <div className="text-xs text-muted mt-0.5">
                          Warna: <span className="text-ink">{it.selectedColor.name}</span>
                        </div>
                        <div className="text-[11px] text-sage font-medium mt-1">
                          {lensTypeLabel(it.lensConfig.type)} ·{' '}
                          Indeks {it.lensConfig.index.split('_')[0]}
                        </div>
                        {it.lensConfig.blueLightFilter && (
                          <div className="text-[10px] text-muted">Termasuk Filter Blue Light</div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 border border-line rounded-lg bg-white px-2 py-0.5">
                            <button
                              onClick={() => onUpdateQuantity(it.id, Math.max(1, it.quantity - 1))}
                              className="text-muted hover:text-ink text-xs px-1"
                            >
                              -
                            </button>
                            <span className="text-xs tabular-nums text-ink px-1">{it.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(it.id, it.quantity + 1)}
                              className="text-muted hover:text-ink text-xs px-1"
                            >
                              +
                            </button>
                          </div>
                          <span className="tabular-nums font-medium text-sm text-ink">
                            {formatRupiah(it.calculatedPrice * it.quantity)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveItem(it.id)}
                        aria-label={`Hapus ${it.frame.name} dari keranjang`}
                        className="absolute top-4 right-4 text-faint hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {checkoutStep === 'checkout' && (
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              {checkoutError && (
                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-700">
                  {checkoutError}
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xs font-medium text-body">
                  Informasi Kontak
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] text-muted block mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted block mb-1">Email untuk Pelacakan Pesanan</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-xs font-medium text-body">
                  Alamat Pengiriman
                </span>
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[11px] text-muted block mb-1">Alamat</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-muted block mb-1">Kota</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink focus:outline-none focus:border-ink"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted block mb-1">Kode Pos</label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-soft border border-line text-xs text-ink focus:outline-none focus:border-ink"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="w-4 h-4 accent-ink"
                />
                Simpan alamat ini ke profil saya
              </label>

              <div className="p-4 rounded-2xl bg-soft border border-line space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  Garansi FrameAI
                </div>
                <ul className="text-muted space-y-1 pl-6 list-disc">
                  <li>Garansi pas & penglihatan 30 hari, termasuk pembuatan ulang lensa gratis</li>
                  <li>Termasuk hardcase dan kain pembersih microfiber</li>
                  <li>Gratis layanan penyetelan gagang</li>
                </ul>
              </div>
            </form>
          )}

          {checkoutStep === 'success' && (
            <div className="py-12 text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-display text-2xl font-medium text-ink">Pesanan Berhasil Dibuat</h4>
                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                  Kacamata Anda sudah masuk antrean pembuatan di lab optik kami.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-soft border border-line text-left text-xs space-y-1.5 tabular-nums">
                <div className="flex items-center justify-between text-sage font-sans font-medium text-[11px] mb-1">
                  <span>BUKTI PESANAN</span>
                  <span className="tabular-nums text-muted">{placedOrder?.id}</span>
                </div>
                <div className="flex justify-between text-body">
                  <span>Pelanggan:</span>
                  <span className="text-ink">{customerName}</span>
                </div>
                <div className="flex justify-between text-body">
                  <span>Tujuan:</span>
                  <span className="text-ink">{city}, {country}</span>
                </div>
                <div className="flex justify-between text-body">
                  <span>Total:</span>
                  <span className="text-sage font-medium">{formatRupiah(placedOrder?.totalAmount ?? total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {checkoutStep !== 'success' && items.length > 0 && (
          <div className="p-6 border-t border-line bg-soft space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal ({items.length} item):</span>
                <span className="text-ink tabular-nums">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Hardcase & Perlengkapan Perawatan:</span>
                <span className="text-emerald-700 font-medium tabular-nums">GRATIS</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Kurir Ekspres Berasuransi:</span>
                <span className="text-emerald-700 font-medium tabular-nums">GRATIS</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>PPN 11%:</span>
                <span className="text-ink tabular-nums">{formatRupiah(tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-ink pt-2 border-t border-line">
                <span>Total:</span>
                <span className="text-sage font-display text-lg font-medium">{formatRupiah(total)}</span>
              </div>
            </div>

            {checkoutStep === 'cart' ? (
              <button
                onClick={startCheckout}
                className="w-full py-3 px-4 rounded-full bg-ink hover:bg-ink-soft text-white font-medium text-sm shadow-card flex items-center justify-center gap-2 transition-all"
              >
                Lanjut ke Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="px-4 py-3 rounded-full bg-soft-strong hover:bg-line-strong text-xs font-medium text-ink transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-full bg-ink hover:bg-ink-soft text-white font-medium text-sm shadow-card flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {/* No payment is taken yet, so don't label this "Bayar" */}
                  {isSubmitting ? 'Membuat Pesanan...' : `Buat Pesanan · ${formatRupiah(total)}`}
                </button>
              </div>
            )}
          </div>
        )}

        {checkoutStep === 'success' && (
          <div className="p-6 border-t border-line bg-soft">
            <button
              onClick={() => {
                setCheckoutStep('cart');
                onClose();
              }}
              className="w-full py-3 px-4 rounded-full bg-soft-strong hover:bg-line-strong text-ink font-medium text-sm transition-colors"
            >
              Lanjut Belanja
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
