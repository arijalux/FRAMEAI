import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { BjBrandLogo } from '../ui/BjBrandLogo';

export const Footer: React.FC = () => {
  const { navigate } = useApp();

  return (
    <footer className="bg-[#EFECE6] border-t border-black/10 pt-16 pb-12 transition-all text-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Top Editorial Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-black/10">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div
              onClick={() => navigate('/')}
              className="cursor-pointer flex items-center gap-3 group"
            >
              <BjBrandLogo className="h-8 w-auto text-black group-hover:opacity-80 transition-opacity shrink-0" color="#000000" />
              <div className="flex flex-col items-start">
                <span className="font-serif text-2xl font-bold tracking-tight text-black group-hover:opacity-80 transition-opacity">
                  BJ Homemade
                </span>
                <span className="text-[10px] tracking-wider uppercase text-neutral-500 font-medium mt-0.5">
                  Handcrafted Wooden Eyewear • Est. Indonesia
                </span>
              </div>
            </div>
            <p className="text-sm text-black/70 leading-relaxed max-w-sm">
              Handcrafted Indonesian wooden frames paired with intelligent facial analysis and real-time AR try-on. Natural wood grains, sustainable timber, and digital precision.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-800">
              <Sparkles size={14} />
              <span>Crafted by Hand. Discovered with AI.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-[11px] uppercase tracking-widest font-bold text-black/40">BJ Homemade</span>
            <ul className="space-y-2.5 text-sm text-black/70">
              <li>
                <button onClick={() => navigate('/explore')} className="hover:text-black transition-colors cursor-pointer">
                  Handcrafted Collection
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/find-my-frame')} className="hover:text-black transition-colors cursor-pointer">
                  Find My Frame (AI)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/try-on/frame-uluwatu')} className="hover:text-black transition-colors cursor-pointer">
                  Virtual AR Try-On
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/compare')} className="hover:text-black transition-colors cursor-pointer">
                  Compare Frames
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/');
                    setTimeout(() => {
                      document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="hover:text-black transition-colors cursor-pointer"
                >
                  Our Story & Craft
                </button>
              </li>
            </ul>
          </div>

          {/* Business & Administration */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-[#F5F2ED] p-6 rounded-3xl border border-black/5 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-black/40 font-bold flex items-center gap-1.5">
                <Sparkles size={12} className="text-orange-700" />
                BJ Homemade Atelier
              </span>
              <p className="text-xs text-black/75 leading-relaxed">
                Every frame is hand-carved from Indonesian teakwood, finished with natural beeswax, and fitted with precision optical lenses.
              </p>
              <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                <button
                  onClick={() => navigate('/store-admin')}
                  className="text-[11px] font-bold uppercase tracking-wider text-black/60 hover:text-black transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Store Admin</span>
                  <ArrowUpRight size={12} />
                </button>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck size={12} /> 30-Day Fit Guarantee
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-black/50">
            <span>© 2026 BJ Homemade. Handcrafted Wooden Eyewear. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-black/60 font-medium">
            <span>Free Nationwide Insured Delivery</span>
            <span>•</span>
            <span>Handcrafted in Indonesia</span>
            <span>•</span>
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Our Story
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
