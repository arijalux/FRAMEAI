import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

// three.js + react-three are heavy, so the viewer loads only when this section renders
const ScrollGlasses = lazy(() => import('./ScrollGlasses'));

const MODEL_URL = '/models/wood-glasses.glb';

// How FrameAI works; the model sits opposite each step (right, left, right)
const STEPS = [
  { title: 'Scan wajah', text: 'AI membaca bentuk wajah dan jarak pupil, lalu merekomendasikan frame.' },
  { title: 'Coba di wajah', text: 'AR 3D di kamera dengan ukuran sebenarnya, jadi lebih sedikit frame salah ukuran yang diretur.' },
  { title: 'Dibuat perajin', text: 'Desain custom jadi file potong yang langsung dikerjakan BJ Homemade.' },
];

const useIsDesktop = () => {
  const query = '(min-width: 768px)';
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return matches;
};

/**
 * The wooden frame in 3D below the hero. While the section scrolls past, the model stays
 * pinned and slides from the centre to the right, then left, then right again, opposite
 * each step's text. On phones the model simply sits above the steps.
 */
export const ModelStorySection: React.FC = () => {
  const still = Boolean(useReducedMotion());
  const desktop = useIsDesktop();
  const ref = useRef<HTMLElement>(null);

  // 0 when the section's top reaches the bottom of the screen, 1 when its end does;
  // step i is centred on screen at (i + 1) / 3
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  // Each step has a fixed spot and angle; the model only moves while passing between steps.
  // It turns towards the text, and the last step shows the wooden temple side-on.
  const keys = [0.1, 0.3, 0.42, 0.58, 0.75, 0.9];
  const x = useTransform(scrollYProgress, keys, ['0%', '25%', '25%', '-25%', '-25%', '25%']);
  const scrollYaw = useSpring(useTransform(scrollYProgress, keys, [0, -30, -30, 30, 30, -70]), {
    stiffness: 120,
    damping: 30,
  });
  const fixedYaw = useMotionValue(-30);
  const yaw = desktop && !still ? scrollYaw : fixedYaw;

  const viewer = (
    <Suspense fallback={null}>
      <ScrollGlasses url={MODEL_URL} yaw={yaw} fit={desktop ? 0.62 : 0.8} />
    </Suspense>
  );

  const step = (s: (typeof STEPS)[number], i: number, className = '') => (
    <motion.div
      initial={still ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !desktop, amount: 0.6 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`space-y-3 ${className}`}
    >
      <span className="block text-xl text-sage tabular-nums">0{i + 1}</span>
      <h2 className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.08] text-ink">{s.title}</h2>
      <p className="text-lg text-muted leading-relaxed max-w-md">{s.text}</p>
    </motion.div>
  );

  // Phones: no pinning, the model sits above the steps
  if (!desktop) {
    return (
      <section ref={ref} aria-label="Cara kerja FrameAI" className="space-y-10">
        <div className="h-[45vh]">{viewer}</div>
        <ol className="space-y-10">
          {STEPS.map((s, i) => (
            <li key={s.title}>{step(s, i)}</li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section ref={ref} aria-label="Cara kerja FrameAI" className="relative" style={{ height: `${STEPS.length * 100}vh` }}>
      {/* Pinned model layer */}
      <div className="sticky top-0 h-screen flex items-center">
        <motion.div style={{ x: still ? '25%' : x }} className="w-full h-[70vh] will-change-transform">
          {viewer}
        </motion.div>
      </div>

      {/* Step text, one screen each, on the side opposite the model */}
      <ol className="absolute inset-0 pointer-events-none">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className={`h-screen flex items-center ${!still && i % 2 === 1 ? 'justify-end' : 'justify-start'}`}
          >
            {step(s, i, 'pointer-events-auto w-[42%]')}
          </li>
        ))}
      </ol>
    </section>
  );
};
