import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ui/ProductCard';
import {
  Heart,
  User,
  Sparkles,
  ShoppingBag,
  Package,
  MapPin,
  Clock,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, wishlist, products, getProductById, faceAnalysis, navigate, signOut, isAuthenticated } = useApp();

  const wishlistedProducts = wishlist
    .map((id) => getProductById(id))
    .filter(Boolean) as typeof products;

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 space-y-12">
      {/* Profile Header */}
      <div className="bg-white rounded-[40px] p-8 sm:p-12 border border-black/5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-2xl sm:text-3xl font-bold shadow-md">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F5F2ED] text-black text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>{user.role === 'seller' ? 'SME Artisan Partner' : 'Eyewear Enthusiast'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif italic text-black">{user.name}</h1>
            <p className="text-xs text-black/50">{user.email || 'Guest Session'} • Member since 2026</p>
            {isAuthenticated && (
              <button
                onClick={() => signOut()}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                id="profile-sign-out-btn"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {faceAnalysis && (
          <div className="bg-[#F5F2ED] p-4 rounded-2xl border border-black/5 text-right flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold tracking-widest text-orange-700 flex items-center gap-1">
              <Sparkles size={11} />
              AI Calibrated Face Profile
            </span>
            <p className="font-serif italic text-lg text-black font-semibold">
              {faceAnalysis.faceShape} Silhouette • {faceAnalysis.stylePreference} Style
            </p>
            <button
              onClick={() => navigate('/recommendations')}
              className="text-xs font-bold text-black hover:underline uppercase tracking-wider mt-1 flex items-center gap-1"
            >
              <span>View Recommendations</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Wishlist Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-black/10 pb-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-orange-700 flex items-center gap-1 mb-1">
              <Heart size={14} className="fill-orange-700" />
              <span>Saved Handcrafted Eyewear</span>
            </span>
            <h2 className="text-3xl font-serif italic text-black">
              Your Wishlist ({wishlistedProducts.length})
            </h2>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="text-xs font-bold uppercase tracking-widest text-black/70 hover:text-black"
          >
            Explore Catalog
          </button>
        </div>

        {wishlistedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-12 text-center border border-black/5 space-y-4">
            <div className="w-16 h-16 bg-[#F5F2ED] rounded-full flex items-center justify-center mx-auto text-black/40">
              <Heart size={28} />
            </div>
            <h3 className="text-2xl font-serif italic text-black">No saved frames yet</h3>
            <p className="text-xs text-black/60 max-w-sm mx-auto leading-relaxed">
              Tap the heart icon on any handcrafted frame in the explore catalog to bookmark it here for later.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="px-8 py-3.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all"
            >
              Discover Frames
            </button>
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="space-y-6 pt-4">
        <div className="border-b border-black/10 pb-4">
          <h2 className="text-3xl font-serif italic text-black">Recent Artisan Orders</h2>
          <p className="text-xs text-black/50 mt-1">
            Tracking craftsmanship and nationwide delivery from Indonesian optical workshops.
          </p>
        </div>

        <div className="bg-white rounded-[36px] p-6 sm:p-8 border border-black/5 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-black/5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-black">Order #FA-892104</span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase">
                  Prescription Glazed
                </span>
              </div>
              <p className="text-xs text-black/50">Dispatched from Optik Melati (Bandung) via JNE Insured</p>
            </div>
            <span className="text-sm font-bold text-black">Rp 1.450.000</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <img
              src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80"
              alt=""
              className="w-16 h-16 bg-[#F5F2ED] rounded-xl object-cover p-1"
            />
            <div>
              <h4 className="font-serif italic text-base text-black font-semibold">The Architect</h4>
              <p className="text-[11px] text-black/50">Onyx Black • Single Vision (Anti-Reflective)</p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                ✓ Out for delivery in Bandung
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
