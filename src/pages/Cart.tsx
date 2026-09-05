import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  CreditCard,
  QrCode,
  CheckCircle2,
} from 'lucide-react';

export const Cart: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartTotal,
    clearCart,
    navigate,
    currentPath,
    isAuthenticated,
    user,
    currentUser,
    openAuthModalWithRedirect,
    createOrder,
    showToast,
  } = useApp();

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'confirmed'>('cart');
  const [recipientName, setRecipientName] = useState(user.name !== 'Eyewear Guest' ? user.name : 'Budi Santoso');
  const [phone, setPhone] = useState('+62 812-3456-7890');
  const [address, setAddress] = useState('Jl. Ir. H. Juanda No. 128, Dago');
  const [city, setCity] = useState('Bandung');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bca' | 'gopay'>('qris');
  const [orderId, setOrderId] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // If user navigates directly to /checkout
  useEffect(() => {
    const clean = (currentPath || '').toString().split('?')[0];
    if (clean === '/checkout') {
      if (!isAuthenticated || !currentUser || user.id === 'user-guest') {
        showToast('Please sign in or create an account to proceed to checkout');
        openAuthModalWithRedirect('/cart');
        setCheckoutStep('cart');
      } else if (cart.length > 0) {
        setCheckoutStep('shipping');
      }
    }
  }, [currentPath, isAuthenticated, currentUser, user.id, cart.length]);

  // Sync recipient name when user logs in
  useEffect(() => {
    if (isAuthenticated && user.name && user.name !== 'Eyewear Guest') {
      setRecipientName(user.name);
    }
  }, [isAuthenticated, user.name]);

  const shippingFee = cartTotal > 1500000 ? 0 : 35000;
  const grandTotal = cartTotal + (cart.length > 0 ? shippingFee : 0);

  const handleProceedToShipping = () => {
    if (!isAuthenticated || !currentUser || user.id === 'user-guest') {
      showToast('Please sign in or create an account to continue to checkout');
      openAuthModalWithRedirect('/cart');
      return;
    }
    setCheckoutStep('shipping');
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !currentUser || user.id === 'user-guest') {
      showToast('Please sign in or create an account to place your order');
      openAuthModalWithRedirect('/cart');
      return;
    }

    if (cart.length === 0) return;

    try {
      setIsSubmittingOrder(true);
      const paymentMethodMap: Record<'qris' | 'bca' | 'gopay', 'QRIS' | 'BCA Virtual Account' | 'GoPay'> = {
        qris: 'QRIS',
        bca: 'BCA Virtual Account',
        gopay: 'GoPay',
      };

      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        productName: `${item.product.name} (${item.selectedColor}, ${item.prescriptionType || 'Standard'})`,
        sellerName: item.product.sellerName,
        price: item.product.price,
        color: item.selectedColor,
        quantity: item.quantity,
        image: item.product.thumbnail || item.product.images[0] || '',
      }));

      const newOrder = await createOrder({
        userId: currentUser.id || user.id,
        customerName: recipientName || user.name || 'Customer',
        customerEmail: user.email || 'customer@bjhomemade.id',
        items: orderItems,
        totalAmount: grandTotal,
        shippingAddress: {
          street: address,
          city: city,
          province: 'Jawa Barat',
          postalCode: '40132',
          courier: 'JNE YES Express Insured',
        },
        paymentMethod: paymentMethodMap[paymentMethod],
        status: 'Paid',
      });

      setOrderId(newOrder.id);
      setCheckoutStep('confirmed');
    } catch (err: any) {
      console.warn('Checkout order creation notice:', err);
      showToast(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (checkoutStep === 'confirmed') {
    return (
      <div className="max-w-2xl mx-auto px-6 sm:px-12 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={40} />
        </div>
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 block">
          Order Placed Successfully
        </span>
        <h1 className="text-4xl font-serif italic text-black">Terima Kasih!</h1>
        <p className="text-sm text-black/60 max-w-md mx-auto leading-relaxed">
          Your order <span className="font-mono font-bold text-black">{orderId}</span> has been dispatched to our partner SME artisans. A confirmation WhatsApp and email invoice have been generated.
        </p>

        <div className="p-6 bg-white rounded-3xl border border-black/5 text-left space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="text-black/40 uppercase font-bold">Recipient:</span>
            <span className="font-semibold text-black">{recipientName} ({phone})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/40 uppercase font-bold">Delivery:</span>
            <span className="font-semibold text-black">{address}, {city}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/40 uppercase font-bold">Payment Status:</span>
            <span className="text-emerald-700 font-bold uppercase">Paid via {paymentMethod.toUpperCase()}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/explore')}
          className="px-10 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-black/10 pb-6">
        <h1 className="text-4xl sm:text-5xl font-serif italic text-black">
          {checkoutStep === 'cart' ? 'Your Shopping Bag' : 'Secure Checkout'}
        </h1>
        <p className="text-sm text-black/60 mt-1">
          Directly supporting local Indonesian eyewear ateliers with insured packaging.
        </p>
      </div>

      {cart.length === 0 && checkoutStep === 'cart' ? (
        <div className="bg-white rounded-[40px] p-12 text-center border border-black/5 space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-[#F5F2ED] rounded-full flex items-center justify-center mx-auto text-black/40">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-2xl font-serif italic text-black">Your bag is empty</h2>
          <p className="text-xs text-black/60 leading-relaxed">
            Discover handcrafted frames matching your face shape from our Indonesian SME network.
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="px-8 py-3.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all"
          >
            Explore Frames
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Cart Items or Shipping Form */}
          <div className="lg:col-span-7 space-y-6">
            {checkoutStep === 'cart' ? (
              <div className="bg-white rounded-[36px] p-6 sm:p-8 border border-black/5 shadow-sm space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-black/50 pb-2 border-b border-black/5">
                  Items in Bag ({cart.length})
                </h2>

                <div className="divide-y divide-black/5 space-y-4">
                  {cart.map((item) => {
                    const uniqueKey = item.id || `${item.product.id}-${item.selectedColor}-${item.prescriptionType || 'standard'}`;
                    const targetId = item.id || item.productId || item.product.id;
                    return (
                      <div key={uniqueKey} className="pt-4 flex gap-4 items-center" id={`cart-item-${uniqueKey}`}>
                        <img
                          src={item.product.thumbnail}
                          alt={item.product.name}
                          className="w-20 h-20 bg-[#F5F2ED] rounded-2xl object-contain p-2 border border-black/5 flex-shrink-0"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.triedFallback) {
                              target.dataset.triedFallback = 'true';
                              target.src = '/images/products/product-01-teak-rect-main.svg';
                            }
                          }}
                        />

                        <div className="flex-grow space-y-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-serif italic text-base text-black font-semibold truncate">
                              {item.product.name}
                            </h3>
                            <button
                              onClick={() => removeFromCart(targetId)}
                              className="text-black/40 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer flex-shrink-0"
                              title="Hapus dari keranjang"
                              id={`cart-remove-${targetId}`}
                              type="button"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <p className="text-[11px] text-black/50 truncate">
                            {item.product.sellerName} • {item.selectedColor} • {item.prescriptionType || 'Standard'}
                          </p>

                          <div className="flex justify-between items-center pt-2 flex-wrap gap-2">
                            <div className="flex items-center gap-2.5 bg-[#F5F2ED] px-3 py-1 rounded-full text-xs font-bold border border-black/5">
                              <button
                                onClick={() => updateCartQuantity(targetId, -1)}
                                className="text-black/60 hover:text-black p-1 hover:bg-white rounded-full transition-all cursor-pointer flex items-center justify-center"
                                title="Kurangi jumlah"
                                id={`cart-decrease-${targetId}`}
                                type="button"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="min-w-[18px] text-center font-mono font-bold text-black select-none">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(targetId, 1)}
                                className="text-black/60 hover:text-black p-1 hover:bg-white rounded-full transition-all cursor-pointer flex items-center justify-center"
                                title="Tambah jumlah"
                                id={`cart-increase-${targetId}`}
                                type="button"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <span className="text-sm font-bold text-black whitespace-nowrap">
                              Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* SHIPPING ADDRESS & PAYMENT METHOD */
              <div className="bg-white rounded-[36px] p-6 sm:p-8 border border-black/5 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-black/50">
                    Shipping & Delivery Details
                  </h2>
                  <button
                    onClick={() => setCheckoutStep('cart')}
                    className="text-xs font-bold text-orange-700 hover:underline"
                  >
                    Edit Bag
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full p-3 bg-[#F5F2ED] rounded-xl text-xs font-medium text-black focus:outline-none border border-transparent focus:border-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                      Phone Number (WhatsApp)
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 bg-[#F5F2ED] rounded-xl text-xs font-medium text-black focus:outline-none border border-transparent focus:border-black"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-3 bg-[#F5F2ED] rounded-xl text-xs font-medium text-black focus:outline-none border border-transparent focus:border-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                      City / Region
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-3 bg-[#F5F2ED] rounded-xl text-xs font-medium text-black focus:outline-none border border-transparent focus:border-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      defaultValue="40132"
                      className="w-full p-3 bg-[#F5F2ED] rounded-xl text-xs font-medium text-black focus:outline-none border border-transparent focus:border-black"
                    />
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="pt-4 border-t border-black/5 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 block">
                    Payment Gateway
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'qris', label: 'QRIS Instant', icon: QrCode },
                      { id: 'bca', label: 'BCA Virtual Account', icon: CreditCard },
                      { id: 'gopay', label: 'GoPay / OVO', icon: ShieldCheck },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === m.id
                            ? 'bg-black text-white border-black font-semibold shadow-xs'
                            : 'bg-[#F5F2ED] text-black/70 border-black/10 hover:border-black/30'
                        }`}
                      >
                        <m.icon size={16} />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 bg-white rounded-[36px] p-6 sm:p-8 border border-black/5 shadow-sm space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-black/50 pb-2 border-b border-black/5">
              Order Breakdown
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-black/70">
                <span>Subtotal ({cart.length} items)</span>
                <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-black/70">
                <span>Nationwide Shipping</span>
                <span>{shippingFee === 0 ? 'FREE (Orders > 1.5M)' : `Rp ${shippingFee.toLocaleString('id-ID')}`}</span>
              </div>
              <div className="flex justify-between text-black/70">
                <span>Prescription Glazing & Verification</span>
                <span className="text-emerald-700 font-bold">Complimentary</span>
              </div>

              <div className="pt-4 border-t border-black/10 flex justify-between items-baseline">
                <span className="text-sm font-bold uppercase tracking-wider text-black">Total</span>
                <span className="text-2xl font-serif italic font-bold text-black">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {checkoutStep === 'cart' ? (
              <button
                onClick={handleProceedToShipping}
                className="w-full py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                id="cart-proceed-to-checkout-btn"
              >
                <span>Proceed to Shipping</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmittingOrder}
                className="w-full py-4 bg-orange-700 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                id="cart-confirm-order-btn"
              >
                <ShieldCheck size={14} />
                <span>{isSubmittingOrder ? 'Securing Order...' : 'Pay & Place Order'}</span>
              </button>
            )}

            <div className="p-4 bg-[#F5F2ED] rounded-2xl text-[11px] text-black/60 leading-relaxed flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
              <span>30-day money-back guarantee with free shape exchange if unsuited.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
