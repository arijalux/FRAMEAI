import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';

// Real buyer reviews of glasses bought online: marketplace screenshots, names blurred.
// Each card lands slightly tilted, like notes pinned to a board.
const REVIEWS = [
  { src: '/reviews/terlalu-kecil.png', text: 'Kacamata sdh sampai, bagus tapi sayang terlalu kecil dan sempit dimuka', stars: 2, rotate: -3 },
  { src: '/reviews/kebesaran.png', text: 'frame nya kebesaran.. pas pasang kaca jd gak pas', stars: 3, rotate: 2.5 },
  { src: '/reviews/kekecilan-wajah-xl.png', text: 'kekecilan gak cocok di wajah XL', stars: 3, rotate: 2 },
  { src: '/reviews/terlalu-besar.png', text: 'Produk terlalu besar', stars: 1, rotate: -2.5 },
  // Not about size: the frame didn't match what the buyer wanted, which AI recommendations address
  { src: '/reviews/tidak-sesuai.png', text: 'Yang di ingin kan jauh dari kata sesuai', stars: 1, rotate: 1.5 },
];

// Pop in like bubbles: grow from nothing with a slight overshoot, staggered with a little
// jitter so they don't land in lockstep
const jitter = REVIEWS.map(() => Math.random() * 0.1 - 0.05);
const pop = {
  hidden: { opacity: 0, scale: 0, rotate: 0 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    rotate: REVIEWS[i].rotate,
    transition: { duration: 0.5, delay: Math.max(0, i * 0.12 + jitter[i]), ease: [0.34, 1.56, 0.64, 1] as const },
  }),
};


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
    count: 48,
    suffix: '%',
    text: 'konsumen marketplace pernah menerima barang yang tidak sesuai ekspektasi.',
    source: 'Survei kumparan, 800 konsumen e-commerce di 6 kota termasuk Semarang, Juli–Agustus 2025',
    url: 'https://kumparan.com/kumparantech/survei-6-dari-10-konsumen-e-commerce-ri-alami-kendala-di-fase-pasca-pembelian-25mbl2zuF2k',
  },
  {
    count: 202,
    suffix: ' juta ton',
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

/** Counts from 0 up to the figure the first time it scrolls into view */
const CountUp: React.FC<{ to: number; still: boolean }> = ({ to, still }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(still ? to : 0);

  useEffect(() => {
    if (!inView || still) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, still, to]);

  return <span ref={ref}>{value}</span>;
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
    <section aria-labelledby="problem-title" className="space-y-14 text-center">
      <div className="space-y-3 max-w-3xl mx-auto">
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
        <motion.p {...anim(2)} className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          Frame yang tidak pas dikirim balik, diproses, lalu dibuat ulang dari bahan baku baru. Energi pengiriman dan
          produksi itulah celah yang ingin FrameAI tutup.
        </motion.p>
      </div>

      {/* Real reviews as evidence */}
      <div className="space-y-4">
        <motion.ul
          initial={still ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-wrap justify-center gap-6 sm:gap-8"
        >
          {REVIEWS.map((r, i) => (
            <motion.li
              key={r.src}
              variants={pop}
              custom={i}
              style={still ? { rotate: r.rotate } : undefined}
              className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc((100%-4rem)/3)] rounded-3xl bg-soft p-3 will-change-transform"
            >
              <img
                src={r.src}
                alt={`Ulasan bintang ${r.stars}: “${r.text}”`}
                loading="lazy"
                className="w-full rounded-2xl bg-white"
              />
            </motion.li>
          ))}
        </motion.ul>
        <p className="text-xs text-muted">Ulasan pembeli kacamata di marketplace, nama disamarkan.</p>
      </div>

      {/* Data behind the problem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-8 max-w-5xl mx-auto">
        {DATA.map((d, i) => (
          <motion.div key={d.source} {...anim(i)} className="space-y-3">
            <p className="whitespace-nowrap text-6xl md:text-8xl font-normal tracking-[-0.05em] leading-none text-ink tabular-nums">
              <CountUp to={d.count} still={still} />
              {/* A word unit sits smaller beside the number so it stays on one line */}
              {d.suffix.length > 1 ? (
                <span className="ml-2 md:ml-3 text-3xl md:text-5xl tracking-[-0.04em]">{d.suffix.trim()}</span>
              ) : (
                d.suffix
              )}
            </p>
            <p className="text-base text-body leading-relaxed max-w-md mx-auto">{d.text}</p>
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted underline underline-offset-2 hover:text-ink">
              {d.source}
            </a>
          </motion.div>
        ))}
      </div>

      <div className="space-y-8 border-t border-line pt-12">
        <h3 className="text-sm text-muted">Masalahnya</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 max-w-4xl mx-auto">
          {PROBLEMS.map((p, i) => (
            <motion.div key={p.title} {...anim(i % 2)} className="space-y-1">
              <p className="text-xl text-ink">{p.title}</p>
              <p className="text-base text-muted leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hand-over to how FrameAI answers it */}
      <motion.p {...anim(0)} className="text-2xl md:text-3xl font-normal tracking-[-0.03em] leading-snug text-ink max-w-3xl mx-auto">
        Semuanya berawal dari satu hal: kecocokan baru ketahuan setelah frame sampai.{' '}
        <span className="text-muted">FrameAI memindahkannya ke awal, sebelum frame dibuat.</span>
      </motion.p>
    </section>
  );
};
