import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Type, type GenerateContentResponse } from '@google/genai';

export const apiRouter = Router();

// Simple in-memory fixed-window rate limiter per client IP, protecting the Gemini quota.
// Per-instance only: good enough for a single Cloud Run container, not a global limit.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestCounts = new Map<string, { count: number; windowStart: number }>();

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const entry = requestCounts.get(key);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    requestCounts.set(key, { count: 1, windowStart: now });
    // Opportunistically drop stale entries so the map cannot grow without bound
    if (requestCounts.size > 10_000) {
      for (const [k, v] of requestCounts) {
        if (now - v.windowStart >= RATE_LIMIT_WINDOW_MS) requestCounts.delete(k);
      }
    }
    next();
    return;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({ success: false, error: 'Terlalu banyak permintaan. Silakan coba lagi sebentar lagi.' });
    return;
  }

  entry.count++;
  next();
}

apiRouter.use(rateLimit);

// Fail fast with a clear message when the server has no Gemini key (e.g. running locally without .env)
apiRouter.use((_req: Request, res: Response, next: NextFunction): void => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    res.status(503).json({
      success: false,
      error: 'Layanan AI belum dikonfigurasi di server ini (GEMINI_API_KEY belum diatur).',
    });
    return;
  }
  next();
});

// Never fabricate AI results: report the failure so the UI can tell the user honestly
function sendAiUnavailable(res: Response): void {
  res.status(503).json({
    success: false,
    error: 'Analisis AI sedang tidak tersedia. Silakan coba lagi.',
  });
}

// Initialize GoogleGenAI SDK with required telemetry User-Agent header
// Created on first use, not at import time: this module is imported before dotenv.config()
// runs (in server.ts and vite.config.ts), so GEMINI_API_KEY from .env isn't set yet at load.
// Without a key the SDK falls back to Google Cloud default credentials and fails.
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

type GenerateParams = Parameters<GoogleGenAI['models']['generateContent']>[0];

// Tried in order. When the primary model is overloaded (429/5xx) or too slow, fall back to
// an older Flash model rather than failing the visitor's request.
// The lite model is the last resort: lower quality, but it stays fast under heavy load.
const MODEL_CHAIN: { model: string; timeoutMs: number }[] = [
  { model: 'gemini-3.8-flash', timeoutMs: 12_000 },
  { model: 'gemini-3.5-flash', timeoutMs: 12_000 },
  { model: 'gemini-3.5-flash-lite', timeoutMs: 20_000 },
];

function isTransient(error: unknown): boolean {
  const { status, name, message } = error as { status?: number; name?: string; message?: string };
  if (status === 429 || (status !== undefined && status >= 500)) return true;
  // Client-side timeout (AbortSignal) or a dropped connection
  return name === 'AbortError' || name === 'TimeoutError' || /abort|timeout|fetch failed/i.test(message ?? '');
}

/** generateContent across MODEL_CHAIN, moving on when a model is overloaded or times out */
async function generateWithRetry(params: GenerateParams): Promise<GenerateContentResponse> {
  let lastError: unknown;
  for (const { model, timeoutMs } of MODEL_CHAIN) {
    try {
      return await getAi().models.generateContent({
        ...params,
        model,
        config: { ...params.config, httpOptions: { ...params.config?.httpOptions, timeout: timeoutMs } },
      });
    } catch (error) {
      lastError = error;
      if (!isTransient(error)) throw error;
      console.warn(`Gemini ${model} unavailable, trying next model:`, (error as { status?: number }).status ?? (error as Error).message);
    }
  }
  throw lastError;
}

/**
 * POST /api/analyze-face
 * Analyzes uploaded face image (or base64 snapshot) using Gemini 3.8 Flash
 */
apiRouter.post('/analyze-face', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mockDescriptor } = req.body;

    // If an image is provided, prepare multimodal prompt
    const parts: any[] = [];

    if (imageBase64) {
      // Strip data url prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const promptText = `
You are a master optician and facial aesthetic scientist at FrameAI. Analyze the facial portrait in high optical detail.
Determine:
1. Face Shape: strictly one of ["Oval", "Square", "Round", "Heart", "Diamond"].
2. Skin Undertone: strictly one of ["Warm", "Cool", "Neutral", "Olive"].
3. Jawline Structure: strictly one of ["Soft curved", "Angular defined", "Tapered", "Prominent"].
4. Estimated Pupillary Distance (PD): a realistic integer in millimeters between 58 and 68 (default around 63mm).
5. Face width-to-height ratio (e.g. 1.35).
6. Cheekbone prominence: strictly one of ["High", "Balanced", "Subtle"].
7. Confidence score: integer from 85 to 99.
8. Styling Tips: 3 professional optician bullet points on bridge placement, frame width balancing, and temple ergonomics.
9. Detailed reasoning explaining the facial landmarks, jaw angle, forehead proportion, and why specific optical frame styles balance these features.
10. Recommended frame shapes: array containing 2 to 3 shapes from ["Oval", "Square", "Round", "Geometric", "Aviator", "Cat-Eye"].

${mockDescriptor ? `Note: User selected preset facial profile archetype: ${mockDescriptor}` : ''}

Language: keep every enum value above exactly as listed in English, but write stylingTips and reasoning in natural Bahasa Indonesia.
`;

    parts.push({ text: promptText });

    const response = await generateWithRetry({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: 'You are an expert board-certified ophthalmic optician and haute horlogerie / eyewear stylist. Return high precision JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faceShape: {
              type: Type.STRING,
              description: 'One of: Oval, Square, Round, Heart, Diamond',
            },
            skinUndertone: {
              type: Type.STRING,
              description: 'One of: Warm, Cool, Neutral, Olive',
            },
            jawline: {
              type: Type.STRING,
              description: 'One of: Soft curved, Angular defined, Tapered, Prominent',
            },
            estimatedPd: {
              type: Type.INTEGER,
              description: 'Estimated Pupillary Distance in mm (58 to 68)',
            },
            faceWidthToHeightRatio: {
              type: Type.NUMBER,
              description: 'Ratio of facial width across zygomatic arches to facial length',
            },
            cheekboneProminence: {
              type: Type.STRING,
              description: 'One of: High, Balanced, Subtle',
            },
            confidenceScore: {
              type: Type.INTEGER,
              description: 'Detection confidence percentage (85-99)',
            },
            stylingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 professional optician advice points',
            },
            reasoning: {
              type: Type.STRING,
              description: 'Personalized scientific styling reasoning',
            },
            recommendedShapes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Recommended eyewear frame shapes',
            },
          },
          required: [
            'faceShape',
            'skinUndertone',
            'jawline',
            'estimatedPd',
            'confidenceScore',
            'stylingTips',
            'reasoning',
            'recommendedShapes',
          ],
        },
      },
    });

    const outputText = response.text || '{}';
    const parsed = JSON.parse(outputText);
    res.json({ success: true, analysis: parsed });
  } catch (error) {
    console.error('Error analyzing face with Gemini:', error);
    sendAiUnavailable(res);
  }
});

/**
 * POST /api/why-this-frame
 * Explains optical styling synergy between user's face shape and a specific frame
 */
apiRouter.post('/why-this-frame', async (req: Request, res: Response): Promise<void> => {
  try {
    const { faceShape, skinUndertone, frame } = req.body;

    const prompt = `
Explain in 2-3 engaging, luxurious optician sentences why the "${frame.name}" frame (${frame.shape} silhouette, made of ${frame.material}, dimensions ${frame.dimensions?.lensWidth ?? 52}mm lens width and ${frame.dimensions?.bridgeWidth ?? 18}mm bridge) is an exceptional fit for a customer with a ${faceShape} face shape and ${skinUndertone || 'neutral'} skin undertone.
Highlight how the bridge, rim shape, and proportions complement their features.
Write the answer in natural Bahasa Indonesia.
`;

    const response = await generateWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a luxury optical stylist at FrameAI. Be succinct, inspiring, and scientifically accurate regarding optical balance.',
      },
    });

    res.json({
      success: true,
      reasoning: response.text?.trim() || `Proporsi ${frame.name} memberi kontras yang menawan dan menonjolkan kontur wajah ${faceShape.toLowerCase()} Anda.`,
    });
  } catch (error) {
    console.error('Error in /api/why-this-frame:', error);
    sendAiUnavailable(res);
  }
});

/**
 * POST /api/seller-insights
 * Generates AI-powered store intelligence and inventory forecasts
 */
apiRouter.post('/seller-insights', async (req: Request, res: Response): Promise<void> => {
  try {
    const { totalFrames, orderCount, lowStockCount } = req.body;

    const prompt = `
Analyze current retail metrics for FrameAI optical platform:
- Catalog size: ${totalFrames || 12} active luxury frames
- Recent customer orders: ${orderCount || 8} orders
- Low stock items: ${lowStockCount || 3} frames under 10 units

Generate strategic merchant store intelligence including:
1. Executive summary of eyewear discovery trends.
2. Trending face shapes among virtual try-on users (with estimated percentage shares and commentary).
3. Lens upgrade trends (e.g. Blue Light Filter adoption, High-Index 1.67 transitions).
4. Restock recommendations for top performing silhouettes.
5. Projected next quarter demand summary.

Language: write all descriptive text in natural Bahasa Indonesia. Keep "shape" as one of Oval, Square, Round, Heart, Diamond and "urgency" as one of High, Medium, Low, in English.
`;

    const response = await generateWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are FrameAI Principal Retail & Supply Chain Intelligence AI. Return valid JSON adhering to the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            trendingFaceShapes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  shape: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                },
                required: ['shape', 'percentage', 'description'],
              },
            },
            lensUpgradeTrends: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  adoptionRate: { type: Type.STRING },
                },
                required: ['name', 'adoptionRate'],
              },
            },
            restockRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  frameName: { type: Type.STRING },
                  urgency: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                },
                required: ['frameName', 'urgency', 'rationale'],
              },
            },
            projectedDemandSummary: { type: Type.STRING },
          },
          required: [
            'summary',
            'trendingFaceShapes',
            'lensUpgradeTrends',
            'restockRecommendations',
            'projectedDemandSummary',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, insights: parsed });
  } catch (error) {
    console.error('Error in /api/seller-insights:', error);
    sendAiUnavailable(res);
  }
});

/**
 * POST /api/recommend-frames
 * Picks the best frames for a visitor from the catalog they were shown, using their quiz
 * answers and (optionally) their AI face analysis. Gemini may only return catalog ids.
 */
const MAX_CATALOG_SIZE = 40;
const clip = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');

apiRouter.post('/recommend-frames', async (req: Request, res: Response): Promise<void> => {
  const { answers, face, frames } = req.body ?? {};
  if (!Array.isArray(frames) || frames.length === 0) {
    res.status(400).json({ success: false, error: 'Katalog frame kosong.' });
    return;
  }

  // Only pass the fields the model needs, with bounded lengths
  const catalog = frames.slice(0, MAX_CATALOG_SIZE).map((f: any) => ({
    id: clip(f?.id, 128),
    name: clip(f?.name, 100),
    shape: clip(f?.shape, 30),
    material: clip(f?.material, 60),
    priceIdr: Number(f?.price) || 0,
    weightGrams: Number(f?.weightGrams) || 0,
    lensWidthMm: Number(f?.dimensions?.lensWidth) || 0,
    totalWidthMm: Number(f?.dimensions?.totalWidth) || 0,
    polarized: Boolean(f?.isPolarized),
    description: clip(f?.description, 300),
  })).filter((f) => f.id);
  const ids = catalog.map((f) => f.id);

  const profile = {
    lifestyle: clip(answers?.lifestyle, 40),
    aesthetic: clip(answers?.aesthetic, 40),
    materialPreference: clip(answers?.materialPref, 40),
    faceShape: clip(face?.faceShape, 20) || 'unknown',
    skinUndertone: clip(face?.skinUndertone, 20) || 'unknown',
    jawline: clip(face?.jawline, 40) || 'unknown',
    pupillaryDistanceMm: Number(face?.estimatedPd) || null,
  };

  try {
    const response = await generateWithRetry({
      model: 'gemini-3.8-flash',
      contents: `Customer profile:\n${JSON.stringify(profile)}\n\nCatalog (choose ONLY from these ids):\n${JSON.stringify(catalog)}\n\nPick the 3 best frames for this customer, best first. Weigh face shape harmony, lifestyle (e.g. light frames and blue-light needs for screen work, polarized for outdoor), preferred aesthetic and material, and fit (frame width vs. PD when known). Write each reason and the summary in natural Bahasa Indonesia, addressing the customer as "kamu", 1-2 sentences each, mentioning concrete attributes. Use Indonesian names for face shapes (Oval, Kotak, Bulat, Hati, Diamond) and frame shapes (Geometris, Kotak, Bulat, Aviator, Cat-Eye, Oval); never write the English words Square, Round or Heart.`,
      config: {
        systemInstruction: 'You are an expert optician and eyewear stylist at FrameAI. Only recommend frames from the provided catalog. Return JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  frameId: { type: Type.STRING, enum: ids },
                  reason: { type: Type.STRING },
                },
                required: ['frameId', 'reason'],
              },
            },
          },
          required: ['summary', 'recommendations'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    // Defence in depth: drop unknown or duplicate ids even though the schema restricts them
    const seen = new Set<string>();
    const recommendations = (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
      .filter((r: any) => ids.includes(r?.frameId) && !seen.has(r.frameId) && seen.add(r.frameId))
      .slice(0, 3)
      .map((r: any) => ({ frameId: r.frameId as string, reason: clip(r.reason, 400) }));

    if (recommendations.length === 0) throw new Error('Gemini returned no catalog frames');
    res.json({ success: true, summary: clip(parsed.summary, 500), recommendations });
  } catch (error) {
    console.error('Error in /api/recommend-frames:', error);
    sendAiUnavailable(res);
  }
});
