import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

// Real buyer reviews of glasses bought online (marketplace, names withheld)
const REVIEWS = [
  'Bagus tapi sayang terlalu kecil dan sempit di muka',
  'Frame-nya kebesaran, pas pasang kaca jadi gak pas',
  'Kekecilan, gak cocok di wajah XL',
  'Produk terlalu besar',
];

const PROBLEMS = [
  { title: 'Tidak bisa dicoba', text: 'Pembeli hanya melihat foto, lalu menebak apakah frame cocok di wajahnya.' },
  { title: 'Ukuran meleset', text: 'Terlalu kecil atau terlalu besar baru ketahuan setelah barang sampai.' },
  { title: 'Perajin sulit menjual', text: 'Perajin lokal kuat di produk, tapi pemasaran dan pesanannya tidak stabil.' },
  {
    title: 'Retur boros energi',
    text: 'Frame yang tidak pas dikirim balik dan dibuat ulang: bahan bakar pengiriman ulang dan bahan baku baru ikut terbuang.',
  },
];

// Published figures behind the problem; the sources are linked under the numbers
const DATA = [
  {
    value: '29%',
    text: 'pembeli kacamata online tidak puas dengan kecocokan dan kenyamanan frame-nya.',
    source: 'Survei 85 pembeli kacamata online di India (jurnal di PMC)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11822552/',
  },
  {
    value: '±27 juta ton',
    text: 'CO₂ per tahun dari pemrosesan dan pengiriman barang retur di Amerika Serikat.',
    source: 'Estimasi Optoro, perusahaan logistik retur',
    url: 'https://www.optoro.com/environmental-impact/',
  },
];

const SOLUTIONS = [
  { title: 'Scan wajah', text: 'AI membaca bentuk wajah dan jarak pupil, lalu merekomendasikan frame.' },
  { title: 'Coba di wajah', text: 'AR 3D di kamera dengan ukuran sebenarnya, jadi lebih sedikit frame salah ukuran yang diretur.' },
  { title: 'Dibuat perajin', text: 'Desain custom jadi file potong yang langsung dikerjakan BJ Homemade.' },
];

const rise = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** What FrameAI solves: the problem (with real reviews) and how the app answers it */
export const ProblemSection: React.FC = () => {
  const still = Boolean(useReducedMotion());
  const anim = (i: number) => ({
    variants: rise,
    initial: still ? false : ('hidden' as const),
    whileInView: 'visible' as const,
    viewport: { once: true, amount: 0.4 },
    custom: i,
  });

  return (
    <section aria-labelledby="problem-title" className="space-y-14">
      <div className="space-y-3 max-w-3xl">
        <motion.span {...anim(0)} className="block text-sm text-muted">
          Masalah yang kami selesaikan
        </motion.span>
        <motion.h2
          {...anim(1)}
          id="problem-title"
          className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.08] text-ink"
        >
          Membeli kacamata online masih penuh tebakan.
        </motion.h2>
      </div>

      {/* Real reviews as evidence */}
      <div className="flex flex-wrap gap-3">
        {REVIEWS.map((r, i) => (
          <motion.p
            key={r}
            {...anim(i)}
            className="px-5 py-3 rounded-full bg-soft text-sm md:text-base text-body"
          >
            “{r}”
          </motion.p>
        ))}
      </div>
      <p className="-mt-10 text-xs text-muted">Ulasan pembeli kacamata di marketplace, nama disamarkan.</p>

      {/* Data behind the problem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {DATA.map((d, i) => (
          <motion.div key={d.value} {...anim(i)} className="space-y-2">
            <p className="text-4xl md:text-5xl font-normal tracking-[-0.04em] text-ink tabular-nums">{d.value}</p>
            <p className="text-base text-body leading-relaxed max-w-md">{d.text}</p>
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted underline underline-offset-2 hover:text-ink">
              {d.source}
            </a>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 border-t border-line pt-12">
        <div className="space-y-8">
          <h3 className="text-sm text-muted">Masalahnya</h3>
          {PROBLEMS.map((p, i) => (
            <motion.div key={p.title} {...anim(i)} className="space-y-1">
              <p className="text-xl text-ink">{p.title}</p>
              <p className="text-base text-muted leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
        <div className="space-y-8">
          <h3 className="text-sm text-sage">Jawaban FrameAI</h3>
          {SOLUTIONS.map((s, i) => (
            <motion.div key={s.title} {...anim(i)} className="flex gap-4">
              <span className="shrink-0 text-xl text-sage tabular-nums">0{i + 1}</span>
              <div className="space-y-1">
                <p className="text-xl text-ink">{s.title}</p>
                <p className="text-base text-muted leading-relaxed">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
