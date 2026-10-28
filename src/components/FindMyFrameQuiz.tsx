import React, { useState } from 'react';
import { OpticalFrame, FaceShape } from '../types';
import { Sparkles, Check, ArrowRight, RotateCcw, Camera, Eye } from 'lucide-react';
import { formatRupiah, faceShapeLabel, frameShapeLabel, materialLabel } from '../utils/format';
import { calculateFaceFrameMatchScore } from '../utils/opticalMath';

interface FindMyFrameQuizProps {
  frames: OpticalFrame[];
  onSelectFrameForTryOn: (frame: OpticalFrame) => void;
  onConfigureLenses: (frame: OpticalFrame) => void;
  onCompleteQuiz?: (detectedShape: FaceShape) => void;
}

interface QuizAnswers {
  lifestyle?: string;
  aesthetic?: string;
  materialPref?: string;
  faceShape?: FaceShape;
}

export const FindMyFrameQuiz: React.FC<FindMyFrameQuizProps> = ({
  frames,
  onSelectFrameForTryOn,
  onConfigureLenses,
  onCompleteQuiz,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const totalSteps = 4;

  const handleSelectOption = (key: keyof QuizAnswers, value: any) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    } else {
      setQuizFinished(true);
      if (updated.faceShape && onCompleteQuiz) {
        onCompleteQuiz(updated.faceShape);
      }
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setAnswers({});
    setQuizFinished(false);
  };

  // Compute matched frames based on quiz answers
  const scoredFrames = frames.map((f) => {
    let score = 75;
    if (answers.faceShape) {
      score = calculateFaceFrameMatchScore(answers.faceShape, f.shape).score;
    }
    if (answers.materialPref === 'titanium' && f.material.includes('Titanium')) score += 10;
    if (answers.materialPref === 'acetate' && f.material.includes('Acetate')) score += 10;
    if (answers.materialPref === 'eco' && f.material.includes('Eco')) score += 10;
    if (answers.lifestyle === 'digital' && f.weightGrams < 20) score += 6;
    if (answers.aesthetic === 'bold' && f.shape === 'Square') score += 5;
    if (answers.aesthetic === 'minimalist' && f.shape === 'Geometric') score += 5;

    return { frame: f, finalScore: Math.min(99, score) };
  }).sort((a, b) => b.finalScore - a.finalScore);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-white border border-line p-6 md:p-10 shadow-float">
      {!quizFinished ? (
        <div>
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sage" />
              <span className="text-xs font-medium text-body">
                Cari Frame-ku · Panduan Memilih
              </span>
            </div>
            <span className="text-xs tabular-nums text-muted">
              Langkah {currentStep} dari {totalSteps}
            </span>
          </div>

          <div className="w-full bg-soft h-1.5 rounded-full overflow-hidden mb-8">
            <div
              className="bg-ink h-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Question 1: Lifestyle */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl md:text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">
                  Di mana Anda paling sering memakai kacamata?
                </h3>
                <p className="text-xs text-muted">
                  Ini menentukan bobot frame, lapisan filter blue light, dan kelenturan gagang.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'digital',
                    title: 'Kerja Digital & Remote',
                    desc: 'Berjam-jam di depan layar, butuh frame ringan dan filter blue light.',
                  },
                  {
                    id: 'fashion',
                    title: 'Eksekutif & Fashion',
                    desc: 'Siluet tegas dan khas yang menonjolkan gaya Anda.',
                  },
                  {
                    id: 'outdoor',
                    title: 'Outdoor & Aktif',
                    desc: 'Lensa polarized anti-silau dengan bantalan hidung titanium anti-selip.',
                  },
                  {
                    id: 'all_day',
                    title: 'Dipakai Seharian',
                    desc: 'Nyaman dipakai hingga 16 jam sehari.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption('lifestyle', opt.id)}
                    className="p-5 rounded-2xl bg-soft border border-line hover:border-sage-line transition-all text-left group"
                  >
                    <div className="text-sm font-medium text-ink group-hover:text-sage transition-colors">
                      {opt.title}
                    </div>
                    <div className="text-xs text-muted mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 2: Aesthetic */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl md:text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">
                  Gaya desain seperti apa yang paling cocok dengan Anda?
                </h3>
                <p className="text-xs text-muted">
                  Menentukan garis siluet, bentuk bridge, dan profil tepi frame.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'minimalist',
                    title: 'Minimalis',
                    desc: 'Geometri tegas, tanpa bingkai atau kawat super tipis, bersih dan fungsional.',
                  },
                  {
                    id: 'bold',
                    title: 'Berani & Mencolok',
                    desc: 'Asetat Italia dengan warna pekat dan tampilan menonjol.',
                  },
                  {
                    id: 'retro',
                    title: 'Klasik Abadi',
                    desc: 'Aviator ikonik, bridge keyhole, dan frame bulat motif tortoise vintage.',
                  },
                  {
                    id: 'sculptural',
                    title: 'Elegan & Mewah',
                    desc: 'Cat-eye terangkat, warna emas champagne, dan finishing mengilap.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption('aesthetic', opt.id)}
                    className="p-5 rounded-2xl bg-soft border border-line hover:border-sage-line transition-all text-left group"
                  >
                    <div className="text-sm font-medium text-ink group-hover:text-sage transition-colors">
                      {opt.title}
                    </div>
                    <div className="text-xs text-muted mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 3: Material */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl md:text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">
                  Material seperti apa yang Anda sukai?
                </h3>
                <p className="text-xs text-muted">
                  Menyeimbangkan bobot, kenyamanan, dan kekokohan frame.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'titanium',
                    title: 'Titanium Aerospace',
                    desc: 'Super ringan (di bawah 15g), hipoalergenik, tahan karat, dan sedikit lentur.',
                  },
                  {
                    id: 'acetate',
                    title: 'Asetat Mazzucchelli Italia',
                    desc: 'Terasa hangat dan alami, kilau dalam, gagang berinti kawat.',
                  },
                  {
                    id: 'eco',
                    title: 'Bio-Polimer Daur Ulang',
                    desc: 'Ringan, ramah lingkungan, dengan finishing matte selembut beludru.',
                  },
                  {
                    id: 'hybrid',
                    title: 'Kombinasi Titanium & Asetat',
                    desc: 'Perpaduan terbaik: bagian depan asetat dengan gagang titanium.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption('materialPref', opt.id)}
                    className="p-5 rounded-2xl bg-soft border border-line hover:border-sage-line transition-all text-left group"
                  >
                    <div className="text-sm font-medium text-ink group-hover:text-sage transition-colors">
                      {opt.title}
                    </div>
                    <div className="text-xs text-muted mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 4: Face Structure */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl md:text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">
                  Bentuk wajah mana yang paling mirip dengan Anda?
                </h3>
                <p className="text-xs text-muted">
                  Dipakai untuk menghitung bentuk frame yang paling menyeimbangkan wajah Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'Oval',
                    title: 'Oval',
                    desc: 'Panjang dan lebar seimbang dengan garis rahang membulat lembut.',
                  },
                  {
                    id: 'Square',
                    title: 'Kotak',
                    desc: 'Garis rahang tegas bersudut dan dahi lebar.',
                  },
                  {
                    id: 'Round',
                    title: 'Bulat',
                    desc: 'Garis lembut melengkung dengan lebar dan panjang hampir sama.',
                  },
                  {
                    id: 'Heart',
                    title: 'Hati',
                    desc: 'Dahi lebar dan tulang pipi tinggi, meruncing ke dagu yang kecil.',
                  },
                  {
                    id: 'Diamond',
                    title: 'Diamond',
                    desc: 'Tulang pipi tinggi dengan dahi dan rahang yang lebih sempit.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption('faceShape', opt.id as FaceShape)}
                    className="p-5 rounded-2xl bg-soft border border-line hover:border-sage-line transition-all text-left group"
                  >
                    <div className="text-sm font-medium text-ink group-hover:text-sage transition-colors">
                      {opt.title}
                    </div>
                    <div className="text-xs text-muted mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Results Screen */
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 mb-2">
                <Check className="w-3.5 h-3.5" />
                Profil Selesai Dihitung
              </div>
              <h3 className="text-3xl md:text-4xl font-normal tracking-[-0.04em] text-ink">
                Rekomendasi Frame untuk Anda
              </h3>
              <p className="text-xs text-muted mt-1">
                Disesuaikan dengan bentuk wajah {faceShapeLabel(answers.faceShape ?? '')} dan gaya hidup Anda.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-full text-xs font-medium text-muted hover:text-ink bg-soft border border-line flex items-center gap-1.5 self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ulangi Kuis
            </button>
          </div>

          {/* Top 3 Matched Frames */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scoredFrames.slice(0, 3).map(({ frame, finalScore }, idx) => (
              <div
                key={frame.id}
                className="p-4 rounded-2xl bg-soft border border-line hover:border-sage-line transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white mb-3">
                    <img src={frame.imageUrl} alt={frame.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-medium bg-ink text-white shadow-md">
                      Cocok {finalScore}%
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/80 text-sage border border-sage-line">
                        Pilihan Terbaik
                      </div>
                    )}
                  </div>

                  <h4 className="font-normal tracking-[-0.03em] text-ink text-base">{frame.name}</h4>
                  <div className="text-xs text-muted mb-2">
                    {formatRupiah(frame.price)} · {frameShapeLabel(frame.shape)} · {materialLabel(frame.material)}
                  </div>
                  <p className="text-xs text-body line-clamp-2">{frame.description}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => onSelectFrameForTryOn(frame)}
                    className="w-full py-2 px-3 rounded-full bg-soft-strong hover:bg-line-strong text-ink font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-sage" />
                    Coba dengan AR
                  </button>

                  <button
                    onClick={() => onConfigureLenses(frame)}
                    className="w-full py-2 px-3 rounded-full bg-ink hover:bg-ink-soft text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Atur Lensa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
