import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { loginWithEmail, loginWithGoogle, registerWithEmail, resetPassword } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'login' | 'register' | 'reset';

// Firebase error codes in plain Indonesian; anything else gets a generic message
const ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Email atau password salah.',
  'auth/wrong-password': 'Email atau password salah.',
  'auth/user-not-found': 'Email atau password salah.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/email-already-in-use': 'Email ini sudah terdaftar. Masuk, atau pakai Lupa password.',
  'auth/weak-password': 'Password minimal 6 karakter.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
  'auth/operation-not-allowed': 'Login dengan email belum diaktifkan di Firebase.',
  'auth/network-request-failed': 'Koneksi bermasalah. Periksa internet lalu coba lagi.',
};
const errorMessage = (e: unknown) => ERRORS[(e as { code?: string })?.code ?? ''] ?? 'Terjadi kesalahan. Coba lagi.';

/** Sign in with Google or with email and password, register, or reset a password */
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setNotice(null);
    setPassword('');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        await registerWithEmail(name, email, password);
        onClose();
      } else {
        await resetPassword(email);
        setNotice('Kalau email ini terdaftar, link untuk mengatur password sudah dikirim. Cek juga folder spam.');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') setError(errorMessage(err));
    }
  };

  const title = mode === 'login' ? 'Masuk ke FrameAI' : mode === 'register' ? 'Buat akun' : 'Lupa password';
  const input =
    'w-full h-12 px-4 rounded-2xl bg-soft text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white border border-line rounded-3xl shadow-float p-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-title" className="text-2xl font-normal tracking-[-0.03em] text-ink">
              {title}
            </h2>
            {mode === 'reset' && (
              <p className="text-sm text-muted mt-1">Masukkan email akunmu, kami kirim link untuk mengatur password baru.</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Tutup" className="p-2 -m-2 rounded-full hover:bg-soft text-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode !== 'reset' && (
          <>
            <button
              type="button"
              onClick={google}
              className="w-full h-12 rounded-full border border-line hover:border-ink text-ink text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8.1z" />
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
              </svg>
              Lanjutkan dengan Google
            </button>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex-1 h-px bg-line" />
              atau dengan email
              <span className="flex-1 h-px bg-line" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <input
              type="text"
              autoComplete="name"
              placeholder="Nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={input}
            />
          )}
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
          {mode !== 'reset' && (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder={mode === 'register' ? 'Password (min. 6 karakter)' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${input} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {mode === 'login' && (
            <button type="button" onClick={() => switchMode('reset')} className="text-xs text-muted hover:text-ink">
              Lupa password?
            </button>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-sage">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 rounded-full bg-ink hover:bg-ink-soft disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : mode === 'register' ? 'Daftar' : 'Kirim link'}
          </button>
        </form>

        <p className="text-sm text-muted text-center">
          {mode === 'login' ? (
            <>
              Belum punya akun?{' '}
              <button onClick={() => switchMode('register')} className="text-ink underline underline-offset-2">
                Daftar
              </button>
            </>
          ) : (
            <>
              {mode === 'register' ? 'Sudah punya akun? ' : 'Ingat password? '}
              <button onClick={() => switchMode('login')} className="text-ink underline underline-offset-2">
                Masuk
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
