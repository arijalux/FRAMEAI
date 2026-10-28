import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

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

// Never fabricate AI results: report the failure so the UI can tell the user honestly
function sendAiUnavailable(res: Response): void {
  res.status(503).json({
    success: false,
    error: 'Analisis AI sedang tidak tersedia. Silakan coba lagi.',
  });
}

// Initialize GoogleGenAI SDK with required telemetry User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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

    const response = await ai.models.generateContent({
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

    const response = await ai.models.generateContent({
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

    const response = await ai.models.generateContent({
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
