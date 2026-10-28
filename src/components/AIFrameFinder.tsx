import React, { useEffect, useState } from 'react';
import { ArrowLeft, Camera, Check, RotateCcw, Sparkles, ShieldCheck } from 'lucide-react';
import { FaceScanPanel } from './FaceScanPanel';
import { OpticalFrame, FaceShape, FaceAnalysisResult } from '../types';
import { calculateFaceFrameMatchScore } from '../utils/opticalMath';
import { formatRupiah, faceShapeLabel, frameShapeLabel, materialLabel } from '../utils/format';

interface AIFrameFinderProps {
  frames: OpticalFrame[];
  /** Latest AI face scan, if the visitor has done one (here or elsewhere in the app) */
  faceAnalysis: FaceAnalysisResult | null;
  /** Stores a new scan result app-wide (face shape for match scores, PD for AR) */
  onScanResult: (analysis: FaceAnalysisResult) => void;
  onPickFaceShape: (shape: FaceShape) => void;
  onSelectFrameForTryOn: (frame: OpticalFrame) => void;
  onConfigureLenses: (frame: OpticalFrame) => void;
  /** Free-text search from the navbar AI button; skips straight to results */
  aiQuery?: string;
}

interface Answers {
  lifestyle?: string;
  aesthetic?: string;
  materialPref?: string;
}

type Step = 'lifestyle' | 'aesthetic' | 'material' | 'face' | 'result';

const QUESTIONS: {
  step: Exclude<Step, 'face' | 'result'>;
  key: keyof Answers;
  title: string;
  hint: string;
  options: { id: string; title: string; desc: string }[];
}[] = [
  {
    step: 'lifestyle',
    key: 'lifestyle',
    title: 'Di mana kamu paling sering memakai kacamata?',
    hint: 'Menentukan bobot frame, kebutuhan filter blue light, dan kenyamanan seharian.',
    options: [
      { id: 'digital', title: 'Kerja digital & remote', desc: 'Berjam-jam di depan layar, butuh frame ringan dan filter blue light.' },
      { id: 'fashion', title: 'Eksekutif & fashion', desc: 'Siluet tegas dan khas yang menonjolkan gayamu.' },
      { id: 'outdoor', title: 'Outdoor & aktif', desc: 'Lensa polarized anti-silau dan frame yang tidak mudah melorot.' },
      { id: 'all_day', title: 'Dipakai seharian', desc: 'Nyaman dipakai hingga 16 jam sehari.' },
    ],
  },
  {
    step: 'aesthetic',
    key: 'aesthetic',
    title: 'Gaya seperti apa yang paling kamu suka?',
    hint: 'Menentukan garis siluet, bentuk bridge, dan karakter frame.',
    options: [
      { id: 'minimalist', title: 'Minimalis', desc: 'Geometri tegas, kawat tipis, bersih dan fungsional.' },
      { id: 'bold', title: 'Berani & mencolok', desc: 'Asetat tebal dengan warna pekat dan tampilan menonjol.' },
      { id: 'retro', title: 'Klasik abadi', desc: 'Aviator ikonik, bridge keyhole, dan frame bulat vintage.' },
      { id: 'sculptural', title: 'Elegan & mewah', desc: 'Cat-eye terangkat, warna emas champagne, finishing mengilap.' },
    ],
  },
  {
    step: 'material',
    key: 'materialPref',
    title: 'Material apa yang kamu suka?',
    hint: 'Menyeimbangkan bobot, kenyamanan, dan kekokohan frame.',
    options: [
      { id: 'titanium', title: 'Titanium', desc: 'Super ringan, hipoalergenik, tahan karat.' },
      { id: 'acetate', title: 'Asetat Italia', desc: 'Terasa hangat dan alami, warna lebih kaya.' },
      { id: 'eco', title: 'Bio-polimer', desc: 'Ringan dan ramah lingkungan, finishing matte.' },
      { id: 'hybrid', title: 'Kombinasi', desc: 'Bagian depan asetat dengan gagang titanium.' },
    ],
  },
];

const STEP_ORDER: Step[] = ['lifestyle', 'aesthetic', 'material', 'face', 'result'];

interface Recommendation {
  frame: OpticalFrame;
  reason: string;
}

/** Deterministic ranking used when Gemini is unavailable; labelled as such in the UI */
function rankLocally(frames: OpticalFrame[], answers: Answers, faceShape: FaceShape | null): Recommendation[] {
  return frames
    .map((f) => {
      const match = faceShape ? calculateFaceFrameMatchScore(faceShape, f.shape) : null;
      let score = match?.score ?? 75;
      if (answers.materialPref === 'titanium' && f.material.includes('Titanium')) score += 10;
      if (answers.materialPref === 'acetate' && f.material.includes('Acetate')) score += 10;
      if (answers.materialPref === 'eco' && f.material.includes('Eco')) score += 10;
      if (answers.materialPref === 'hybrid' && f.material.startsWith('Mixed')) score += 10;
      if (answers.lifestyle === 'digital' && f.weightGrams < 20) score += 6;
      if (answers.lifestyle === 'outdoor' && f.isPolarized) score += 8;
      if (answers.aesthetic === 'bold' && f.shape === 'Square') score += 5;
      if (answers.aesthetic === 'minimalist' && f.shape === 'Geometric') score += 5;
      if (answers.aesthetic === 'retro' && (f.shape === 'Aviator' || f.shape === 'Round')) score += 5;
      if (answers.aesthetic === 'sculptural' && f.shape === 'Cat-Eye') score += 5;
      // Build a reason from the attributes that actually matched this visitor's answers
      const notes: string[] = [];
      if (answers.lifestyle === 'digital' && f.weightGrams < 20)
        notes.push(`ringan (${f.weightGrams.toLocaleString('id-ID')} g) untuk berjam-jam di depan layar`);
      if (answers.lifestyle === 'outdoor' && f.isPolarized) notes.push('lensa polarized untuk aktivitas luar ruang');
      if (
        (answers.materialPref === 'titanium' && f.material.includes('Titanium')) ||
        (answers.materialPref === 'acetate' && f.material.includes('Acetate')) ||
        (answers.materialPref === 'eco' && f.material.includes('Eco')) ||
        (answers.materialPref === 'hybrid' && f.material.startsWith('Mixed'))
      )
        notes.push(`material ${materialLabel(f.material).toLowerCase()} sesuai pilihanmu`);
      const head = match ? `Bentuk ${frameShapeLabel(f.shape).toLowerCase()} cocok ${match.score}% untuk wajah ${faceShapeLabel(faceShape!).toLowerCase()}` : `Siluet ${frameShapeLabel(f.shape).toLowerCase()}`;
      const reason = notes.length ? `${head}, ${notes.join(', ')}.` : `${head}. ${match?.guidance ?? ''}`.trim();
      return { frame: f, reason, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ frame, reason }) => ({ frame, reason }));
}

/** Fallback for a free-text search: frames whose name, description, shape or material mention a query word */
function searchLocally(frames: OpticalFrame[], query: string): Recommendation[] {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  return frames
    .map((f) => {
      const haystack = [f.name, f.description, f.shape, f.material, frameShapeLabel(f.shape), materialLabel(f.material)]
        .join(' ')
        .toLowerCase();
      const hits = words.filter((w) => haystack.includes(w));
      return { frame: f, hits };
    })
    .filter((r) => r.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length)
    .slice(0, 3)
    .map(({ frame, hits }) => ({ frame, reason: `Cocok dengan kata kunci: ${hits.join(', ')}.` }));
}

export const AIFrameFinder: React.FC<AIFrameFinderProps> = ({
  frames,
  faceAnalysis,
  onScanResult,
  onPickFaceShape,
  onSelectFrameForTryOn,
  onConfigureLenses,
  aiQuery,
}) => {
  const [step, setStep] = useState<Step>('lifestyle');
  const [answers, setAnswers] = useState<Answers>({});
  const [manualShape, setManualShape] = useState<FaceShape | null>(null);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const faceShape: FaceShape | null = manualShape ?? faceAnalysis?.faceShape ?? null;
  const stepIndex = STEP_ORDER.indexOf(step);

  const fetchRecommendations = async (
    shape: FaceShape | null,
    scan: FaceAnalysisResult | null = faceAnalysis,
    query?: string
  ) => {
    setStep('result');
    setIsLoading(true);
    setResults(null);
    setIsFallback(false);
    try {
      const face = manualShape ? { faceShape: shape } : scan ?? (shape ? { faceShape: shape } : null);
      const res = await fetch('/api/recommend-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, face, frames, query }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.recommendations?.length) throw new Error(data?.error || 'No recommendations');
      const byId = new Map(frames.map((f) => [f.id, f]));
      const recs: Recommendation[] = data.recommendations
        .map((r: { frameId: string; reason: string }) => ({ frame: byId.get(r.frameId), reason: r.reason }))
        .filter((r: { frame?: OpticalFrame }) => r.frame);
      if (recs.length === 0) throw new Error('Unknown frames');
      setResults(recs);
      setSummary(data.summary ?? '');
    } catch (e) {
      console.warn('AI recommendations unavailable, using local ranking:', e);
      const textHits = query ? searchLocally(frames, query) : [];
      setResults(textHits.length ? textHits : rankLocally(frames, answers, shape));
      setSummary('');
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  // A search from the navbar jumps straight to AI results for that text
  useEffect(() => {
    if (aiQuery) fetchRecommendations(faceAnalysis?.faceShape ?? null, faceAnalysis, aiQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiQuery]);

  const answer = (key: keyof Answers, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setStep(STEP_ORDER[stepIndex + 1]);
  };

  const restart = () => {
    setStep('lifestyle');
    setAnswers({});
    setManualShape(null);
    setShowManualPicker(false);
    setResults(null);
  };

  const question = QUESTIONS.find((q) => q.step === step);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header + progress */}
      <div className="space-y-4">
        <span className="inline-flex items-center gap-2 text-sm text-sage">
          <Sparkles className="w-4 h-4" />
          Cari dengan AI
        </span>
        <div className="flex gap-1.5" aria-label={`Langkah ${Math.min(stepIndex + 1, 5)} dari 5`}>
          {STEP_ORDER.map((s, i) => (
            <span key={s} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-ink' : 'bg-soft-strong'}`} />
          ))}
        </div>
        {step !== 'lifestyle' && step !== 'result' && (
          <button
            onClick={() => setStep(STEP_ORDER[stepIndex - 1])}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        )}
      </div>

      {/* Steps 1–3: questionnaire */}
      {question && (
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">{question.title}</h2>
            <p className="text-muted">{question.hint}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => answer(question.key, opt.id)}
                className={`p-5 rounded-3xl border text-left transition-colors ${
                  answers[question.key] === opt.id ? 'bg-sage-tint border-ink' : 'bg-soft border-transparent hover:border-line-strong'
                }`}
              >
                <div className="text-base text-ink">{opt.title}</div>
                <div className="text-sm text-muted leading-relaxed mt-1.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 4: face scan */}
      {step === 'face' && (
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">Sekarang, kenali bentuk wajahmu</h2>
            <p className="text-muted">
              Gemini menganalisis bentuk wajah dan jarak pupil dari satu foto, lalu memadukannya dengan jawabanmu.
            </p>
          </div>

          {faceAnalysis && (
            <div className="p-5 rounded-3xl bg-sage-tint flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm text-sage">Hasil scan sebelumnya</span>
                <p className="text-ink">
                  Wajah {faceShapeLabel(faceAnalysis.faceShape).toLowerCase()} · PD {faceAnalysis.estimatedPd} mm
                </p>
              </div>
              <button
                onClick={() => {
                  setManualShape(null);
                  fetchRecommendations(faceAnalysis.faceShape);
                }}
                className="h-11 px-5 rounded-full bg-ink text-white text-sm font-medium"
              >
                Pakai hasil ini
              </button>
            </div>
          )}

          <FaceScanPanel
            onResult={(analysis) => {
              onScanResult(analysis);
              setManualShape(null);
              fetchRecommendations(analysis.faceShape, analysis);
            }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowManualPicker((v) => !v)}
              className="h-11 px-5 rounded-full border border-line hover:border-ink text-ink text-sm font-medium transition-colors"
            >
              Saya sudah tahu bentuk wajah saya
            </button>
            <button
              onClick={() => {
                setManualShape(null);
                fetchRecommendations(null, null);
              }}
              className="h-11 px-4 text-sm text-muted hover:text-ink"
            >
              Lewati
            </button>
          </div>

          {showManualPicker && (
            <div className="flex flex-wrap gap-2">
              {(['Oval', 'Square', 'Round', 'Heart', 'Diamond'] as FaceShape[]).map((shape) => (
                <button
                  key={shape}
                  onClick={() => {
                    setManualShape(shape);
                    onPickFaceShape(shape);
                    fetchRecommendations(shape);
                  }}
                  className="h-11 px-5 rounded-full bg-soft hover:bg-soft-strong text-sm text-ink"
                >
                  {faceShapeLabel(shape)}
                </button>
              ))}
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-muted leading-relaxed max-w-xl">
            <ShieldCheck className="w-4 h-4 shrink-0 text-sage" />
            Foto hanya dikirim ke Gemini untuk dianalisis saat kamu mengambil atau memilih foto, dan tidak kami simpan.
          </p>
        </section>
      )}

      {/* Step 5: recommendations */}
      {step === 'result' && (
        <section className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">
                {isLoading
                  ? 'Gemini sedang memilih frame...'
                  : aiQuery
                  ? `Hasil untuk “${aiQuery}”`
                  : 'Frame yang paling cocok untukmu'}
              </h2>
              {!isLoading && (
                <p className="text-muted leading-relaxed">
                  {isFallback
                    ? aiQuery
                      ? 'Gemini sedang tidak tersedia, jadi ini hasil otomatis berdasarkan kata kunci pencarianmu.'
                      : 'Gemini sedang tidak tersedia, jadi ini rekomendasi otomatis berdasarkan jawaban dan bentuk wajahmu.'
                    : summary}
                </p>
              )}
            </div>
            {!isLoading && (
              <button onClick={restart} className="h-11 px-5 rounded-full border border-line hover:border-ink text-sm text-ink flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Ulangi
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-80 rounded-3xl bg-soft animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results?.map(({ frame, reason }, idx) => {
                const match = faceShape ? calculateFaceFrameMatchScore(faceShape, frame.shape) : null;
                return (
                  <article key={frame.id} className="rounded-3xl border border-line bg-white overflow-hidden flex flex-col">
                    <div className="relative shrink-0 aspect-[4/3] bg-soft overflow-hidden">
                      <img src={frame.imageUrl} alt={frame.name} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {idx === 0 && <span className="px-2.5 py-1 rounded-full bg-ink text-white text-xs">Pilihan teratas</span>}
                        {match && <span className="px-2.5 py-1 rounded-full bg-white/90 text-xs text-ink">Cocok {match.score}%</span>}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-muted">{materialLabel(frame.material)}</span>
                        <h3 className="text-xl font-normal tracking-[-0.03em] text-ink">{frame.name}</h3>
                        <span className="text-sm tabular-nums text-ink">{formatRupiah(frame.price)}</span>
                      </div>
                      <p className="text-sm text-body leading-relaxed flex gap-2">
                        {isFallback ? (
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-sage" />
                        ) : (
                          <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-sage" />
                        )}
                        {reason}
                      </p>
                      <div className="mt-auto pt-4 border-t border-line flex gap-2">
                        <button
                          onClick={() => onSelectFrameForTryOn(frame)}
                          className="flex-1 h-10 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-4 h-4" />
                          Coba AR
                        </button>
                        <button
                          onClick={() => onConfigureLenses(frame)}
                          className="flex-1 h-10 rounded-full border border-line hover:border-ink text-sm text-ink"
                        >
                          Atur lensa
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
