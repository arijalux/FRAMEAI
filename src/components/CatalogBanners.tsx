import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { PRINCIPLE_ILLUSTRATIONS } from './PrincipleIllustrations';

interface CatalogBannersProps {
  onOpenCustom: () => void;
  onOpenTryOn: () => void;
  onOpenPartner: () => void;
}

const INTERVAL = 6000;

/** Rotating banners above Koleksi: custom design, the maker, and trying frames on with AR */
export const CatalogBanners: React.FC<CatalogBannersProps> = ({ onOpenCustom, onOpenTryOn, onOpenPartner }) => {
  const still = Boolean(useReducedMotion());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const CoDesign = PRINCIPLE_ILLUSTRATIONS[5];
  const Digital = PRINCIPLE_ILLUSTRATIONS[4];
  const banners = [
    {
      key: 'custom',
      eyebrow: 'Desain custom',
      title: 'Belum ada yang pas? Desain frame kayumu sendiri.',
      text: 'Atur bentuk dan ukurannya dari hasil scan wajah, coba di wajah, lalu BJ Homemade yang membuatnya.',
      cta: 'Mulai mendesain',
      onClick: onOpenCustom,
      tone: 'bg-sand text-ink',
      visual: (
        <div className="w-full h-full text-ink">
          <CoDesign />
        </div>
      ),
    },
    {
      key: 'maker',
      eyebrow: 'Dibuat oleh BJ Homemade',
      title: 'Dibuat tangan dari limbah kayu di Semarang.',
      text: 'Dikerjakan bersama perajin difabel, dengan garansi perbaikan seumur hidup.',
      cta: 'Kenali pembuatnya',
      onClick: onOpenPartner,
      tone: 'bg-ink text-white',
      visual: (
        <img
          src="/partners/bj-homemade-logo.jpg"
          alt="Logo BJ Homemade"
          className="h-full max-h-40 aspect-square rounded-3xl object-cover"
        />
      ),
    },
    {
      key: 'tryon',
      eyebrow: 'Coba di wajah',
      title: 'Lihat dulu di wajahmu, langsung lewat kamera.',
      text: 'AR 3D dengan ukuran sebenarnya, tanpa instal aplikasi.',
      cta: 'Coba sekarang',
      onClick: onOpenTryOn,
      tone: 'bg-sage-tint text-ink',
      visual: (
        <div className="w-full h-full text-ink">
          <Digital />
        </div>
      ),
    },
  ];

  const go = (next: number) => {
    setDirection(next > index || (index === banners.length - 1 && next === 0) ? 1 : -1);
    setIndex((next + banners.length) % banners.length);
  };

  // Auto-advance unless the visitor is reading (hover or focus) or prefers less motion
  useEffect(() => {
    if (still || paused) return;
    const id = setTimeout(() => go(index + 1), INTERVAL);
    return () => clearTimeout(id);
  }, [index, paused, still]);

  const b = banners[index];
  const dark = b.tone.includes('bg-ink');

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Sorotan"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      // One height for every banner, so Koleksi below doesn't jump when they change
      className="relative h-[440px] md:h-[320px] rounded-[32px] overflow-hidden"
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={b.key}
          custom={direction}
          initial={still ? false : { opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={still ? undefined : { opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          // Swipe on touch screens
          drag={still ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) go(index + 1);
            else if (info.offset.x > 60) go(index - 1);
          }}
          aria-roledescription="slide"
          aria-label={`${index + 1} dari ${banners.length}`}
          className={`${b.tone} grid grid-cols-1 md:grid-cols-[1.3fr_1fr] items-center h-full gap-6 px-6 pt-8 pb-20 md:px-12 md:py-10 cursor-grab active:cursor-grabbing`}
        >
          <div className="space-y-3 max-w-xl">
            <span className={`block text-sm ${dark ? 'text-white/60' : 'text-muted'}`}>{b.eyebrow}</span>
            <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] leading-[1.1]">{b.title}</h2>
            <p className={`text-base leading-relaxed ${dark ? 'text-white/75' : 'text-body'}`}>{b.text}</p>
            <button
              onClick={b.onClick}
              className={`mt-2 h-11 px-5 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-colors ${
                dark ? 'bg-white text-ink hover:bg-soft' : 'bg-ink text-white hover:bg-ink-soft'
              }`}
            >
              {b.cta}
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="hidden md:flex h-44 items-center justify-center pointer-events-none select-none">{b.visual}</div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-8 flex items-center gap-2">
        <button
          onClick={() => go(index - 1)}
          aria-label="Banner sebelumnya"
          className={`w-9 h-9 rounded-full flex items-center justify-center ${dark ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white/80 text-ink hover:bg-white'}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 px-1">
          {banners.map((x, i) => (
            <button
              key={x.key}
              onClick={() => go(i)}
              aria-label={`Banner ${i + 1}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-6' : 'w-2'} ${
                dark ? (i === index ? 'bg-white' : 'bg-white/40') : i === index ? 'bg-ink' : 'bg-ink/25'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go(index + 1)}
          aria-label="Banner berikutnya"
          className={`w-9 h-9 rounded-full flex items-center justify-center ${dark ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white/80 text-ink hover:bg-white'}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
