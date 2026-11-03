import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { StoreAdmin, addStoreAdmin, fetchStoreAdmins, findUserByEmail, removeStoreAdmin } from '../lib/firebase';

/** Superadmin only: add and remove the store admins who run Portal Toko */
export const StoreAdminManager: React.FC<{ superAdminEmail: string }> = ({ superAdminEmail }) => {
  const [admins, setAdmins] = useState<StoreAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchStoreAdmins()
      .then(setAdmins)
      .catch(() => setMessage({ tone: 'error', text: 'Daftar admin tidak bisa dimuat. Pastikan firestore.rules terbaru sudah di-deploy.' }))
      .finally(() => setLoading(false));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target) return;
    setBusy(true);
    setMessage(null);
    try {
      if (target === superAdminEmail.toLowerCase()) {
        setMessage({ tone: 'error', text: 'Itu email superadmin, aksesnya sudah penuh.' });
      } else if (admins.some((a) => a.email === target)) {
        setMessage({ tone: 'error', text: 'Email ini sudah menjadi admin toko.' });
      } else {
        const profile = await findUserByEmail(target);
        if (!profile) {
          setMessage({
            tone: 'error',
            text: 'Akun dengan email ini belum ditemukan. Minta orangnya masuk ke FrameAI sekali, lalu coba lagi.',
          });
        } else {
          const added = await addStoreAdmin(profile);
          setAdmins((prev) => [...prev, added]);
          setEmail('');
          setMessage({ tone: 'ok', text: `${added.email} sekarang admin toko. Aksesnya aktif saat dia memuat ulang FrameAI.` });
        }
      }
    } catch {
      setMessage({ tone: 'error', text: 'Gagal menambahkan admin. Coba lagi.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (admin: StoreAdmin) => {
    if (!window.confirm(`Cabut akses admin toko untuk ${admin.email}?`)) return;
    setMessage(null);
    try {
      await removeStoreAdmin(admin.uid);
      setAdmins((prev) => prev.filter((a) => a.uid !== admin.uid));
      setMessage({ tone: 'ok', text: `Akses admin ${admin.email} dicabut.` });
    } catch {
      setMessage({ tone: 'error', text: 'Gagal mencabut akses. Coba lagi.' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 rounded-3xl bg-white border border-line p-6 space-y-5 shadow-card">
        <div className="space-y-1">
          <h3 className="text-xl font-normal tracking-[-0.03em] text-ink">Tambah admin toko</h3>
          <p className="text-sm text-muted leading-relaxed">
            Admin toko bisa mengelola katalog, pesanan dan desain custom, tapi tidak bisa menambah atau mencabut admin.
            Orangnya harus sudah pernah masuk ke FrameAI.
          </p>
        </div>
        <form onSubmit={add} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email akun"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl bg-soft text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full h-11 rounded-full bg-ink hover:bg-ink-soft disabled:opacity-60 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {busy ? 'Memproses…' : 'Jadikan admin toko'}
          </button>
        </form>
        {message && (
          <p className={`text-sm ${message.tone === 'ok' ? 'text-sage' : 'text-red-600'}`}>{message.text}</p>
        )}
      </div>

      <div className="lg:col-span-7 rounded-3xl bg-white border border-line overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <h3 className="text-base text-ink">Daftar admin</h3>
          <span className="text-xs text-muted">{admins.length + 1} orang</span>
        </div>
        <ul className="divide-y divide-line">
          <li className="px-6 py-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-sage-tint text-sage flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink truncate">{superAdminEmail}</p>
              <p className="text-xs text-muted">Superadmin · ditetapkan di firestore.rules</p>
            </div>
          </li>
          {loading ? (
            <li className="px-6 py-4 text-sm text-muted">Memuat…</li>
          ) : admins.length === 0 ? (
            <li className="px-6 py-4 text-sm text-muted">Belum ada admin toko.</li>
          ) : (
            admins.map((a) => (
              <li key={a.uid} className="px-6 py-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-soft text-ink flex items-center justify-center text-sm uppercase">
                  {(a.displayName || a.email).charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{a.displayName || a.email}</p>
                  <p className="text-xs text-muted truncate">
                    {a.email} · Admin toko{a.addedBy ? ` · ditambahkan oleh ${a.addedBy}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => remove(a)}
                  className="h-9 px-3 rounded-full border border-line hover:border-red-300 hover:text-red-600 text-xs text-ink flex items-center gap-1.5 transition-colors"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  Cabut
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};
