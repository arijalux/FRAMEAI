import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Heart, LogOut, Package, Store } from 'lucide-react';
import type { User } from '../lib/firebase';

interface ProfileMenuProps {
  user: User;
  role: 'superadmin' | 'admin' | null;
  favoritesCount: number;
  onOpenOrders: () => void;
  onOpenFavorites: () => void;
  onOpenPortal: () => void;
  onSignOut: () => void;
}

/** Signed-in account button: opens a small menu instead of signing out straight away */
export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  user,
  role,
  favoritesCount,
  onOpenOrders,
  onOpenFavorites,
  onOpenPortal,
  onSignOut,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = user.displayName || user.email?.split('@')[0] || 'Akun';

  // Close on a click outside or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  const item = 'w-full h-10 px-3 rounded-xl flex items-center gap-3 text-sm text-ink hover:bg-soft transition-colors text-left';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-full hover:bg-soft text-sm text-ink whitespace-nowrap transition-colors"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-sage-tint text-sage text-xs font-medium uppercase flex items-center justify-center">
            {name.charAt(0)}
          </span>
        )}
        <span className="hidden sm:inline max-w-32 truncate">{name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-line bg-white shadow-float p-2"
        >
          <div className="px-3 py-2.5 space-y-0.5">
            <p className="text-sm text-ink truncate">{name}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
            {role && (
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-sage-tint text-[11px] text-sage">
                {role === 'superadmin' ? 'Superadmin' : 'Admin toko'}
              </span>
            )}
          </div>
          <div className="h-px bg-line my-1" />
          <button role="menuitem" onClick={pick(onOpenOrders)} className={item}>
            <Package className="w-4 h-4 text-muted" />
            Pesanan & look saya
          </button>
          <button role="menuitem" onClick={pick(onOpenFavorites)} className={item}>
            <Heart className="w-4 h-4 text-muted" />
            Favorit
            {favoritesCount > 0 && <span className="ml-auto text-xs text-muted tabular-nums">{favoritesCount}</span>}
          </button>
          {role && (
            <button role="menuitem" onClick={pick(onOpenPortal)} className={item}>
              <Store className="w-4 h-4 text-muted" />
              Portal Toko
            </button>
          )}
          <div className="h-px bg-line my-1" />
          <button role="menuitem" onClick={pick(onSignOut)} className={`${item} text-red-600 hover:bg-red-50`}>
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
};
