import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowUpRight, LayoutGrid, Sparkles } from 'lucide-react';
import { RotatingCards } from './RotatingCards';
import { PartnerSection } from './PartnerSection';
import { FeaturesSection, FeatureTarget } from './FeaturesSection';
import { OpticalFrame } from '../types';
import { formatRupiah, materialLabel } from '../utils/format';

interface LandingHeroProps {
  frames: OpticalFrame[];
  onOpenCatalog: () => void;
  onOpenFinder: () => void;
  onOpenFeature: (target: FeatureTarget) => void;
}

// Shared fade-up for elements entering the viewport
const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({ opacity: 1, transition: { duration: 0.8, delay: i * 0.1 } }),
};

const reveal = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** Beranda hero + editorial section, with scroll-driven parallax */
export const LandingHero: React.FC<LandingHeroProps> = ({ frames, onOpenCatalog, onOpenFinder, onOpenFeature }) => {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const editorialRef = useRef<HTMLElement>(null);

  // 0 → 1 while the hero scrolls from the top of the viewport until it has left it
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  // Smooth the raw scroll value so the layers glide instead of tracking every wheel tick
  const hero = useSpring(heroProgress, { stiffness: 120, damping: 24, mass: 0.4 });

  // Background layer (carousel) moves slower than the page and recedes; copy moves faster
  const carouselY = useTransform(hero, [0, 1], [0, 160]);
  const carouselScale = useTransform(hero, [0, 1], [1, 0.86]);
  const carouselOpacity = useTransform(hero, [0, 0.8], [1, 0.25]);
  const copyY = useTransform(hero, [0, 1], [0, -60]);
  const copyOpacity = useTransform(hero, [0.35, 0.9], [1, 0]);

  // Editorial: the two columns rise at different speeds as the section passes through
  // (vertical only, so nothing gets clipped or causes sideways scrolling)
  const { scrollYProgress: editorialProgress } = useScroll({ target: editorialRef, offset: ['start end', 'end start'] });
  const headlineY = useTransform(editorialProgress, [0, 1], [40, -40]);
  const bodyY = useTransform(editorialProgress, [0, 1], [90, -60]);

  const still = Boolean(reduceMotion);

  return (
    <div className="space-y-24">
      {/* Hero: catalog carousel on top, centred copy and actions below */}
      <section ref={heroRef} className="relative flex flex-col items-center text-center gap-10 pt-2">
        <motion.div
          // The carousel has its own "rise" intro, so this layer only reacts to scroll
          style={still ? undefined : { y: carouselY, scale: carouselScale, opacity: carouselOpacity }}
          className="relative w-full h-[230px] sm:h-[400px] lg:h-[440px] will-change-transform"
        >
          {/* Draggable 3D ring of catalog frames; clicking a card opens Koleksi */}
          <RotatingCards
            cards={frames.map((f) => ({
              src: f.imageUrl,
              alt: `${f.name}, ${materialLabel(f.material)}, ${formatRupiah(f.price)}`,
            }))}
            cardWidth={230}
            aspectRatio={0.78}
            speed={12}
            tilt={-8}
            onCardClick={onOpenCatalog}
          />
        </motion.div>

        <motion.div
          style={still ? undefined : { y: copyY, opacity: copyOpacity }}
          className="relative z-10 max-w-4xl flex flex-col items-center gap-7"
        >
          <motion.h1
            variants={reveal}
            initial={still ? false : 'hidden'}
            animate="visible"
            custom={1}
            className="text-[2.4rem] md:text-6xl font-normal tracking-[-0.045em] leading-[1.04] text-ink"
          >
            Coba. Bandingkan. Pilih.
            <br />
            Kacamata yang pas, dibantu AI.
          </motion.h1>

          <motion.p
            variants={reveal}
            initial={still ? false : 'hidden'}
            animate="visible"
            custom={2}
            className="text-lg text-muted leading-relaxed max-w-xl"
          >
            Jawab beberapa pertanyaan, scan wajahmu, dan biarkan Gemini memilihkan frame yang paling cocok. Lalu coba
            langsung lewat kamera.
          </motion.p>

          <motion.div
            variants={reveal}
            initial={still ? false : 'hidden'}
            animate="visible"
            custom={3}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <motion.button
              whileHover={still ? undefined : { y: -2 }}
              whileTap={still ? undefined : { scale: 0.97 }}
              onClick={onOpenFinder}
              className="h-12 px-6 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Cari dengan AI
            </motion.button>
            <motion.button
              whileHover={still ? undefined : { y: -2 }}
              whileTap={still ? undefined : { scale: 0.97 }}
              onClick={onOpenCatalog}
              className="h-12 px-6 rounded-full border border-line hover:border-ink text-ink text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              Cari di katalog
            </motion.button>
          </motion.div>

          <motion.p
            variants={reveal}
            initial={still ? false : 'hidden'}
            animate="visible"
            custom={4}
            className="text-xs text-muted"
          >
            Gratis ongkir ke seluruh Indonesia. Garansi pas 30 hari.
          </motion.p>
        </motion.div>
      </section>

      {/* What the app can do */}
      <FeaturesSection onOpen={onOpenFeature} />

      {/* Partner: BJ Homemade */}
      <PartnerSection onOpenCatalog={onOpenCatalog} />

      {/* Editorial statement */}
      <section
        ref={editorialRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end border-t border-line pt-16"
      >
        <motion.h2
          style={still ? undefined : { y: headlineY }}
          variants={fadeIn}
          initial={still ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.08] text-ink"
        >
          Lebih sedikit menebak.
          <br />
          Lebih banyak yang pas.
        </motion.h2>
        <motion.div
          style={still ? undefined : { y: bodyY }}
          variants={fadeIn}
          initial={still ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          custom={1}
          className="space-y-6 max-w-md md:justify-self-end"
        >
          <p className="text-lg text-muted leading-relaxed">
            Setiap frame diberi skor kecocokan dengan bentuk wajahmu, diukur dalam milimeter, dan bisa dicoba langsung
            sebelum dipesan.
          </p>
          <button
            onClick={onOpenCatalog}
            className="h-12 px-6 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center gap-2 transition-colors"
          >
            Lihat koleksi
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      </section>
    </div>
  );
};
