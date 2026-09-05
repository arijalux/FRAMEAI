import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck, Store } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    loginDemoAccount,
  } = useApp();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (password.length < 8) {
          throw new Error('Use a stronger password with at least 8 characters.');
        }
        await signUpWithEmail(email, password, name, 'customer');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (type: 'customer' | 'seller') => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await loginDemoAccount(type);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo account sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsAuthModalOpen(false);
      }}
    >
      <div className="min-h-full flex items-center justify-center py-4 sm:py-8">
        <div
          className="bg-white rounded-[28px] sm:rounded-[36px] max-w-md w-full p-6 sm:p-10 border border-black/10 shadow-2xl relative my-auto animate-in zoom-in-95"
          id="firebase-auth-modal"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full text-black/50 hover:text-black hover:bg-black/5 transition-all cursor-pointer z-10 bg-white/80 backdrop-blur-xs sm:bg-transparent"
            aria-label="Close auth modal"
            id="close-auth-modal-btn"
          >
            <X size={20} />
          </button>

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
              <Sparkles size={11} className="text-orange-400" />
              <span>BJ Homemade Account</span>
            </div>
            <h2 className="text-3xl font-serif italic text-black font-normal">
              {isSignUp ? 'Create account' : 'Sign in to continue'}
            </h2>
            <p className="text-xs text-black/60 leading-relaxed">
              Create an account or sign in to securely continue your purchase and keep track of your order.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white border border-black/15 hover:border-black/40 rounded-full text-xs font-bold uppercase tracking-wider text-black flex items-center justify-center gap-3 transition-all hover:shadow-xs disabled:opacity-50 cursor-pointer"
            id="google-sign-in-btn"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Connecting...' : 'CONTINUE WITH GOOGLE'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-black/10" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">CONTINUE WITH EMAIL</span>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                  Full Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-3.5 text-black/40" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arijal Ibnu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#F5F2ED] rounded-2xl text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-3.5 text-black/40" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F5F2ED] rounded-2xl text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-3.5 text-black/40" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F5F2ED] rounded-2xl text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="text-center pt-1">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-xs text-black/60 hover:text-black font-semibold cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'New to BJ Homemade? Create account'}
            </button>
          </div>

          {/* Quick Demo Access */}
          <div className="pt-3 border-t border-black/5">
            <div className="text-center text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2.5">
              Instant Demo Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('customer')}
                disabled={loading}
                className="p-2.5 bg-[#F5F2ED] hover:bg-[#EAE5DC] text-black rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 border border-black/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 text-black/80">
                  <User size={12} />
                  <span>Demo Customer</span>
                </div>
                <span className="text-[9px] text-black/50 font-normal">Customer Account</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('seller')}
                disabled={loading}
                className="p-2.5 bg-[#F5F2ED] hover:bg-[#EAE5DC] text-black rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 border border-black/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 text-black/80">
                  <Store size={12} />
                  <span>BJ Homemade Admin</span>
                </div>
                <span className="text-[9px] text-black/50 font-normal">Store Management</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
