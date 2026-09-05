import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, Heart, Store, User, Menu, X, ArrowRight, LogIn, LogOut, SlidersHorizontal } from 'lucide-react';
import { BjBrandLogo } from '../ui/BjBrandLogo';

export const CustomerNavigation: React.FC = () => {
  const {
    currentPath,
    navigate,
    user,
    isAuthenticated,
    setIsAuthModalOpen,
    signOut,
    setUserRole,
    cartCount,
    wishlist,
    compareList,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const customerNavLinks: { label: string; path: string; badge?: string | number }[] = [
    { label: 'Home', path: '/' },
    { label: 'Collection', path: '/explore' },
    { label: 'Find My Frame', path: '/find-my-frame' },
    { label: 'AR Try-On', path: '/try-on/frame-uluwatu' },
  ];

  const isCurrent = (path: string) => {
    const safePath = (currentPath || '/').toString();
    if (path === '/' && (safePath === '/' || safePath === '')) return true;
    if (path !== '/' && safePath.startsWith(path)) return true;
    return false;
  };

  const handleSwitchToSeller = () => {
    navigate('/seller');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F5F2ED]/90 backdrop-blur-md border-b border-black/5 transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="cursor-pointer flex items-center group select-none"
          id="customer-nav-logo"
        >
          <BjBrandLogo
            className="h-8 sm:h-9 w-auto text-black group-hover:opacity-80 transition-opacity shrink-0"
            color="#000000"
          />
        </div>

        {/* Customer Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-black/60">
          {customerNavLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`relative transition-colors hover:text-black py-1 cursor-pointer flex items-center gap-1.5 ${
                isCurrent(link.path) ? 'text-black font-bold' : ''
              }`}
            >
              {link.label}
              {link.badge !== undefined && (
                <span className="w-4 h-4 bg-orange-700 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {link.badge}
                </span>
              )}
              {isCurrent(link.path) && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Right Action Icons & Badges */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Auth Button */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="h-10 flex items-center gap-2 px-3.5 bg-white border border-black/10 rounded-full text-xs font-semibold hover:border-black/30 transition-all cursor-pointer"
                id="customer-user-profile-btn"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="max-w-[90px] truncate hidden sm:inline">{user.name.split(' ')[0]}</span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white border border-black/10 rounded-2xl p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-black/5 text-xs">
                    <p className="font-bold text-black truncate">{user.name}</p>
                    <p className="text-[10px] text-black/50 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-black hover:bg-[#F5F2ED] rounded-xl flex items-center gap-2"
                  >
                    <User size={13} />
                    <span>My Profile & Wishlist</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-black/70 hover:text-black hover:bg-[#F5F2ED] rounded-xl flex items-center gap-2"
                    id="nav-store-admin-btn"
                  >
                    <Store size={13} />
                    <span>Store Admin</span>
                  </button>
                  <button
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      await signOut();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    id="customer-sign-out-btn"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="h-10 px-4 bg-black text-white text-[11px] font-bold uppercase tracking-wider rounded-full hover:bg-orange-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              id="customer-login-btn"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}

          {/* Compare Button */}
          <button
            onClick={() => navigate('/compare')}
            className="relative w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-black/70 hover:text-black hover:border-black/30 hover:bg-white transition-all cursor-pointer"
            title="Compare frames"
            id="customer-nav-compare-btn"
          >
            <SlidersHorizontal size={15} />
            {compareList.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-700 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                {compareList.length}
              </span>
            )}
          </button>

          {/* Wishlist Button */}
          <button
            onClick={() => navigate('/profile')}
            className="relative w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-black/70 hover:text-black hover:border-black/30 hover:bg-white transition-all cursor-pointer"
            title="Wishlist"
            id="customer-wishlist-btn"
          >
            <Heart size={16} className={wishlist.length > 0 ? 'fill-orange-700 text-orange-700' : ''} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-700 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => navigate('/cart')}
            className="relative h-10 px-4 rounded-full bg-white border border-black/15 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all shadow-xs cursor-pointer group"
            id="customer-cart-btn"
          >
            <ShoppingBag size={14} />
            <span>Bag</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 bg-black text-white group-hover:bg-white group-hover:text-black rounded-full text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-black/80 hover:text-black cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F5F2ED] border-b border-black/10 px-6 py-6 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-2">
            {customerNavLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-xs font-semibold uppercase tracking-widest py-2.5 px-3 rounded-xl flex items-center justify-between ${
                  isCurrent(link.path) ? 'bg-black text-white' : 'text-black/80 hover:bg-black/5'
                }`}
              >
                <span>{link.label}</span>
                <ArrowRight size={14} className="opacity-40" />
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-black/10 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await signOut();
                }}
                className="w-full py-3 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 cursor-pointer hover:bg-red-200 transition-colors"
                id="customer-mobile-sign-out-btn"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3 bg-white border border-black/20 text-black text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
