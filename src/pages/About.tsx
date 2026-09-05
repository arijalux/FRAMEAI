import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Eye, TreeDeciduous, Hammer, Compass, Leaf, ArrowRight, Camera, ShieldCheck } from 'lucide-react';

export const About: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-12 py-16 space-y-16">
      {/* Brand Header */}
      <div className="space-y-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black text-white text-[11px] font-bold uppercase tracking-widest">
          <TreeDeciduous size={13} className="text-orange-400" />
          <span>Our Story • BJ Homemade</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-light text-[#1A1A1A] leading-tight">
          Crafted by hand. <br />
          <span className="italic font-normal text-orange-800">Rooted in natural wood.</span>
        </h1>

        <p className="text-lg sm:text-xl text-black/80 font-serif italic leading-relaxed">
          BJ Homemade is an independent Indonesian eyewear studio dedicated to the art of handcrafted wooden frames.
        </p>

        <p className="text-sm sm:text-base text-black/70 leading-relaxed">
          Eyewear sits closer to your personal expression than almost any other object you wear. At BJ Homemade, we craft frames that celebrate the organic texture, grain patterns, warmth, and tactile presence of natural timber. We combine traditional benchcraft with AI-driven discovery and augmented reality, giving you confidence that your chosen frame complements your face.
        </p>
      </div>

      {/* 4 Pillars of Craftsmanship */}
      <div className="space-y-8">
        <div className="border-b border-black/10 pb-4">
          <span className="text-xs uppercase tracking-widest font-bold text-orange-800 block mb-1">
            Core Philosophy
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif italic text-black">The Pillars Behind Every Frame</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-900">
              <Hammer size={22} />
            </div>
            <h3 className="text-2xl font-serif italic text-black">Handcrafted Character</h3>
            <p className="text-sm text-black/70 leading-relaxed">
              Every frame carries the direct touch of bench craftsmanship. Rather than anonymous high-volume molding, our pieces are cut, shaped, filed, and hand-finished individually, ensuring that the character of the making process lives in every subtle contour.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-900">
              <TreeDeciduous size={22} />
            </div>
            <h3 className="text-2xl font-serif italic text-black">Wooden Material</h3>
            <p className="text-sm text-black/70 leading-relaxed">
              We work with natural woods including Indonesian Teak, Sonokeling (Rosewood), Bamboo, and sustainable hardwood veneers. Wood offers a distinct lightness, natural tactile warmth against the temple, and unique grain lines that make every frame genuinely one of a kind.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-900">
              <Compass size={22} />
            </div>
            <h3 className="text-2xl font-serif italic text-black">Local Indonesian Craft</h3>
            <p className="text-sm text-black/70 leading-relaxed">
              BJ Homemade is an independent Indonesian enterprise committed to thoughtful craftsmanship. We believe local artisan production can deliver world-class optical ergonomics and distinctive modern silhouettes that stand out on their own merits.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-900">
              <Leaf size={22} />
            </div>
            <h3 className="text-2xl font-serif italic text-black">Responsible Design</h3>
            <p className="text-sm text-black/70 leading-relaxed">
              We apply natural plant-oil sealants and organic beeswax polishes to protect the timber while preserving its breathability and natural grain. Thoughtful assembly, repairable barrel hinges, and durable finishes ensure each pair is built to last.
            </p>
          </div>
        </div>
      </div>

      {/* Technology & Craftsmanship Banner */}
      <div className="bg-[#1C1917] text-white rounded-[36px] p-8 sm:p-12 space-y-6 shadow-md">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-orange-400">
          <Sparkles size={14} />
          <span>Technology & Craftsmanship</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-serif italic">
          Modern Fitting with Digital Precision
        </h2>

        <p className="text-sm sm:text-base text-white/70 max-w-3xl leading-relaxed">
          Buying handcrafted wooden frames online used to come with uncertainty about face fit and proportional harmony. We bridge this gap directly: customers can discover frames suited to their cheekbone geometry and bridge width with Gemini AI, try them on live with interactive webcam AR, and order directly from our workshop.
        </p>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
          <button
            onClick={() => navigate('/find-my-frame')}
            className="px-8 py-3.5 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 hover:text-white transition-all cursor-pointer shadow-xs"
          >
            Find My Frame (AI)
          </button>
          <button
            onClick={() => navigate('/try-on/frame-the-architect')}
            className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
          >
            Open AR Mirror
          </button>
          <button
            onClick={() => navigate('/explore')}
            className="px-8 py-3.5 border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
          >
            Browse Collection
          </button>
        </div>
      </div>
    </div>
  );
};
