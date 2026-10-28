export type FaceShape = 'Oval' | 'Square' | 'Round' | 'Heart' | 'Diamond';
export type FrameShape = 'Oval' | 'Square' | 'Round' | 'Geometric' | 'Aviator' | 'Cat-Eye';
export type FrameMaterial = 'Italian Acetate' | 'Aerospace Titanium' | 'Eco-Polymer' | 'Mixed Titanium Acetate';

export interface FrameDimensions {
  lensWidth: number; // mm e.g. 52
  bridgeWidth: number; // mm e.g. 18
  templeLength: number; // mm e.g. 145
  lensHeight: number; // mm e.g. 42
  totalWidth: number; // mm e.g. 138
}

export interface FrameColorOption {
  name: string;
  hex: string;
  acetateTexture?: string; // e.g. 'tortoise' | 'matte' | 'crystal' | 'metallic'
}

export interface OpticalFrame {
  id: string;
  name: string;
  brand: string;
  shape: FrameShape;
  material: FrameMaterial;
  price: number;
  colors: FrameColorOption[];
  dimensions: FrameDimensions;
  weightGrams: number;
  fitFaceShapes: FaceShape[];
  description: string;
  isPolarized: boolean;
  imageUrl: string;
  model3dPreset: 'aviator' | 'wayfarer' | 'round' | 'geometric' | 'cateye';
  stock: number;
  rating: number;
  reviewsCount: number;
  isNew?: boolean;
  isBestseller?: boolean;
}

export interface FaceAnalysisResult {
  faceShape: FaceShape;
  skinUndertone: 'Warm' | 'Cool' | 'Neutral' | 'Olive';
  jawline: 'Soft curved' | 'Angular defined' | 'Tapered' | 'Prominent';
  estimatedPd: number; // mm, typically 61-66
  faceWidthToHeightRatio: number;
  cheekboneProminence: 'High' | 'Balanced' | 'Subtle';
  confidenceScore: number;
  stylingTips: string[];
  reasoning: string;
  recommendedShapes: FrameShape[];
}

export interface TryOnLook {
  id: string;
  userId: string;
  frameId: string;
  frameName: string;
  frameImageUrl: string;
  snapshotData: string; // data URL of captured try-on
  faceShape?: string;
  matchScore: number;
  createdAt: string;
}

export interface PrescriptionInput {
  odSph: number;
  odCyl?: number;
  odAxis?: number;
  osSph: number;
  osCyl?: number;
  osAxis?: number;
  pd: number;
}

export type LensType = 'single_vision' | 'progressive' | 'reading' | 'non_prescription';
export type LensIndex = '1.50_standard' | '1.60_thin' | '1.67_ultrathin' | '1.74_high_index';

export interface LensConfiguration {
  type: LensType;
  index: LensIndex;
  blueLightFilter: boolean;
  photochromic: boolean;
  antiReflective: boolean;
  prescription?: PrescriptionInput;
}

export interface CartItem {
  id: string; // unique item instance id
  frame: OpticalFrame;
  selectedColor: FrameColorOption;
  lensConfig: LensConfiguration;
  calculatedPrice: number;
  quantity: number;
}

export type OrderStatus = 'received' | 'crafting_lenses' | 'optical_qc' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SellerInsights {
  summary: string;
  trendingFaceShapes: { shape: FaceShape; percentage: number; description: string }[];
  lensUpgradeTrends: { name: string; adoptionRate: string }[];
  restockRecommendations: { frameName: string; urgency: 'High' | 'Medium' | 'Low'; rationale: string }[];
  projectedDemandSummary: string;
}
