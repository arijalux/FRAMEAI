import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Camera, Layers, Scale, ScanFace, Search, Sparkles, SlidersHorizontal } from 'lucide-react';

export type FeatureTarget = 'finder' | 'ar' | '3d' | 'catalog' | 'search';

interface FeaturesSectionProps {
  onOpen: (target: FeatureTarget) => void;
}

// Each entry describes a feature that exists in the app today
const FEATURES: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  cta: string;
  target: FeatureTarget;
  tint: string;
  wide?: boolean;
}[] = [
  {
    icon: Sparkles,
    title: 'Cari dengan AI',
    text: 'Jawab tiga pertanyaan tentang aktivitas, gaya, dan material, lalu Gemini memilihkan tiga frame terbaik dari katalog beserta alasannya.',
    cta: 'Mulai',
    target: 'finder',
    tint: 'bg-sage-tint',
    wide: true,
  },
  {
    icon: ScanFace,
    title: 'Scan bentuk wajah',
    text: 'Satu foto cukup untuk mengenali bentuk wajah dan memperkirakan jarak pupil (PD) kamu.',
    cta: 'Scan wajah',
    target: 'finder',
    tint: 'bg-mist',
  },
  {
    icon: Camera,
    title: 'Coba virtual (AR)',
    text: 'Lihat frame langsung di wajahmu lewat kamera, dengan ukuran sesuai milimeter aslinya. Video diproses di perangkatmu.',
    cta: 'Buka kamera',
    target: 'ar',
    tint: 'bg-sand',
  },
  {
    icon: Layers,
    title: 'Inspeksi 3D',
    text: 'Putar frame 360°, lihat engsel dan dimensinya dari dekat.',
    cta: 'Lihat 3D',
    target: '3d',
    tint: 'bg-stone',
  },
  {
    icon: SlidersHorizontal,
    title: 'Atur lensa sesuai resep',
    text: 'Pilih jenis dan ketebalan lensa, tambahkan filter blue light atau photochromic, lalu masukkan resepmu.',
    cta: 'Pilih frame',
    target: 'catalog',
    tint: 'bg-mist',
  },
  {
    icon: Scale,
    title: 'Bandingkan frame',
    text: 'Taruh hingga empat frame berdampingan untuk membandingkan ukuran, berat, dan material.',
    cta: 'Pilih frame',
    target: 'catalog',
    tint: 'bg-sand',
  },
  {
    icon: Search,
    title: 'Tanya AI di pencarian',
    text: 'Tulis kebutuhanmu dengan bahasa sehari-hari, misalnya "kacamata ringan buat kerja di depan laptop", lalu tekan tombol ✦.',
    cta: 'Coba cari',
    target: 'search',
    tint: 'bg-sage-tint',
    wide: true,
  },
];

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onOpen }) => {
  const still = Boolean(useReducedMotion());

  return (
    <section aria-labelledby="features-title" className="space-y-10">
      <motion.div
        initial={still ? false : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto text-center space-y-3"
      >
        <span className="text-sm text-sage">Fitur</span>
        <h2 id="features-title" className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.08] text-ink">
          Semua yang kamu butuhkan untuk memilih kacamata.
        </h2>
        <p className="text-lg text-muted leading-relaxed">
          Dari mengenali bentuk wajah sampai mengatur lensa, semuanya bisa dilakukan dari rumah.
        </p>
      </motion.div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map(({ icon: Icon, title, text, cta, target, tint, wide }, i) => (
          <motion.li
            key={title}
            initial={still ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={`${tint} ${wide ? 'lg:col-span-2' : ''} rounded-[28px] p-6 md:p-7 flex flex-col gap-6 text-left`}
          >
            <span className="w-11 h-11 rounded-full bg-white text-ink flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </span>
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-normal tracking-[-0.02em] text-ink">{title}</h3>
              <p className="text-sm text-body leading-relaxed max-w-md">{text}</p>
            </div>
            <button
              onClick={() => onOpen(target)}
              className="self-start h-10 pl-4 pr-1.5 rounded-full bg-white hover:shadow-card text-sm text-ink flex items-center gap-2 transition-shadow"
            >
              {cta}
              <span className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
    </section>
  );
};
