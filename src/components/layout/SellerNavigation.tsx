import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  LayoutDashboard,
  Package,
  ClipboardList,
  QrCode,
  Sparkles,
  ExternalLink,
  User,
  LogOut,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  Building2,
} from 'lucide-react';

export const SellerNavigation: React.FC = () => {
  const {
    currentPath,
    navigate,
    user,
    sellers,
    setUserRole,
    signOut,
    orders,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Active seller determination
  const currentSeller =
    sellers.find((s) => s.id === user.sellerId) ||
    sellers[0] || {
      id: 'seller-optik-melati',
      name: 'Optik Melati Bandung',
      location: 'Bandung',
      province: 'West Java',
    };

  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Paid' || o.status === 'Processing').length;

  const sellerNavLinks = [
    { label: 'Dashboard', path: '/seller' },
    { label: 'Catalog', path: '/seller/catalog' },
    {
      label: 'Orders',
      path: '/seller/orders',
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { label: 'AR Product Display', path: '/seller/ar-display' },
    { label: 'AI Advisory', path: '/seller/ai-advisory' },
  ];

  const isCurrent = (path: string) => {
    const safePath = (currentPath || '/').toString();
    if (path === '/seller' && (safePath === '/seller' || safePath === '/seller/dashboard')) return true;
    if (path === '/seller/ar-display' && (safePath.startsWith('/seller/ar-display') || safePath.startsWith('/seller/qr'))) return true;
    if (path !== '/seller' && safePath.startsWith(path)) return true;
    return false;
  };

  const handleSwitchToCustomer = () => {
    navigate('/');
  };

  const handlePreviewStorefront = () => {
    navigate(`/store/${currentSeller.id}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1C1917] text-white border-b border-white/10 shadow-lg transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-4 flex items-center justify-between">
        {/* Brand & Seller Identification */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => navigate('/seller')}
            className="cursor-pointer text-2xl font-bold tracking-tight italic flex items-center group"
            id="seller-nav-logo"
          >
            <span className="font-serif tracking-tighter text-2xl text-white">FRAMEAI</span>
          </div>
        </div>

        {/* Seller Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-white/70">
          {sellerNavLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`relative transition-colors hover:text-white py-1 cursor-pointer flex items-center gap-1.5 ${
                isCurrent(link.path) ? 'text-white font-bold' : ''
              }`}
            >
              {link.label}
              {link.badge !== undefined && (
                <span className="w-4 h-4 bg-orange-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold animate-pulse">
                  {link.badge}
                </span>
              )}
              {isCurrent(link.path) && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Public Store Preview Button */}
          <button
            onClick={handlePreviewStorefront}
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer shadow-xs"
            title="View public storefront as a customer"
            id="seller-preview-storefront-btn"
          >
            <ExternalLink size={13} className="text-orange-400" />
            <span>Preview Store</span>
          </button>

          {/* Switch to Customer View Pill */}
          <button
            onClick={handleSwitchToCustomer}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider h-10 px-4 rounded-full bg-white text-black hover:bg-neutral-200 transition-all shadow-sm cursor-pointer"
            title="Return to Customer Shopping Experience"
            id="nav-switch-to-customer-btn"
          >
            <User size={14} />
            <span>Customer View</span>
          </button>

          {/* User/Atelier Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 border border-white/10 hover:border-white/30 transition-all cursor-pointer text-xs"
              id="seller-profile-dropdown-btn"
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-orange-700 text-white text-[10px] flex items-center justify-center font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 top-12 w-56 bg-[#262320] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 text-white">
                <div className="px-3 py-2 border-b border-white/10 text-xs">
                  <p className="font-bold text-white truncate">{currentSeller.name}</p>
                  <p className="text-[10px] text-white/50">{currentSeller.location}, {currentSeller.province}</p>
                </div>

                <button
                  onClick={() => {
                    handlePreviewStorefront();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 rounded-xl flex items-center gap-2"
                >
                  <ExternalLink size={13} className="text-orange-400" />
                  <span>Public Storefront</span>
                </button>

                <button
                  onClick={() => {
                    navigate('/seller/orders');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 rounded-xl flex items-center gap-2"
                >
                  <ClipboardList size={13} />
                  <span>Manage Orders ({orders.length})</span>
                </button>

                <button
                  onClick={() => {
                    handleSwitchToCustomer();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 rounded-xl flex items-center gap-2"
                >
                  <User size={13} />
                  <span>Switch to Customer View</span>
                </button>

                <button
                  onClick={async () => {
                    setProfileDropdownOpen(false);
                    await signOut();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-2 border-t border-white/10 mt-1 cursor-pointer transition-colors"
                  id="seller-sign-out-btn"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white/80 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#24211E] border-b border-white/10 px-6 py-6 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-2">
            {sellerNavLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-xs font-semibold uppercase tracking-widest py-2.5 px-3 rounded-xl flex items-center justify-between ${
                  isCurrent(link.path) ? 'bg-orange-700 text-white' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-[10px]">
                    {link.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <button
              onClick={() => {
                handlePreviewStorefront();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 border border-white/15 cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Preview Public Storefront</span>
            </button>
            <button
              onClick={() => {
                handleSwitchToCustomer();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 cursor-pointer"
            >
              <User size={14} />
              <span>Return to Customer View</span>
            </button>
            <button
              onClick={async () => {
                setMobileMenuOpen(false);
                await signOut();
              }}
              className="w-full py-3 bg-red-950/50 text-red-400 border border-red-800/40 text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 cursor-pointer hover:bg-red-900/50 transition-colors"
              id="seller-mobile-sign-out-btn"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
