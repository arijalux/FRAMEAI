import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Leaf, Lightbulb, MapPin, Sparkles } from 'lucide-react';
import { PRINCIPLE_ILLUSTRATIONS } from './PrincipleIllustrations';

// The principles FrameAI is built on, each with how the app meets it
const PRINCIPLES = [
  {
    icon: Leaf,
    title: 'Sustainable',
    text: 'Frame dari limbah kayu sonokeling dan jati, dibuat hanya saat dipesan, dan dicoba dulu sebelum diproduksi supaya retur berkurang.',
  },
  {
    icon: Sparkles,
    title: 'AI Driven',
    text: 'Gemini membaca foto wajah dan menyarankan frame, dan MediaPipe melacak wajah agar frame 3D ikut bergerak di kamera.',
  },
  {
    icon: Lightbulb,
    title: 'Innovative',
    text: 'Desain custom langsung jadi file SVG/DXF untuk mesin CNC/laser perajin, plus kartu cetak untuk melihat frame di ukuran aslinya.',
  },
  {
    icon: MapPin,
    title: 'Local',
    text: 'Dikerjakan bersama BJ Homemade di Semarang dan perajin difabel, dengan bahasa Indonesia dan harga dalam Rupiah.',
  },
];

// What FrameAI does to put the principles into practice
const CHECKLIST = [
  {
    title: 'Celah energi',
    text: 'Frame salah ukuran dikirim balik dan dibuat ulang. Energi pengiriman ulang dan bahan baku baru itulah yang terbuang.',
  },
  {
    title: 'Model bisnis',
    text: 'Komisi dari tiap pesanan frame dan desain custom, jasa scan wajah 3D, lalu langganan untuk perajin lain.',
  },
  {
    title: 'Efisiensi',
    text: 'Ukur dan coba sebelum produksi, buat sesuai pesanan tanpa stok menumpuk, dan file potong dibuat otomatis.',
  },
  {
    title: 'Dampak lokal',
    text: 'Pesanan dan pekerjaan baru untuk BJ Homemade serta perajin difabel yang membuat frame-nya.',
  },
  {
    title: 'Digitalisasi',
    text: 'AI dan AR berjalan di browser tanpa instal aplikasi, dan desain dikirim ke perajin sebagai file digital.',
  },
  {
    title: 'Dirancang bersama',
    text: 'Dikembangkan bersama BJ Homemade selama pilot: masukan perajin untuk katalog dan uji file potong di mesin mereka.',
  },
];

const rise = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** FrameAI's principles and how the app puts them into practice */
export const PrinciplesSection: React.FC = () => {
  const still = Boolean(useReducedMotion());
  const anim = (i: number) => ({
    variants: rise,
    initial: still ? false : ('hidden' as const),
    whileInView: 'visible' as const,
    viewport: { once: true, amount: 0.4 },
    custom: i,
  });

  return (
    <section aria-labelledby="principles-title" className="space-y-14 text-center">
      <div className="space-y-3 max-w-3xl mx-auto">
        <motion.span {...anim(0)} className="block text-sm text-muted">
          Dampaknya
        </motion.span>
        <motion.h2
          {...anim(1)}
          id="principles-title"
          className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.08] text-ink"
        >
          Kacamata yang pas sejak pertama, supaya tidak ada energi yang terbuang.
        </motion.h2>
        <motion.p {...anim(2)} className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          Frame yang pas sejak pertama berarti lebih sedikit retur, lebih sedikit kayu terbuang, dan pesanan yang terus mengalir untuk perajin lokal. Ini prinsip yang kami pegang.
        </motion.p>
      </div>

      {/* Proposal principles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border-t border-line pt-12">
        {PRINCIPLES.map((p, i) => (
          <motion.div key={p.title} {...anim(i)} className="space-y-2">
            <span className="mx-auto mb-3 w-12 h-12 rounded-full bg-sage-tint text-sage flex items-center justify-center">
              <p.icon className="w-5 h-5" aria-hidden />
            </span>
            <p className="text-xl text-ink">{p.title}</p>
            <p className="text-base text-muted leading-relaxed">{p.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Idea checklist */}
      <div className="space-y-8 border-t border-line pt-12">
        <h3 className="text-sm text-sage">Cara kami mewujudkannya</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHECKLIST.map((c, i) => {
            const Illustration = PRINCIPLE_ILLUSTRATIONS[i];
            // Same rotating panel tints as the catalog cards
            const tint = ['bg-sand', 'bg-mist', 'bg-sage-tint', 'bg-stone'][i % 4];
            return (
              <motion.article key={c.title} {...anim(i % 3)} className="rounded-3xl border border-line bg-white overflow-hidden flex flex-col">
                <div className={`${tint} h-44 px-6 py-5`}>
                  <Illustration />
                </div>
                <div className="p-6 space-y-2">
                  <span className="block text-sm text-sage tabular-nums">0{i + 1}</span>
                  <p className="text-xl text-ink">{c.title}</p>
                  <p className="text-base text-muted leading-relaxed">{c.text}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
