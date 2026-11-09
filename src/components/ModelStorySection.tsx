import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { MotionValue, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

// three.js + react-three are heavy, so the viewer loads only when this section renders
const ScrollGlasses = lazy(() => import('./ScrollGlasses'));

const MODEL_URL = '/models/wood-glasses.glb';

// How FrameAI works; the model sits opposite each step (right, left, right)
const STEPS = [
  { title: 'Scan wajah', text: 'AI membaca bentuk wajah dan jarak pupil, lalu merekomendasikan frame.' },
  { title: 'Coba di wajah', text: 'AR 3D di kamera dengan ukuran sebenarnya, jadi lebih sedikit frame salah ukuran yang diretur.' },
  { title: 'Dibuat perajin', text: 'Desain custom jadi file potong yang langsung dikerjakan BJ Homemade.' },
];

// Panel colours for each step (--color-sand, --color-mist, --color-sage-tint in index.css)
const SAND = '#eae7e0';
const MIST = '#e4ebf2';
const SAGE_TINT = '#e6ebdf';

// When each step's text is visible, as scroll progress: fades between the model's moves
const STEP_FADES: { at: number[]; opacity: number[] }[] = [
  { at: [0.46, 0.52], opacity: [1, 0] },
  { at: [0.54, 0.6, 0.72, 0.78], opacity: [0, 1, 1, 0] },
  { at: [0.8, 0.88], opacity: [0, 1] },
];

// Side by side needs room for the model and the text
const useIsDesktop = () => {
  const query = '(min-width: 1024px)';
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return matches;
};

const StepText: React.FC<{ step: (typeof STEPS)[number]; index: number }> = ({ step, index }) => (
  <div className="space-y-3">
    <span className="block text-xl text-sage tabular-nums">0{index + 1}</span>
    <h3 className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.08] text-ink">{step.title}</h3>
    <p className="text-lg text-body leading-relaxed max-w-md">{step.text}</p>
  </div>
);

/** One step in the pinned panel: stays in place and fades as its turn comes and goes */
const PinnedStep: React.FC<{ progress: MotionValue<number>; index: number }> = ({ progress, index }) => {
  const fade = STEP_FADES[index];
  const opacity = useTransform(progress, fade.at, fade.opacity);
  return (
    <motion.li
      style={{ opacity }}
      className={`absolute inset-y-0 w-[38%] flex items-center ${index % 2 === 1 ? 'right-12' : 'left-12'}`}
    >
      <StepText step={STEPS[index]} index={index} />
    </motion.li>
  );
};

const Intro: React.FC = () => (
  <div className="space-y-2 max-w-3xl mx-auto text-center">
    <span className="block text-sm text-muted">Cara kerjanya</span>
    <h2 id="how-title" className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.08] text-ink">
      Pastikan pas dulu, baru dibuat.
    </h2>
    <p className="text-lg text-body leading-relaxed max-w-2xl mx-auto">
      Tiga langkah dari wajahmu sampai frame kayu yang dibuat khusus untukmu.
    </p>
  </div>
);

/**
 * The wooden frame in 3D below the hero, on a tinted panel. While the section scrolls past, the
 * panel stays pinned: the model slides right, left, then right opposite each step's text, and the
 * panel's colour changes with the step. Phones and reduced motion get a plain stacked layout.
 */
export const ModelStorySection: React.FC = () => {
  const still = Boolean(useReducedMotion());
  const desktop = useIsDesktop();
  const pinned = desktop && !still;
  const ref = useRef<HTMLElement>(null);

  // 0 when the section's top reaches the bottom of the screen, 1 when its end does;
  // the panel pins at 1/3, when the section's top reaches the top of the screen
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
  // A plain copy of the progress: Motion would otherwise hand opacity and colour to the browser's
  // scroll timeline, and there they stayed stuck on the first step when the page scrolled
  const jsProgress = useTransform(() => scrollYProgress.get());
  const panelColor = useTransform(jsProgress, [0.42, 0.58, 0.75, 0.9], [SAND, MIST, MIST, SAGE_TINT]);

  const viewer = (
    <Suspense fallback={null}>
      <ScrollGlasses url={MODEL_URL} yaw={pinned ? scrollYaw : fixedYaw} fit={pinned ? 0.72 : 0.8} />
    </Suspense>
  );

  if (!pinned) {
    return (
      <section ref={ref} aria-labelledby="how-title" className="space-y-10">
        <Intro />
        <div className="h-[45vh] rounded-[32px] bg-sand overflow-hidden">{viewer}</div>
        <ol className="space-y-10">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <StepText step={s} index={i} />
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section ref={ref} aria-labelledby="how-title" style={{ height: `${STEPS.length * 100}vh` }}>
      <div className="sticky top-0 h-screen pt-20 pb-4">
        <motion.div style={{ backgroundColor: panelColor }} className="h-full rounded-[32px] overflow-hidden flex flex-col pt-10">
          <Intro />
          <div className="relative flex-1 min-h-0">
            <motion.div style={{ x }} className="absolute inset-0 will-change-transform">
              {viewer}
            </motion.div>
            <ol>
              {STEPS.map((s, i) => (
                <PinnedStep key={s.title} progress={jsProgress} index={i} />
              ))}
            </ol>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
