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
  {
    title: 'Retur boros energi',
    text: 'Frame yang tidak pas dikirim balik dan dibuat ulang: bahan bakar pengiriman ulang dan bahan baku baru ikut terbuang.',
  },
  { title: 'Tidak bisa dicoba', text: 'Pembeli hanya melihat foto, lalu menebak apakah frame cocok di wajahnya.' },
  { title: 'Ukuran meleset', text: 'Terlalu kecil atau terlalu besar baru ketahuan setelah barang sampai.' },
  { title: 'Perajin sulit menjual', text: 'Perajin lokal kuat di produk, tapi pemasaran dan pesanannya tidak stabil.' },
];

// Published Indonesian figures behind the problem; the sources are linked under the numbers
const DATA = [
  {
    value: '48%',
    text: 'konsumen marketplace pernah menerima barang yang tidak sesuai ekspektasi.',
    source: 'Survei kumparan, 800 konsumen e-commerce di 6 kota termasuk Semarang, Juli–Agustus 2025',
    url: 'https://kumparan.com/kumparantech/survei-6-dari-10-konsumen-e-commerce-ri-alami-kendala-di-fase-pasca-pembelian-25mbl2zuF2k',
  },
  {
    value: '202 juta ton',
    text: 'CO₂e dari sektor transportasi pada 2024, sekitar 25% emisi sektor energi nasional. Setiap retur menambah perjalanan ini.',
    source: 'IESR, Indonesia Sustainable Mobility Outlook 2025',
    url: 'https://indonesiabusinesspost.com/4737/society-environment-and-culture/iesr-calls-for-decarbonization-as-ri-s-transport-emissions-hit-202-m-tons-co-in-2024',
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

/** The problem FrameAI solves, with real reviews and published figures */
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
          Membeli kacamata online masih penuh tebakan, dan setiap tebakan yang salah membuang energi.
        </motion.h2>
        <motion.p {...anim(2)} className="text-lg text-muted leading-relaxed max-w-2xl">
          Frame yang tidak pas dikirim balik, diproses, lalu dibuat ulang dari bahan baku baru. Energi pengiriman dan
          produksi itulah celah yang ingin FrameAI tutup.
        </motion.p>
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

      <div className="space-y-8 border-t border-line pt-12">
        <h3 className="text-sm text-muted">Masalahnya</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
          {PROBLEMS.map((p, i) => (
            <motion.div key={p.title} {...anim(i % 2)} className="space-y-1">
              <p className="text-xl text-ink">{p.title}</p>
              <p className="text-base text-muted leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
