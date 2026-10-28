import React, { useEffect, useState } from 'react';
import { Check, LogOut, Package } from 'lucide-react';
import type { User } from '../lib/firebase';
import { Order, UserProfile } from '../types';

interface ProfilePageProps {
  user: User;
  profile: UserProfile | null;
  orders: Order[];
  /** PD from the latest AI face scan, offered as a starting value */
  scannedPd?: number;
  onSave: (profile: UserProfile) => Promise<void>;
  onOpenOrders: () => void;
  onSignOut: () => void;
}

export const emptyProfile = (user: User): UserProfile => ({
  displayName: user.displayName ?? '',
  phone: '',
  shippingAddress: { address: '', city: '', postalCode: '', country: 'Indonesia' },
});

const inputClass =
  'w-full h-11 px-4 rounded-full bg-soft text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-ink';

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  profile,
  orders,
  scannedPd,
  onSave,
  onOpenOrders,
  onSignOut,
}) => {
  const [form, setForm] = useState<UserProfile>(profile ?? emptyProfile(user));
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load the stored profile once it arrives
  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const setAddress = (key: keyof UserProfile['shippingAddress'], value: string) =>
    setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, [key]: value } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    try {
      await onSave(form);
      setStatus('saved');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Identity */}
      <aside className="lg:col-span-4 space-y-6">
        <div className="rounded-3xl bg-sand p-6 space-y-5">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl text-ink">
              {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
            </span>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-normal tracking-[-0.04em] text-ink">{form.displayName || 'Akun Saya'}</h1>
            <p className="text-sm text-muted break-all">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOpenOrders}
              className="h-10 px-4 rounded-full bg-white text-sm text-ink flex items-center gap-2 hover:shadow-card transition-shadow"
            >
              <Package className="w-4 h-4" />
              Pesanan saya ({orders.length})
            </button>
            <button
              onClick={onSignOut}
              className="h-10 px-4 rounded-full text-sm text-muted hover:text-ink flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Editable profile */}
      <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-10">
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-normal tracking-[-0.03em] text-ink">Data diri</h2>
            <p className="text-sm text-muted">Dipakai untuk mengisi checkout secara otomatis.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Nama lengkap</span>
              <input
                required
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Nomor HP</span>
              <input
                type="tel"
                inputMode="tel"
                placeholder="08xxxxxxxxxx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-normal tracking-[-0.03em] text-ink">Alamat pengiriman</h2>
            <p className="text-sm text-muted">Alamat utama untuk pesanan Anda.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">Alamat</span>
              <input
                value={form.shippingAddress.address}
                onChange={(e) => setAddress('address', e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Kota</span>
              <input value={form.shippingAddress.city} onChange={(e) => setAddress('city', e.target.value)} className={inputClass} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Kode pos</span>
              <input
                inputMode="numeric"
                value={form.shippingAddress.postalCode}
                onChange={(e) => setAddress('postalCode', e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-normal tracking-[-0.03em] text-ink">Ukuran mata</h2>
            <p className="text-sm text-muted">
              Jarak pupil (PD) membuat ukuran kacamata di AR dan lensa resep lebih akurat.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1.5 w-40">
              <span className="text-xs text-muted">PD (mm)</span>
              <input
                type="number"
                min={50}
                max={78}
                placeholder="63"
                value={form.pd ?? ''}
                onChange={(e) => setForm({ ...form, pd: e.target.value ? Number(e.target.value) : undefined })}
                className={inputClass}
              />
            </label>
            {scannedPd && scannedPd !== form.pd && (
              <button
                type="button"
                onClick={() => setForm({ ...form, pd: scannedPd })}
                className="h-11 px-4 rounded-full bg-sage-tint text-sm text-sage"
              >
                Pakai hasil scan wajah: {scannedPd} mm
              </button>
            )}
          </div>
        </section>

        <div className="flex items-center gap-4 pt-2 border-t border-line">
          <button
            type="submit"
            disabled={status === 'saving'}
            className="mt-6 h-12 px-6 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {status === 'saving' ? 'Menyimpan...' : 'Simpan profil'}
          </button>
          {status === 'saved' && (
            <span className="mt-6 flex items-center gap-1.5 text-sm text-sage">
              <Check className="w-4 h-4" />
              Tersimpan
            </span>
          )}
          {status === 'error' && (
            <span role="alert" className="mt-6 text-sm text-red-700">
              Gagal menyimpan. Silakan coba lagi.
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
