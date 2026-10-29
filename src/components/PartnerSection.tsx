import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, HandHeart, Leaf, ShieldCheck } from 'lucide-react';

// All partner copy in one place so it's easy to review and edit.
// Facts from Green Network's interview with BJ Homemade (May 2023); collaboration agreed verbally.
const PARTNER = {
  name: 'BJ Homemade',
  eyebrow: 'Kolaborasi',
  body: 'FrameAI berkolaborasi dengan BJ Homemade, usaha asal Semarang yang sejak 2017 membuat frame kacamata dari limbah kayu. Lewat FrameAI, frame buatan tangan mereka bisa dicoba secara virtual dan dipilih dengan bantuan AI dari mana saja.',
  points: [
    { icon: Leaf, title: 'Dari limbah kayu', text: 'Frame dibuat dari sisa kayu sonokeling dan jati.' },
    { icon: HandHeart, title: 'Dibuat perajin difabel', text: 'Dikerjakan tangan bersama Komunitas Difabel Mandiri.' },
    { icon: ShieldCheck, title: 'Garansi seumur hidup', text: 'Frame yang patah diperbaiki gratis oleh BJ Homemade.' },
  ],
};

interface PartnerSectionProps {
  onOpenCatalog: () => void;
}

export const PartnerSection: React.FC<PartnerSectionProps> = ({ onOpenCatalog }) => {
  const still = Boolean(useReducedMotion());

  return (
    <motion.section
      aria-labelledby="partner-title"
      initial={still ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[32px] bg-sand p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10"
    >
      <div className="lg:col-span-6 space-y-6">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 text-xs text-ink">
          {PARTNER.eyebrow}
        </span>
        {/* Text wordmark until the partner's official logo file is added */}
        <h2 id="partner-title" className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.05] text-ink">
          FrameAI <span className="text-muted">×</span>
          <br />
          {PARTNER.name}
        </h2>
        <p className="text-lg text-body leading-relaxed max-w-lg">{PARTNER.body}</p>
        <button
          onClick={onOpenCatalog}
          className="h-12 px-6 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
        >
          Lihat koleksi
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <ul className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 self-end">
        {PARTNER.points.map(({ icon: Icon, title, text }, i) => (
          <motion.li
            key={title}
            initial={still ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl bg-white p-5 flex items-start gap-4"
          >
            <span className="shrink-0 w-10 h-10 rounded-full bg-sage-tint text-sage flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </span>
            <div className="space-y-1 text-left">
              <p className="text-base text-ink">{title}</p>
              <p className="text-sm text-muted leading-relaxed">{text}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
};
