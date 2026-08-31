export type FrameShape =
  | 'Rectangle'
  | 'Round'
  | 'Square'
  | 'Aviator'
  | 'Cat-Eye'
  | 'Browline'
  | 'Wayfarer'
  | 'Oval'
  | 'Geometric';

export type FrameMaterial =
  | 'Italian Acetate'
  | 'Japanese Titanium'
  | 'Javanese Teak & Bamboo'
  | 'Stainless Steel'
  | 'Ultralight TR90'
  | 'Recycled Ocean Bio-Acetate';

export type FrameStyle = 'Minimal' | 'Professional' | 'Casual' | 'Vintage' | 'Bold';

export type FrameUsage = 'Everyday' | 'Work' | 'Fashion' | 'Outdoor' | 'Formal';

export type FaceShape = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Diamond' | 'Oblong';

export interface FrameDimensions {
  lensWidth: number; // in mm, e.g. 51
  bridgeWidth: number; // in mm, e.g. 19
  templeLength: number; // in mm, e.g. 145
  frameWidth: number; // in mm, e.g. 138
  lensHeight: number; // in mm, e.g. 42
}

export interface FrameColorOption {
  name: string;
  hex: string;
  texture?: 'matte' | 'glossy' | 'tortoise' | 'woodgrain' | 'metallic';
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sellerId: string;
  sellerName: string;
  sellerLocation: string; // Bandung, Yogyakarta, Jakarta, Surabaya, Bali, Malang, Semarang, Solo
  price: number; // IDR (e.g. 1450000)
  originalPrice?: number;
  category: 'Eyeglasses' | 'Sunglasses' | 'Blue Light' | 'Artisan Custom';
  frameShape: FrameShape;
  frameColors: FrameColorOption[];
  defaultColor: string;
  material: FrameMaterial | string;
  style: FrameStyle[];
  bestForFaceShapes: FaceShape[];
  usage: FrameUsage[];
  description: string;
  dimensions: FrameDimensions;
  weightGrams: number;
  images: string[];
  thumbnail: string;
  // AR Product Display & 3D Spatial Metadata
  arTryOnEnabled?: boolean;
  arDisplayEnabled?: boolean;
  model3D?: string;
  modelScaleUnit?: 'millimeter' | 'meter';
  frameWidthMm?: number;
  lensWidthMm?: number;
  lensHeightMm?: number;
  bridgeWidthMm?: number;
  templeLengthMm?: number;
  targetWidthMm?: number;
  targetHeightMm?: number;
  // Engagement and trend metrics
  views?: number;
  tryOns?: number;
  wishlists?: number;
  purchases?: number;
  trendScore?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  isPublished: boolean;
  isSpotlight?: boolean;
  isTrending?: boolean;
  whyThisFrameTemplate?: string;
  tags: string[];
  createdAt: string;
}

export interface Seller {
  id: string;
  sellerId?: string;
  ownerUid?: string;
  name: string;
  city?: string;
  location: string;
  province: string;
  status?: string;
  shortDescription?: string;
  description: string;
  story: string;
  brandStory?: string;
  foundedYear: number;
  avatar: string;
  logo?: string;
  bannerImage: string;
  rating: number;
  salesCount: number;
  productCount: number;
  specialty: string;
  verified: boolean;
}

// Structured output from Gemini Find My Frame
export interface GeminiFindMyFrameResult {
  faceShape: FaceShape;
  confidence: number; // e.g. 0.94
  recommendedFrameShapes: FrameShape[];
  recommendedStyles: FrameStyle[];
  styleSummary: string;
  reasoning: string;
}

export interface FaceAnalysisResult extends GeminiFindMyFrameResult {
  stylePreference: FrameStyle;
  usage: FrameUsage;
  budgetMax: number;
  facialProportions?: {
    jawline: 'Soft & Curved' | 'Sharp & Angular' | 'Balanced' | 'Defined';
    foreheadWidth: 'Narrow' | 'Balanced' | 'Broad';
    faceLength: 'Standard' | 'Elongated' | 'Compact';
    cheekboneProminence: 'High' | 'Soft' | 'Prominent';
  };
  recommendedShapes: FrameShape[]; // Alias for compatibility
  colorPaletteRecommendation?: string[];
  capturedImage?: string;
  analyzedAt: string;
  aiExplanation?: string;
}

// Top Matched Products
export interface ProductMatchResult {
  productId: string;
  product: Product;
  compatibilityScore: number; // 0 - 100 presented as AI recommendation score
  reason: string; // concise explanation
  recommendedFrameShape: FrameShape;
  styleMatch: string;
}

export interface RecommendationMatch extends ProductMatchResult {
  aiRationale: string;
  highlightedFeatures: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  selectedColor: string;
  prescriptionType?: 'Non-Prescription' | 'Single Vision' | 'Blue Light Block' | 'Progressive';
  quantity: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'customer' | 'seller';
  sellerId?: string;
  savedFaceAnalysis?: FaceAnalysisResult;
  wishlist: string[]; // product IDs
  recentTryOns: string[]; // product IDs
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: {
    productId: string;
    productName: string;
    sellerName: string;
    price: number;
    color: string;
    quantity: number;
    image: string;
  }[];
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    courier: string;
  };
  paymentMethod: 'QRIS' | 'BCA Virtual Account' | 'Mandiri VA' | 'GoPay' | 'ShopeePay';
  status: 'Pending' | 'Paid' | 'Processing' | 'Shipped' | 'Delivered';
  createdAt: string;
}

export interface SellerProductPerformance {
  productId: string;
  name: string;
  views: number;
  tryOns: number;
  addToCart: number;
  purchases: number;
  conversionRate: number;
}

export interface SellerAnalytics {
  views: number;
  tryOns: number;
  addToCart: number;
  purchases: number;
  tryOnConversionRate: number;
  totalRevenue: number;
  monthlyRevenue?: number;
  ordersCount?: number;
  cartConversionRate?: number;
  averageRating?: number;
  // AR Product Display In-Store Metrics
  arProductDisplays?: number;
  arTargetDetectedCount?: number;
  arFaceTryOnFromDisplayCount?: number;
  arDisplayAddToCartCount?: number;
  topPerformingProducts?: SellerProductPerformance[];
  topSellingProducts?: {
    productId: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }[];
  faceShapeDemographics: {
    faceShape: FaceShape;
    percentage: number;
  }[];
}

// Structured Seller AI Insight
export interface SellerStructuredInsight {
  id: string;
  insight: string;
  supportingMetric: string;
  recommendation: string;
  type?: 'performance' | 'pricing' | 'inventory' | 'trend' | 'opportunity';
}

export interface AIInsight {
  id: string;
  insight?: string;
  supportingMetric?: string;
  recommendation?: string;
  date?: string;
  title?: string;
  message?: string;
  actionRecommendation?: string;
  confidenceScore?: number;
  relatedProductId?: string;
  type?: 'performance' | 'pricing' | 'inventory' | 'trend' | 'opportunity';
}
