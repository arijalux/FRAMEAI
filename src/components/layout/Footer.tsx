import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, MapPin, ShieldCheck, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate } = useApp();

  return (
    <footer className="bg-[#EFECE6] border-t border-black/10 pt-16 pb-12 transition-all text-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Top Editorial Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-black/10">
          {/* Brand Info */}
          <div className="md:col-span-4 space-y-4">
            <div
              onClick={() => navigate('/')}
              className="cursor-pointer text-2xl font-bold tracking-tight italic flex items-center"
            >
              <span className="font-serif text-2xl">FRAMEAI</span>
            </div>
            <p className="text-sm text-black/60 leading-relaxed max-w-sm">
              Empowering Indonesian eyewear artisans and optical SMEs with AI face-shape matching, virtual AR try-on, and seamless digital commerce.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-700">
              <Sparkles size={14} />
              <span>AI Styling for Nusantara Artisans</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <span className="text-[11px] uppercase tracking-widest font-bold text-black/40">Navigation</span>
            <ul className="space-y-2 text-sm text-black/70">
              <li>
                <button onClick={() => navigate('/explore')} className="hover:text-black transition-colors">
                  Explore Catalog
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/find-my-frame')} className="hover:text-black transition-colors">
                  Find My Frame
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/try-on/frame-the-architect')} className="hover:text-black transition-colors">
                  Virtual Try-On
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/compare')} className="hover:text-black transition-colors">
                  Compare Specs
                </button>
              </li>
            </ul>
          </div>

          {/* SME Artisans */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-[11px] uppercase tracking-widest font-bold text-black/40">SME Hub</span>
            <ul className="space-y-2 text-sm text-black/70">
              <li>
                <button onClick={() => navigate('/seller')} className="hover:text-black transition-colors flex items-center gap-1">
                  <span>SME Seller Portal</span>
                  <ArrowUpRight size={13} />
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/seller/products/new')} className="hover:text-black transition-colors">
                  Submit Eyewear Design
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/seller/qr')} className="hover:text-black transition-colors">
                  Offline-to-Online QR
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/seller/ai-insights')} className="hover:text-black transition-colors">
                  Artisan AI Advisory
                </button>
              </li>
            </ul>
          </div>

          {/* Live AI Insight */}
          <div className="md:col-span-3 space-y-3 bg-[#F5F2ED] p-5 rounded-3xl border border-black/5">
            <span className="text-[10px] uppercase tracking-widest text-black/40 font-bold flex items-center gap-1.5">
              <Sparkles size={12} className="text-orange-700" />
              Latest AI Insight
            </span>
            <p className="text-xs italic text-black/80 font-serif leading-relaxed">
              "Rectangular silhouettes create harmonic contrast for oval and round face shapes, elevating minimalist professional poise."
            </p>
            <div className="pt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-black/50 font-semibold">
              <span>Bandung • Jakarta</span>
              <span className="text-emerald-600 font-bold">98% Match Rate</span>
            </div>
          </div>
        </div>

        {/* Bottom Stitch Location Strip */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap items-center gap-6 text-xs text-black/60">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-widest text-[11px] text-black/40">
              <MapPin size={13} className="text-orange-700" />
              <span>Artisan Network:</span>
            </div>
            <span className="hover:text-black cursor-pointer" onClick={() => navigate('/explore')}>Bandung</span>
            <span>•</span>
            <span className="hover:text-black cursor-pointer" onClick={() => navigate('/explore')}>Yogyakarta</span>
            <span>•</span>
            <span className="hover:text-black cursor-pointer" onClick={() => navigate('/explore')}>Jakarta</span>
            <span>•</span>
            <span className="hover:text-black cursor-pointer" onClick={() => navigate('/explore')}>Bali</span>
            <span>•</span>
            <span className="hover:text-black cursor-pointer" onClick={() => navigate('/explore')}>Surabaya</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-black/40">
            <span>© 2026 FRAMEAI. All rights reserved.</span>
            <span className="flex items-center gap-1 text-black/60 font-medium">
              <ShieldCheck size={14} className="text-emerald-600" />
              Indonesian Optical SME Certified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
