import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { createCustomerOrder } from '../lib/firebase';

interface ShoppingBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onOrderPlaced: (order: Order) => void;
}

export const ShoppingBagDrawer: React.FC<ShoppingBagDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onUpdateQuantity,
  onOrderPlaced,
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
  const [country, setCountry] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, it) => acc + it.calculatedPrice * it.quantity, 0);
  const tax = Number((subtotal * 0.0825).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCheckoutError(null);

    const orderData: Omit<Order, 'id'> = {
      // Overwritten by createCustomerOrder with the signed-in uid or 'guest-checkout'
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
    } catch (err) {
      // Never show a success screen for an order that was not saved
      console.error(err);
      setCheckoutError('We could not place your order. Nothing was charged — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border-l border-neutral-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-lg text-white">
              {checkoutStep === 'cart'
                ? `Shopping Bag (${items.reduce((a, b) => a + b.quantity, 0)})`
                : checkoutStep === 'checkout'
                ? 'Luxury Optical Checkout'
                : 'Order Confirmed'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Shopping Bag"
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
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
                  <div className="w-16 h-16 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif text-lg text-white font-medium">Your shopping bag is empty</h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Explore our luxury optical frames or use AI Face Scan to find your perfect bespoke fit.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex gap-4 relative group"
                    >
                      <img
                        src={it.frame.imageUrl}
                        alt={it.frame.name}
                        className="w-20 h-20 object-cover rounded-xl bg-neutral-900 shrink-0"
                      />

                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="font-serif font-bold text-white text-sm truncate">{it.frame.name}</h4>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          Finish: <span className="text-neutral-200">{it.selectedColor.name}</span>
                        </div>
                        <div className="text-[11px] text-amber-400/90 font-medium mt-1">
                          {it.lensConfig.type.replace('_', ' ').toUpperCase()} ·{' '}
                          {it.lensConfig.index.split('_')[0]} Index
                        </div>
                        {it.lensConfig.blueLightFilter && (
                          <div className="text-[10px] text-neutral-400">Blue Light Shield Included</div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 border border-neutral-800 rounded-lg bg-neutral-900 px-2 py-0.5">
                            <button
                              onClick={() => onUpdateQuantity(it.id, Math.max(1, it.quantity - 1))}
                              className="text-neutral-400 hover:text-white text-xs px-1"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono text-white px-1">{it.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(it.id, it.quantity + 1)}
                              className="text-neutral-400 hover:text-white text-xs px-1"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-mono font-bold text-sm text-white">
                            ${it.calculatedPrice * it.quantity}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveItem(it.id)}
                        aria-label={`Remove ${it.frame.name} from bag`}
                        className="absolute top-4 right-4 text-neutral-500 hover:text-red-400 p-1"
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
                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {checkoutError}
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Contact Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Email for Optical Tracking</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Delivery Destination
                </span>
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Postal Code</label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  FrameAI Optical Warranty & Guarantees
                </div>
                <ul className="text-neutral-400 space-y-1 pl-6 list-disc">
                  <li>30-Day Flawless Vision & Fit Guarantee with free lens remake</li>
                  <li>Handcrafted hardcase & micro-denier cleaning cloth included</li>
                  <li>Complimentary laser-aligned temple adjustment service</li>
                </ul>
              </div>
            </form>
          )}

          {checkoutStep === 'success' && (
            <div className="py-12 text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-serif text-2xl font-bold text-white">Order Successfully Placed</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  Your customized prescription eyewear is queued for precision surfacing in our optical lab.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-left text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-amber-400 font-sans font-bold text-[11px] mb-1">
                  <span>OPTICAL LAB ORDER RECEIPT</span>
                  <span className="font-mono text-neutral-400">{placedOrder?.id}</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Customer:</span>
                  <span className="text-white">{customerName}</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Destination:</span>
                  <span className="text-white">{city}, {country}</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Total Investment:</span>
                  <span className="text-amber-400 font-bold">${placedOrder?.totalAmount ?? total}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {checkoutStep !== 'success' && items.length > 0 && (
          <div className="p-6 border-t border-neutral-800 bg-neutral-950 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal ({items.length} items):</span>
                <span className="text-white font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Hardcase & Optical Care Kit:</span>
                <span className="text-emerald-400 font-semibold font-mono">COMPLIMENTARY</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Insured Express Courier:</span>
                <span className="text-emerald-400 font-semibold font-mono">FREE</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Estimated Sales Tax:</span>
                <span className="text-white font-mono">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800">
                <span>Total:</span>
                <span className="text-amber-400 font-serif text-lg font-bold">${total.toFixed(2)}</span>
              </div>
            </div>

            {checkoutStep === 'cart' ? (
              <button
                onClick={() => setCheckoutStep('checkout')}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {/* No payment is taken yet, so don't label this "Pay" */}
                  {isSubmitting ? 'Placing Order...' : `Place Order · $${total.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        )}

        {checkoutStep === 'success' && (
          <div className="p-6 border-t border-neutral-800 bg-neutral-950">
            <button
              onClick={() => {
                setCheckoutStep('cart');
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm transition-colors"
            >
              Continue Exploring FrameAI
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
