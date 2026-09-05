import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BjBrandLogo } from '../ui/BjBrandLogo';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Box,
  Sparkles,
  ExternalLink,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  Store,
} from 'lucide-react';

export const SellerNavigation: React.FC = () => {
  const {
    currentPath,
    navigate,
    user,
    signOut,
    orders,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Paid' || o.status === 'Processing').length;

  const adminNavLinks = [
    { label: 'Dashboard', path: '/seller', icon: LayoutDashboard },
    { label: 'Products', path: '/seller/catalog', icon: Package },
    {
      label: 'Orders',
      path: '/seller/orders',
      icon: ClipboardList,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { label: 'AR Display', path: '/seller/ar-display', icon: Box },
    { label: 'AI Advisory', path: '/seller/ai-advisory', icon: Sparkles },
  ];

  const isCurrent = (path: string) => {
    const safePath = (currentPath || '/').toString();
    if (path === '/seller' && (safePath === '/seller' || safePath === '/seller/dashboard' || safePath === '/admin')) return true;
    if (path === '/seller/ar-display' && (safePath.startsWith('/seller/ar-display') || safePath.startsWith('/seller/qr'))) return true;
    if (path !== '/seller' && safePath.startsWith(path)) return true;
    return false;
  };

  const handleSwitchToCustomer = () => {
    navigate('/');
  };

  const handlePreviewStorefront = () => {
    navigate('/explore');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1C1917] text-white border-b border-white/10 shadow-lg transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-4 flex items-center justify-between">
        {/* Brand & Admin Identification */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigate('/seller')}
            className="cursor-pointer flex items-center gap-2.5 group select-none"
            id="seller-nav-logo"
          >
            <BjBrandLogo className="h-7 w-auto text-white group-hover:opacity-80 transition-opacity shrink-0" color="#FFFFFF" />
            <div className="flex flex-col">
              <span className="font-serif font-bold tracking-tight text-xl sm:text-2xl text-white leading-none">
                BJ Homemade
              </span>
              <span className="text-[9px] uppercase tracking-widest text-white/50 font-sans mt-0.5 font-medium">
                Store Admin
              </span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-white/70">
          {adminNavLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`relative transition-colors hover:text-white py-1 cursor-pointer flex items-center gap-1.5 ${
                isCurrent(link.path) ? 'text-white font-bold' : ''
              }`}
            >
              <link.icon size={13} className={isCurrent(link.path) ? 'text-orange-400' : 'text-white/50'} />
              <span>{link.label}</span>
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
            title="Preview customer storefront"
            id="seller-preview-storefront-btn"
          >
            <ExternalLink size={13} className="text-orange-400" />
            <span>Storefront</span>
          </button>

          {/* User Profile Dropdown */}
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
                  <p className="font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-orange-400 uppercase font-semibold">Store Administrator</p>
                </div>

                <button
                  onClick={() => {
                    handlePreviewStorefront();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink size={13} className="text-orange-400" />
                  <span>Public Storefront</span>
                </button>

                <button
                  onClick={() => {
                    navigate('/seller/orders');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <ClipboardList size={13} />
                  <span>Manage Orders ({orders.length})</span>
                </button>

                <button
                  onClick={() => {
                    handleSwitchToCustomer();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 rounded-xl flex items-center gap-2 cursor-pointer"
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
            {adminNavLinks.map((link) => (
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
                <div className="flex items-center gap-2">
                  <link.icon size={14} />
                  <span>{link.label}</span>
                </div>
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
