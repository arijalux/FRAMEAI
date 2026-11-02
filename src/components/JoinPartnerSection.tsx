import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { whatsappLink } from '../utils/contact';

// New partners are onboarded by the team by hand, so the copy promises contact, not instant listing
const STEPS = [
  { title: 'Gabung jadi mitra', text: 'Ceritakan produk dan usahamu ke tim FrameAI lewat WhatsApp.' },
  { title: 'Scan 3D produk', text: 'Frame-mu kami scan jadi model 3D dengan ukuran yang akurat.' },
  { title: 'Tampil di katalog', text: 'Bisa dicoba lewat AR dan direkomendasikan AI ke pembeli yang wajahnya cocok.' },
];

const PARTNER_MESSAGE = 'Halo FrameAI, saya tertarik menampilkan produk kacamata saya di FrameAI.';

const rise = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** Invites eyewear makers and brands to list their frames on FrameAI */
export const JoinPartnerSection: React.FC = () => {
  const still = Boolean(useReducedMotion());
  const anim = (i: number) => ({
    variants: rise,
    initial: still ? false : ('hidden' as const),
    whileInView: 'visible' as const,
    viewport: { once: true, amount: 0.4 },
    custom: i,
  });

  return (
    <section aria-labelledby="join-title" className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
      <div className="lg:col-span-5 space-y-6">
        <motion.span {...anim(0)} className="block text-sm text-muted">
          Untuk perajin dan brand
        </motion.span>
        <motion.h2
          {...anim(1)}
          id="join-title"
          className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.08] text-ink"
        >
          Punya produk kacamata? Tampilkan di FrameAI.
        </motion.h2>
        <motion.p {...anim(2)} className="text-lg text-muted leading-relaxed max-w-md">
          Seperti BJ Homemade, frame buatanmu bisa dicoba pembeli dari mana saja sebelum dipesan.
        </motion.p>
        <motion.a
          {...anim(3)}
          href={whatsappLink(PARTNER_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 px-6 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
        >
          Gabung jadi mitra
          <ArrowUpRight className="w-4 h-4" />
        </motion.a>
      </div>

      <ol className="lg:col-span-7 space-y-8 lg:pt-10">
        {STEPS.map((s, i) => (
          <motion.li key={s.title} {...anim(i)} className="flex gap-4 border-t border-line pt-6">
            <span className="shrink-0 text-xl text-sage tabular-nums">0{i + 1}</span>
            <div className="space-y-1">
              <p className="text-xl text-ink">{s.title}</p>
              <p className="text-base text-muted leading-relaxed">{s.text}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
};
