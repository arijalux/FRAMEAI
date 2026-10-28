import React, { useState } from 'react';
import { X, Eye, ShieldCheck } from 'lucide-react';
import { loginWithGoogle, describeAuthError } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Why the user is being asked to sign in, e.g. before checkout */
  reason?: string;
}

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, reason }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      // On success the parent closes this modal from onAuthStateChanged (so it can also resume
      // checkout); a null result means we switched to a redirect and the page is navigating away
      await loginWithGoogle();
    } catch (e) {
      console.warn('Google sign-in failed:', e);
      setError(describeAuthError(e));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative w-full max-w-sm rounded-[28px] bg-white p-7 shadow-float space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-soft text-muted flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-4">
          <span className="w-10 h-10 rounded-full border-[1.5px] border-ink flex items-center justify-center">
            <Eye className="w-5 h-5 text-ink" />
          </span>
          <div className="space-y-1.5">
            <h2 id="auth-title" className="text-2xl font-normal tracking-[-0.03em] text-ink">
              Masuk ke FrameAI
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              {reason ?? 'Simpan look AR, alamat pengiriman, dan lacak pesanan Anda.'}
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-700 leading-relaxed">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={isSigningIn}
          className="w-full h-12 rounded-full border border-line hover:border-ink text-sm font-medium text-ink flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
        >
          <GoogleLogo />
          {isSigningIn ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
        </button>

        <p className="flex items-start gap-2 text-xs text-muted leading-relaxed">
          <ShieldCheck className="w-4 h-4 shrink-0 text-sage" />
          Kami hanya memakai nama dan email dari akun Google Anda. Foto dari kamera AR tidak pernah diunggah tanpa
          izin Anda.
        </p>
      </div>
    </div>
  );
};
