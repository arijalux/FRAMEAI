import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Seller,
  UserProfile,
  CartItem,
  FaceAnalysisResult,
  RecommendationMatch,
  ProductMatchResult,
  Order,
  SellerAnalytics,
  SellerStructuredInsight,
  AIInsight,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_SELLERS, INITIAL_SELLER_ANALYTICS, INITIAL_ORDERS } from '../data/seedData';
import {
  auth,
  signInWithGoogle as firebaseGoogleSignIn,
  loginWithEmail as firebaseEmailLogin,
  registerWithEmail as firebaseEmailRegister,
  logoutUser as firebaseLogout,
  loginAsDemoAccount as firebaseLoginAsDemo,
  ensureSellerDemoFirestoreDocs,
  ensureCustomerDemoFirestoreDocs,
  upgradeUserToSeller as firebaseUpgradeUserToSeller,
  DEMO_CUSTOMER_CONFIG,
  DEMO_SELLER_CONFIG,
  formatAuthErrorMessage,
  fetchProductsFromFirestore,
  addProductToFirestore,
  updateProductInFirestore,
  deleteProductFromFirestore,
  fetchSellersFromFirestore,
  fetchWishlistFromFirestore,
  saveWishlistToFirestore,
  fetchCartFromFirestore,
  saveCartToFirestore,
  saveOrderToFirestore,
  fetchOrdersFromFirestore,
  logTryOnSessionToFirestore,
  saveRecommendationsToFirestore,
  fetchSellerAnalyticsFromFirestore,
  seedFirestoreIfEmpty,
  fetchUserDocFromFirestore,
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { matchProductsWithAiRecommendations, rankRecommendedFrames, generateSellerDemandInsights } from '../services/geminiService';

interface AppContextType {
  // Navigation & Route
  currentPath: string;
  navigate: (path: string | number) => void;

  // Firebase Auth
  currentUser: UserProfile | null;
  user: UserProfile; // Guaranteed user profile
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authRedirectPath: string | null;
  setAuthRedirectPath: (path: string | null) => void;
  openAuthModalWithRedirect: (redirectPath?: string) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role?: 'customer' | 'seller') => Promise<void>;
  loginDemoAccount: (type: 'customer' | 'seller') => Promise<void>;
  upgradeToSeller: (sellerData: { name: string; city: string; specialty?: string; story?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  setUserRole: (role: 'customer' | 'seller') => void;

  // Firestore Products & Sellers
  products: Product[];
  sellers: Seller[];
  isLoadingProducts: boolean;
  productsError: string | null;
  reloadProducts: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getSellerById: (id: string) => Seller | undefined;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  togglePublishProduct: (id: string) => Promise<void>;

  // Cart (Persisted in Firestore + Local)
  cart: CartItem[];
  addToCart: (product: Product, color?: string, prescription?: CartItem['prescriptionType']) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Wishlist & Compare
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  compareList: string[];
  toggleCompare: (productId: string) => void;
  removeFromCompare: (productId: string) => void;
  addToCompare?: (productId: string) => void;
  isCompared: (productId: string) => boolean;
  clearCompare: () => void;

  // AI & Styling State
  faceAnalysis: FaceAnalysisResult | null;
  setFaceAnalysis: (analysis: FaceAnalysisResult | null) => void;
  topMatches: ProductMatchResult[];
  recommendations: RecommendationMatch[];
  setRecommendations: (recs: RecommendationMatch[]) => void;
  executeAnalysisMatch: (analysis: FaceAnalysisResult) => Promise<void>;

  // Try-On State & Tracking
  activeTryOnProductId: string | null;
  setActiveTryOnProductId: (id: string | null) => void;
  logTryOn: (productId: string, productName: string, durationSeconds?: number, snapshot?: string) => Promise<void>;

  // Orders
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;

  // Seller Dashboard
  sellerAnalytics: SellerAnalytics;
  structuredInsights: SellerStructuredInsight[];
  refreshSellerInsights: () => Promise<void>;
  aiInsights: AIInsight[];
  refreshAiInsights: () => void;

  // Toast Notification
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_WISHLIST = 'frameai_wishlist_v3';
const LOCAL_STORAGE_KEY_CART = 'frameai_cart_v3';
const LOCAL_STORAGE_KEY_ANALYSIS = 'frameai_analysis_v3';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return (hash || window.location.pathname || '/').toString();
  });

  const navigate = (path: string | number) => {
    if (typeof path === 'number') {
      if (window.history.length > 1) {
        window.history.go(path);
      } else {
        const fallback = '/';
        window.location.hash = fallback;
        setCurrentPath(fallback);
      }
      return;
    }

    const targetPath = typeof path === 'string' && path ? path : '/';
    window.location.hash = targetPath;
    setCurrentPath(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');
      const path = (rawHash || '/').toString();
      setCurrentPath(path);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // -------------------------------------------------------------
  // FIREBASE AUTHENTICATION STATE
  // -------------------------------------------------------------
  const GUEST_USER: UserProfile = {
    id: 'user-guest',
    name: 'Eyewear Guest',
    email: '',
    avatar: '',
    role: 'customer',
    sellerId: undefined,
    wishlist: ['frame-the-architect'],
    recentTryOns: ['frame-the-architect'],
  };

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRedirectPath, setAuthRedirectPath] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(GUEST_USER);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const openAuthModalWithRedirect = (redirectPath?: string) => {
    if (redirectPath) {
      setAuthRedirectPath(redirectPath);
    }
    setIsAuthModalOpen(true);
  };

  // -------------------------------------------------------------
  // PRODUCTS & SELLERS STATE (FROM FIRESTORE)
  // -------------------------------------------------------------
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sellers, setSellers] = useState<Seller[]>(INITIAL_SELLERS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // CART & WISHLIST
  // -------------------------------------------------------------
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_WISHLIST);
      return saved ? JSON.parse(saved) : ['frame-the-architect'];
    } catch {
      return ['frame-the-architect'];
    }
  });

  const [compareList, setCompareList] = useState<string[]>(['frame-the-architect', 'frame-batavia-titanium-brow']);

  // -------------------------------------------------------------
  // AI STYLING & RECOMMENDATIONS
  // -------------------------------------------------------------
  const [faceAnalysis, setFaceAnalysisState] = useState<FaceAnalysisResult | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ANALYSIS);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [topMatches, setTopMatches] = useState<ProductMatchResult[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationMatch[]>([]);
  const [activeTryOnProductId, setActiveTryOnProductId] = useState<string | null>('frame-the-architect');

  // Orders
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  // Seller Analytics & Structured Insights
  const [sellerAnalytics, setSellerAnalytics] = useState<SellerAnalytics>(INITIAL_SELLER_ANALYTICS);
  const [structuredInsights, setStructuredInsights] = useState<SellerStructuredInsight[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // -------------------------------------------------------------
  // 1. INITIALIZE FIRESTORE DATA ON MOUNT
  // -------------------------------------------------------------
  const loadFirestoreData = async () => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      // Seed asynchronously in the background so it doesn't block the initial load
      seedFirestoreIfEmpty().catch((seedErr) => {
        console.info('Firestore initial seed background notice:', seedErr?.message || seedErr);
      });

      // Fetch products and sellers
      const [fetchedProducts, fetchedSellers, fetchedAnalytics] = await Promise.all([
        fetchProductsFromFirestore(),
        fetchSellersFromFirestore(),
        fetchSellerAnalyticsFromFirestore('seller-optik-melati'),
      ]);

      if (fetchedProducts && fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
      }
      if (fetchedSellers && fetchedSellers.length > 0) {
        setSellers(fetchedSellers);
      }
      if (fetchedAnalytics) {
        setSellerAnalytics(fetchedAnalytics);
      }
    } catch (err: any) {
      console.info('Firestore offline/fallback mode active:', err?.message || err);
      // Fallback is already initialized in state (INITIAL_PRODUCTS, INITIAL_SELLERS)
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadFirestoreData();
  }, []);

  // -------------------------------------------------------------
  // 2. LISTEN TO FIREBASE AUTH STATE
  // -------------------------------------------------------------
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let userDoc: any = null;
        try {
          userDoc = await fetchUserDocFromFirestore(fbUser.uid);
        } catch (e) {
          console.warn('Error fetching user document from firestore:', e);
        }

        const isSellerDemo = fbUser.email?.trim().toLowerCase() === DEMO_SELLER_CONFIG.email.toLowerCase();
        const isCustomerDemo = fbUser.email?.trim().toLowerCase() === DEMO_CUSTOMER_CONFIG.email.toLowerCase();

        // Strict role resolution:
        // Default to 'customer'. Only seller demo or accounts with role: 'seller' get seller mode.
        const resolvedRole: 'customer' | 'seller' = isSellerDemo || userDoc?.role === 'seller' ? 'seller' : 'customer';
        const resolvedSellerId: string | undefined = isSellerDemo
          ? 'optik-melati'
          : (resolvedRole === 'seller' ? (userDoc?.sellerId || 'optik-melati') : undefined);

        // Ensure demo docs in Firestore if needed
        if (isSellerDemo) {
          ensureSellerDemoFirestoreDocs(fbUser.uid).catch(console.warn);
        } else if (isCustomerDemo) {
          ensureCustomerDemoFirestoreDocs(fbUser.uid).catch(console.warn);
        }

        const resolvedName =
          userDoc?.name ||
          fbUser.displayName ||
          (isSellerDemo ? DEMO_SELLER_CONFIG.name : isCustomerDemo ? DEMO_CUSTOMER_CONFIG.name : fbUser.email?.split('@')[0] || 'Eyewear Enthusiast');

        const profile: UserProfile = {
          id: fbUser.uid,
          name: resolvedName,
          email: fbUser.email || userDoc?.email || '',
          avatar: fbUser.photoURL || userDoc?.avatar || '',
          role: resolvedRole,
          sellerId: resolvedSellerId,
          wishlist: wishlist.length > 0 ? wishlist : ['frame-the-architect'],
          recentTryOns: ['frame-the-architect'],
        };
        setCurrentUser(profile);
        setUser(profile);

        // Sync and preserve cart:
        // Guest may have added items before logging in. If remote cart exists, merge or prefer existing cart.
        try {
          const userWishlist = await fetchWishlistFromFirestore(fbUser.uid);
          if (userWishlist && userWishlist.length > 0) {
            setWishlist((prev) => Array.from(new Set([...prev, ...userWishlist])));
          }
          const userCart = await fetchCartFromFirestore(fbUser.uid);
          if (userCart && userCart.length > 0) {
            setCart((currentCart) => {
              if (currentCart.length > 0) {
                // Merge current items with userCart
                const map = new Map<string, CartItem>();
                userCart.forEach((item) => map.set(item.id, item));
                currentCart.forEach((item) => map.set(item.id, item));
                const merged = Array.from(map.values());
                localStorage.setItem(LOCAL_STORAGE_KEY_CART, JSON.stringify(merged));
                saveCartToFirestore(fbUser.uid, merged).catch(console.warn);
                return merged;
              } else {
                localStorage.setItem(LOCAL_STORAGE_KEY_CART, JSON.stringify(userCart));
                return userCart;
              }
            });
          } else {
            // Save existing local guest cart to the newly logged in user
            setCart((currentCart) => {
              if (currentCart.length > 0) {
                saveCartToFirestore(fbUser.uid, currentCart).catch(console.warn);
              }
              return currentCart;
            });
          }
          const userOrders = await fetchOrdersFromFirestore(fbUser.uid);
          if (userOrders) {
            setOrders(userOrders);
          }
        } catch (e) {
          console.warn('Error loading user remote data:', e);
        }
      } else {
        setCurrentUser(null);
        setUser(GUEST_USER);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // -------------------------------------------------------------
  // AUTH METHODS
  // -------------------------------------------------------------
  const handlePostAuthRedirect = () => {
    setIsAuthModalOpen(false);
    if (authRedirectPath) {
      const dest = authRedirectPath;
      setAuthRedirectPath(null);
      navigate(dest);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const fbUser = await firebaseGoogleSignIn();
      showToast(`Welcome back, ${fbUser.displayName || 'Friend'}! Signed in with Google.`);
      handlePostAuthRedirect();
    } catch (err: any) {
      showToast(err.message || 'Google Sign-in failed');
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const fbUser = await firebaseEmailLogin(email, pass);
      showToast(`Welcome back, ${fbUser.displayName || email}!`);
      handlePostAuthRedirect();
    } catch (err: any) {
      showToast(err.message || 'Login failed');
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role: 'customer' | 'seller' = 'customer') => {
    try {
      const fbUser = await firebaseEmailRegister(email, pass, name, role);
      showToast(`Account created! Welcome to BJ Homemade, ${name}.`);
      handlePostAuthRedirect();
    } catch (err: any) {
      showToast(err.message || 'Registration failed');
      throw err;
    }
  };

  const loginDemoAccount = async (type: 'customer' | 'seller') => {
    try {
      await firebaseLoginAsDemo(type);
      showToast(`Signed in as ${type === 'seller' ? 'BJ Homemade Admin' : 'Demo Customer'}.`);
      handlePostAuthRedirect();
    } catch (err: any) {
      // If Firebase Auth provider is not enabled yet in console (operation-not-allowed)
      // instantiate an active demo profile so preview functionality remains fully testable
      if (err.message?.includes('Sign-up is not enabled yet') || err.code === 'auth/operation-not-allowed') {
        const isSeller = type === 'seller';
        const demoProfile: UserProfile = {
          id: isSeller ? 'demo-seller-bj-homemade' : 'demo-customer-uid',
          name: isSeller ? DEMO_SELLER_CONFIG.name : DEMO_CUSTOMER_CONFIG.name,
          email: isSeller ? DEMO_SELLER_CONFIG.email : DEMO_CUSTOMER_CONFIG.email,
          avatar: isSeller ? '/bj-logo.svg' : '',
          role: isSeller ? 'seller' : 'customer',
          sellerId: isSeller ? 'bj-homemade' : undefined,
          wishlist: wishlist.length > 0 ? wishlist : ['frame-the-architect'],
          recentTryOns: ['frame-the-architect'],
        };
        setCurrentUser(demoProfile);
        setUser(demoProfile);
        setIsAuthModalOpen(false);
        if (isSeller) {
          ensureSellerDemoFirestoreDocs(demoProfile.id).catch(console.warn);
        } else {
          ensureCustomerDemoFirestoreDocs(demoProfile.id).catch(console.warn);
        }
        showToast(`Signed in as ${isSeller ? 'BJ Homemade Admin' : 'Demo Customer'}.`);
        handlePostAuthRedirect();
        return;
      }
      showToast(err.message || 'Demo sign-in failed');
      throw err;
    }
  };

  const upgradeToSeller = async (sellerData: { name: string; city: string; specialty?: string; story?: string }) => {
    if (!currentUser || currentUser.id === 'user-guest') {
      throw new Error('Must be signed in to register an atelier');
    }
    try {
      const { sellerId, seller } = await firebaseUpgradeUserToSeller(currentUser.id, sellerData);
      setSellers((prev) => [seller, ...prev.filter((s) => s.id !== sellerId)]);
      const updatedProfile: UserProfile = {
        ...currentUser,
        role: 'seller',
        sellerId,
      };
      setCurrentUser(updatedProfile);
      setUser(updatedProfile);
      showToast(`Welcome, ${sellerData.name}! Store Admin mode activated.`);
      navigate('/seller');
    } catch (err: any) {
      showToast(err.message || 'Failed to complete seller onboarding');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseLogout();
      setCurrentUser(null);
      setUser(GUEST_USER);
      setFaceAnalysisState(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY_ANALYSIS);
      showToast('Signed out successfully');
      navigate('/');
    } catch (err: any) {
      console.warn('Sign out notice:', err);
      showToast('Sign out error. Please try again.');
    }
  };

  const setUserRole = (role: 'customer' | 'seller') => {
    setUser((prev) => ({ ...prev, role }));
    showToast(`Switched view to ${role === 'seller' ? 'SME Artisan Portal' : 'Customer Marketplace'}.`);
  };

  // -------------------------------------------------------------
  // AI ANALYSIS & PRODUCT MATCHING
  // -------------------------------------------------------------
  const executeAnalysisMatch = async (analysis: FaceAnalysisResult) => {
    setFaceAnalysisState(analysis);
    localStorage.setItem(LOCAL_STORAGE_KEY_ANALYSIS, JSON.stringify(analysis));

    // Match top 3 products from Firestore products
    const matches = matchProductsWithAiRecommendations(analysis, products);
    setTopMatches(matches);

    const ranked = rankRecommendedFrames(analysis, products);
    setRecommendations(ranked);

    // Save recommendations to Firestore for user
    if (user.id) {
      saveRecommendationsToFirestore({
        userId: user.id,
        faceAnalysis: analysis,
        topMatches: matches,
      }).catch(console.warn);
    }
  };

  const setFaceAnalysis = (analysis: FaceAnalysisResult | null) => {
    if (analysis) {
      executeAnalysisMatch(analysis);
    } else {
      setFaceAnalysisState(null);
      setTopMatches([]);
      setRecommendations([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY_ANALYSIS);
    }
  };

  useEffect(() => {
    if (faceAnalysis && products.length > 0) {
      const matches = matchProductsWithAiRecommendations(faceAnalysis, products);
      setTopMatches(matches);
      const ranked = rankRecommendedFrames(faceAnalysis, products);
      setRecommendations(ranked);
    }
  }, [products]);

  // -------------------------------------------------------------
  // PRODUCT CRUD IN FIRESTORE
  // -------------------------------------------------------------
  const getProductById = (id: string) => products.find((p) => p.id === id || p.slug === id);
  const getSellerById = (id: string) => sellers.find((s) => s.id === id);

  const addProduct = async (newProd: Omit<Product, 'id' | 'createdAt'>) => {
    const id = `frame-${Date.now()}`;
    const productWithMeta: Product = {
      ...newProd,
      id,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [productWithMeta, ...prev]);
    showToast(`Product "${productWithMeta.name}" published to Firestore!`);
    await addProductToFirestore(productWithMeta);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          updateProductInFirestore(updated).catch(console.warn);
          return updated;
        }
        return p;
      })
    );
    showToast('Product updated in Firestore.');
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product removed from catalog.');
    await deleteProductFromFirestore(id);
  };

  const togglePublishProduct = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const nextPublished = !target.isPublished;
    await updateProduct(id, { isPublished: nextPublished });
    showToast(`Product ${nextPublished ? 'published to marketplace' : 'hidden from public'}.`);
  };

  // -------------------------------------------------------------
  // CART OPERATIONS
  // -------------------------------------------------------------
  const addToCart = (product: Product, color?: string, prescription?: CartItem['prescriptionType']) => {
    const selectedColor = color || product.defaultColor;
    const cartItemId = `${product.id}-${selectedColor}-${prescription || 'standard'}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updated = [
          ...prev,
          {
            id: cartItemId,
            productId: product.id,
            product,
            selectedColor,
            prescriptionType: prescription || 'Single Vision',
            quantity: 1,
          },
        ];
      }

      localStorage.setItem(LOCAL_STORAGE_KEY_CART, JSON.stringify(updated));
      if (user.id && user.id !== 'user-guest') {
        saveCartToFirestore(user.id, updated).catch(console.warn);
      }
      return updated;
    });

    showToast(`Added ${product.name} (${selectedColor}) to cart`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => {
      const next = prev.filter(
        (item) =>
          item.id !== cartItemId &&
          item.productId !== cartItemId &&
          item.product?.id !== cartItemId
      );
      localStorage.setItem(LOCAL_STORAGE_KEY_CART, JSON.stringify(next));
      if (user.id && user.id !== 'user-guest') {
        saveCartToFirestore(user.id, next).catch(console.warn);
      }
      return next;
    });
    showToast('Item removed from cart');
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((item) => {
          if (
            item.id === cartItemId ||
            item.productId === cartItemId ||
            item.product?.id === cartItemId
          ) {
            const qty = item.quantity + delta;
            return qty > 0 ? { ...item, quantity: qty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      localStorage.setItem(LOCAL_STORAGE_KEY_CART, JSON.stringify(next));
      if (user.id && user.id !== 'user-guest') {
        saveCartToFirestore(user.id, next).catch(console.warn);
      }
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CART);
    if (user.id && user.id !== 'user-guest') {
      saveCartToFirestore(user.id, []).catch(console.warn);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  // -------------------------------------------------------------
  // WISHLIST & COMPARE
  // -------------------------------------------------------------
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from wishlist' : 'Saved to your wishlist');

      localStorage.setItem(LOCAL_STORAGE_KEY_WISHLIST, JSON.stringify(next));
      if (user.id && user.id !== 'user-guest') {
        saveWishlistToFirestore(user.id, next).catch(console.warn);
      }
      return next;
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const toggleCompare = (productId: string) => {
    setCompareList((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        showToast('You can compare up to 4 frames simultaneously');
        return prev;
      }
      showToast('Frame added to comparison matrix');
      return [...prev, productId];
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareList((prev) => prev.filter((id) => id !== productId));
    showToast('Frame removed from comparison');
  };

  const addToCompare = (productId: string) => {
    setCompareList((prev) => {
      if (prev.includes(productId)) return prev;
      if (prev.length >= 4) {
        showToast('You can compare up to 4 frames simultaneously');
        return prev;
      }
      showToast('Frame added to comparison matrix');
      return [...prev, productId];
    });
  };

  const isCompared = (productId: string) => compareList.includes(productId);
  const clearCompare = () => setCompareList([]);

  // -------------------------------------------------------------
  // TRY-ON LOGGING
  // -------------------------------------------------------------
  const logTryOn = async (productId: string, productName: string, durationSeconds?: number, snapshot?: string) => {
    await logTryOnSessionToFirestore({
      userId: user.id,
      productId,
      productName,
      sellerId: user.sellerId,
      durationSeconds,
      snapshotImage: snapshot,
    });
  };

  // -------------------------------------------------------------
  // ORDERS
  // -------------------------------------------------------------
  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> => {
    if (!currentUser || user.id === 'user-guest' || !user.email) {
      openAuthModalWithRedirect('/cart');
      throw new Error('Authentication required to place an order.');
    }

    const newOrder: Order = {
      ...orderData,
      userId: currentUser.id || user.id,
      customerEmail: user.email || orderData.customerEmail,
      customerName: user.name || orderData.customerName,
      id: `ORD-ID-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    await saveOrderToFirestore(newOrder);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updated = { ...order, status };
          saveOrderToFirestore(updated).catch(console.warn);
          return updated;
        }
        return order;
      })
    );
    showToast(`Order status updated to "${status}"`);
  };

  // -------------------------------------------------------------
  // SELLER AI INSIGHTS
  // -------------------------------------------------------------
  const refreshSellerInsights = async () => {
    showToast('Consulting Gemini AI Optical Advisor for Atelier Insights...');
    const insights = await generateSellerDemandInsights(products, sellerAnalytics, user.name);
    setStructuredInsights(insights);
  };

  const refreshAiInsights = () => {
    refreshSellerInsights();
  };

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,

        // Auth
        currentUser,
        user,
        isAuthenticated: !!currentUser,
        isAuthLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authRedirectPath,
        setAuthRedirectPath,
        openAuthModalWithRedirect,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        loginDemoAccount,
        upgradeToSeller,
        signOut,
        setUserRole,

        // Products & Sellers
        products,
        sellers,
        isLoadingProducts,
        productsError,
        reloadProducts: loadFirestoreData,
        getProductById,
        getSellerById,
        addProduct,
        updateProduct,
        deleteProduct,
        togglePublishProduct,

        // Cart
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,

        // Wishlist & Compare
        wishlist,
        toggleWishlist,
        isWishlisted,
        compareList,
        toggleCompare,
        removeFromCompare,
        addToCompare,
        isCompared,
        clearCompare,

        // AI & Recommendations
        faceAnalysis,
        setFaceAnalysis,
        topMatches,
        recommendations,
        setRecommendations,
        executeAnalysisMatch,

        // Try-On
        activeTryOnProductId,
        setActiveTryOnProductId,
        logTryOn,

        // Orders
        orders,
        createOrder,
        updateOrderStatus,

        // Seller
        sellerAnalytics,
        structuredInsights,
        refreshSellerInsights,
        aiInsights,
        refreshAiInsights,

        // Toast
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
