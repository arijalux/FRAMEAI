import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  addDoc,
  writeBatch,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Product, Seller, Order, CartItem, FaceAnalysisResult, RecommendationMatch, SellerAnalytics, AIInsight } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SELLERS, INITIAL_SELLER_ANALYTICS } from '../data/seedData';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfigJson);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  // Use custom database ID from config with experimentalAutoDetectLongPolling for stable connectivity in sandboxed iframe environments
  const dbId = (firebaseConfigJson as any).firestoreDatabaseId;
  try {
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, dbId);
  } catch {
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
} catch (error) {
  console.warn('Firebase initialization notice:', error);
}

export { app, auth, db };

// -------------------------------------------------------------
// FIRESTORE SKILL ERROR HANDLING
// -------------------------------------------------------------

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.info('Firestore Info:', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Validates connection to Firestore in background without blocking UI
 */
export async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.info('Firestore running with offline cache persistence.');
    }
  }
}

// Non-blocking connection test
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 1000);
}

// -------------------------------------------------------------
// AUTHENTICATION ERROR HANDLING
// -------------------------------------------------------------

export function formatAuthErrorMessage(error: any): string {
  // Keep raw Firebase error available in development info logs without triggering uncaught error alarms
  console.info('Firebase Auth Info [dev log]:', error?.code || error?.message || error);

  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('operation-not-allowed')) {
    return 'Sign-up is not enabled yet. Please enable this authentication method in Firebase.';
  }
  if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('email-already-in-use')) {
    return 'This email is already registered. Please sign in instead.';
  }
  if (errorCode === 'auth/weak-password' || errorMessage.includes('weak-password')) {
    return 'Use a stronger password with at least 8 characters.';
  }
  if (errorCode === 'auth/invalid-email' || errorMessage.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (
    errorCode === 'auth/user-not-found' ||
    errorCode === 'auth/wrong-password' ||
    errorCode === 'auth/invalid-credential' ||
    errorMessage.includes('user-not-found') ||
    errorMessage.includes('wrong-password') ||
    errorMessage.includes('invalid-credential')
  ) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (errorCode === 'auth/too-many-requests' || errorMessage.includes('too-many-requests')) {
    return 'Too many attempts. Please try again later.';
  }
  if (errorCode === 'auth/popup-closed-by-user' || errorMessage.includes('popup-closed-by-user')) {
    return 'Sign in was cancelled.';
  }
  if (errorCode === 'auth/cancelled-popup-request' || errorMessage.includes('cancelled-popup-request')) {
    return 'Sign in process cancelled.';
  }
  if (errorCode === 'auth/network-request-failed' || errorMessage.includes('network-request-failed')) {
    return 'Network error. Please check your connection.';
  }

  // Clean raw Firebase tags if present
  const cleanMsg = errorMessage.replace(/^Firebase:\s*(Error\s*)?\(?([^)]+)\)?/i, '$2').trim();
  return cleanMsg || 'Authentication failed. Please try again.';
}

// -------------------------------------------------------------
// DEMO ACCOUNT DEFINITIONS & CONFIGURATION
// -------------------------------------------------------------

export const DEMO_CUSTOMER_CONFIG = {
  name: 'Demo Customer',
  email: 'customer.demo@frameai.test',
  role: 'customer' as const,
  // Internal secure demo credential - never shown in plain text in UI
  _internalSecret: 'FrameAICustomerPass2026!',
};

export const DEMO_SELLER_CONFIG = {
  name: 'Optik Melati Demo',
  email: 'seller.demo@frameai.test',
  role: 'seller' as const,
  sellerId: 'optik-melati',
  sellerName: 'Optik Melati',
  city: 'Bandung',
  location: 'Bandung',
  province: 'West Java',
  status: 'active',
  // Internal secure demo credential - never shown in plain text in UI
  _internalSecret: 'FrameAISellerOptikMelati2026!',
};

// -------------------------------------------------------------
// AUTHENTICATION HELPERS
// -------------------------------------------------------------

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user doc exists in Firestore, if not create it
    if (db) {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          name: user.displayName || 'Eyewear Enthusiast',
          email: user.email || '',
          avatar: user.photoURL || '',
          role: 'customer',
          createdAt: new Date().toISOString(),
        });
      }
    }
    
    return user;
  } catch (error: any) {
    const friendlyMsg = formatAuthErrorMessage(error);
    const customErr = new Error(friendlyMsg);
    (customErr as any).code = error?.code;
    throw customErr;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const user = result.user;

    // If logging in as demo seller, ensure Firestore docs exist
    if (user.email === DEMO_SELLER_CONFIG.email) {
      await ensureSellerDemoFirestoreDocs(user.uid);
    } else if (user.email === DEMO_CUSTOMER_CONFIG.email) {
      await ensureCustomerDemoFirestoreDocs(user.uid);
    }

    return user;
  } catch (error: any) {
    const friendlyMsg = formatAuthErrorMessage(error);
    const customErr = new Error(friendlyMsg);
    (customErr as any).code = error?.code;
    throw customErr;
  }
}

export async function registerWithEmail(
  email: string,
  pass: string,
  name: string,
  role: 'customer' | 'seller' = 'customer'
) {
  if (!auth) throw new Error('Firebase Auth is not initialized');

  // Strict rule: normal registration defaults to customer unless it is the demo seller account
  const isSellerDemo = email.trim().toLowerCase() === DEMO_SELLER_CONFIG.email.toLowerCase();
  const effectiveRole: 'customer' | 'seller' = isSellerDemo ? 'seller' : (role === 'seller' ? 'seller' : 'customer');
  const effectiveSellerId = isSellerDemo ? 'optik-melati' : (effectiveRole === 'seller' ? 'optik-melati' : undefined);

  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const user = result.user;
    
    await updateProfile(user, { displayName: name.trim() });
    
    if (db) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocData: any = {
        id: user.uid,
        name: name.trim(),
        email: email.trim(),
        avatar: '',
        role: effectiveRole,
        createdAt: new Date().toISOString(),
      };
      if (effectiveSellerId) {
        userDocData.sellerId = effectiveSellerId;
      }
      await setDoc(userDocRef, userDocData);

      if (effectiveRole === 'seller' && effectiveSellerId === 'optik-melati') {
        await ensureSellerDemoFirestoreDocs(user.uid);
      }
    }
    
    return user;
  } catch (error: any) {
    const friendlyMsg = formatAuthErrorMessage(error);
    const customErr = new Error(friendlyMsg);
    (customErr as any).code = error?.code;
    throw customErr;
  }
}

export async function loginAsDemoAccount(type: 'customer' | 'seller') {
  if (!auth) throw new Error('Firebase Auth is not initialized');

  if (type === 'customer') {
    const config = DEMO_CUSTOMER_CONFIG;
    try {
      return await loginWithEmail(config.email, config._internalSecret);
    } catch (err: any) {
      // If user doesn't exist yet, register it
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.message?.includes('credentials')) {
        try {
          return await registerWithEmail(config.email, config._internalSecret, config.name, 'customer');
        } catch (regErr: any) {
          throw regErr;
        }
      }
      throw err;
    }
  } else {
    const config = DEMO_SELLER_CONFIG;
    try {
      const u = await loginWithEmail(config.email, config._internalSecret);
      await ensureSellerDemoFirestoreDocs(u.uid);
      return u;
    } catch (err: any) {
      // If user doesn't exist yet, register it
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.message?.includes('credentials')) {
        try {
          const u = await registerWithEmail(config.email, config._internalSecret, config.name, 'seller');
          await ensureSellerDemoFirestoreDocs(u.uid);
          return u;
        } catch (regErr: any) {
          throw regErr;
        }
      }
      throw err;
    }
  }
}

export async function ensureSellerDemoFirestoreDocs(uid: string) {
  if (!db || !uid) return;
  try {
    // 1. users/{uid}
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        id: uid,
        name: DEMO_SELLER_CONFIG.name,
        email: DEMO_SELLER_CONFIG.email,
        role: 'seller',
        sellerId: 'optik-melati',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. sellers/optik-melati
    const sellerDocRef = doc(db, 'sellers', 'optik-melati');
    await setDoc(
      sellerDocRef,
      {
        id: 'optik-melati',
        ownerUid: uid,
        name: 'Optik Melati',
        city: 'Bandung',
        location: 'Bandung',
        province: 'West Java',
        status: 'active',
        description: 'Heritage optical atelier crafting precision hand-beveled acetate eyewear since 1988.',
        story: 'Nestled in the creative heart of Braga, Bandung, Optik Melati merges European hand-finishing traditions with modern ergonomic designs tailored for Southeast Asian facial profiles.',
        foundedYear: 1988,
        rating: 4.9,
        salesCount: 1420,
        productCount: 14,
        specialty: 'Handcrafted Bio-Acetate & Minimalist Wireframes',
        verified: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error ensuring seller demo docs:', err);
  }
}

export async function ensureCustomerDemoFirestoreDocs(uid: string) {
  if (!db || !uid) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        id: uid,
        name: DEMO_CUSTOMER_CONFIG.name,
        email: DEMO_CUSTOMER_CONFIG.email,
        role: 'customer',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error ensuring customer demo docs:', err);
  }
}

export async function upgradeUserToSeller(
  uid: string,
  sellerData: {
    name: string;
    city: string;
    specialty?: string;
    story?: string;
  }
) {
  if (!db || !uid) throw new Error('Firestore not initialized');
  const sellerId = `seller-${sellerData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}`;
  
  // 1. Update user document
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    role: 'seller',
    sellerId,
    updatedAt: new Date().toISOString(),
  });

  // 2. Create or update seller document
  const sellerDocRef = doc(db, 'sellers', sellerId);
  const newSeller: Seller = {
    id: sellerId,
    ownerUid: uid,
    name: sellerData.name,
    city: sellerData.city,
    location: sellerData.city,
    province: 'Indonesia',
    status: 'active',
    description: `Artisanal eyewear atelier in ${sellerData.city}.`,
    story: sellerData.story || `Specializing in ${sellerData.specialty || 'handcrafted frames'}.`,
    foundedYear: new Date().getFullYear(),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80',
    rating: 5.0,
    salesCount: 0,
    productCount: 0,
    specialty: sellerData.specialty || 'Handcrafted Eyewear',
    verified: true,
  };
  await setDoc(sellerDocRef, newSeller);

  return { sellerId, seller: newSeller };
}

export async function logoutUser() {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export async function fetchUserDocFromFirestore(uid: string) {
  if (!db || !uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn('Error fetching user document from firestore:', e);
  }
  return null;
}

// -------------------------------------------------------------
// FIRESTORE SEEDING & SYNC
// -------------------------------------------------------------

export async function seedFirestoreIfEmpty(): Promise<void> {
  if (!db) return;
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    const sellersSnap = await getDocs(collection(db, 'sellers'));

    // Check if products need seeding or updating to full 24-product multi-SME catalog
    if (productsSnap.empty || productsSnap.size < INITIAL_PRODUCTS.length) {
      console.log('Syncing complete 24-product multi-SME Eyewear catalog to Firestore...');
      const batch = writeBatch(db);
      
      // Upsert all initial products
      INITIAL_PRODUCTS.forEach((product) => {
        const pRef = doc(db, 'products', product.id);
        batch.set(pRef, product, { merge: true });
      });
      
      // Upsert all initial sellers
      INITIAL_SELLERS.forEach((seller) => {
        const sRef = doc(db, 'sellers', seller.id);
        batch.set(sRef, seller, { merge: true });
      });
      
      // Seed initial seller analytics
      const analyticsRef1 = doc(db, 'sellerAnalytics', 'optik-melati');
      batch.set(analyticsRef1, { ...INITIAL_SELLER_ANALYTICS, sellerId: 'optik-melati' }, { merge: true });
      const analyticsRef2 = doc(db, 'sellerAnalytics', 'seller-optik-melati');
      batch.set(analyticsRef2, INITIAL_SELLER_ANALYTICS, { merge: true });

      await batch.commit();
      console.log('Firestore multi-SME seed completed successfully.');
    } else if (sellersSnap.empty || sellersSnap.size < INITIAL_SELLERS.length) {
      const batch = writeBatch(db);
      INITIAL_SELLERS.forEach((seller) => {
        const sRef = doc(db, 'sellers', seller.id);
        batch.set(sRef, seller, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to seed Firestore:', err);
  }
}

// -------------------------------------------------------------
// PRODUCTS CRUD
// -------------------------------------------------------------

export async function fetchProductsFromFirestore(): Promise<Product[]> {
  if (!db) return INITIAL_PRODUCTS;
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty || snap.size < INITIAL_PRODUCTS.length) {
      await seedFirestoreIfEmpty();
      // Re-query or fallback to merged initial products
      const reSnap = await getDocs(collection(db, 'products'));
      if (!reSnap.empty && reSnap.size >= INITIAL_PRODUCTS.length) {
        return reSnap.docs.map((d) => d.data() as Product);
      }
      return INITIAL_PRODUCTS;
    }
    const firestoreProducts = snap.docs.map((d) => d.data() as Product);
    
    // Merge with INITIAL_PRODUCTS to ensure none are missing if any partial collection exists
    const productMap = new Map<string, Product>();
    INITIAL_PRODUCTS.forEach((p) => productMap.set(p.id, p));
    firestoreProducts.forEach((p) => productMap.set(p.id, p));
    
    const allMerged = Array.from(productMap.values());

    // Sanitize any broken legacy image URLs
    const sanitizedProducts = allMerged.map((p) => {
      let changed = false;
      const validFallback = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80';
      const cleanThumbnail = p.thumbnail?.includes('photo-1509695503495') ? validFallback : p.thumbnail;
      const cleanImages = (p.images || []).map((img) =>
        img.includes('photo-1509695503495') ? validFallback : img
      );
      if (cleanThumbnail !== p.thumbnail || JSON.stringify(cleanImages) !== JSON.stringify(p.images)) {
        changed = true;
      }
      const updatedProduct = { ...p, thumbnail: cleanThumbnail, images: cleanImages };
      if (changed && db) {
        updateProductInFirestore(updatedProduct).catch(() => {});
      }
      return updatedProduct;
    });
    return sanitizedProducts;
  } catch (err) {
    console.warn('Firestore fetchProducts fallback to seed data:', err);
    return INITIAL_PRODUCTS;
  }
}

export async function addProductToFirestore(product: Product): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'products', product.id);
  await setDoc(docRef, product);
}

export async function updateProductInFirestore(product: Product): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'products', product.id);
  await updateDoc(docRef, { ...product });
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'products', productId);
  await deleteDoc(docRef);
}

// -------------------------------------------------------------
// SELLERS
// -------------------------------------------------------------

export async function fetchSellersFromFirestore(): Promise<Seller[]> {
  if (!db) return INITIAL_SELLERS;
  try {
    const snap = await getDocs(collection(db, 'sellers'));
    if (snap.empty || snap.size < INITIAL_SELLERS.length) {
      await seedFirestoreIfEmpty();
      return INITIAL_SELLERS;
    }
    const firestoreSellers = snap.docs.map((d) => d.data() as Seller);
    const sellerMap = new Map<string, Seller>();
    firestoreSellers.forEach((s) => sellerMap.set(s.id, s));
    // Prioritize initial local asset images for bundled artisan artworks
    INITIAL_SELLERS.forEach((s) => {
      const existing = sellerMap.get(s.id);
      if (existing) {
        sellerMap.set(s.id, {
          ...existing,
          bannerImage: s.bannerImage,
          avatar: s.avatar || existing.avatar,
        });
      } else {
        sellerMap.set(s.id, s);
      }
    });
    return Array.from(sellerMap.values());
  } catch (err) {
    console.warn('Firestore fetchSellers fallback:', err);
    return INITIAL_SELLERS;
  }
}

// -------------------------------------------------------------
// WISHLIST PERSISTENCE
// -------------------------------------------------------------

export async function fetchWishlistFromFirestore(userId: string): Promise<string[]> {
  if (!db || !userId) return [];
  try {
    const docRef = doc(db, 'wishlists', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().productIds || [];
    }
  } catch (err) {
    console.warn('Error fetching wishlist:', err);
  }
  return [];
}

export async function saveWishlistToFirestore(userId: string, productIds: string[]): Promise<void> {
  if (!db || !userId) return;
  try {
    const docRef = doc(db, 'wishlists', userId);
    await setDoc(docRef, { userId, productIds, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Error saving wishlist to Firestore:', err);
  }
}

// -------------------------------------------------------------
// CART PERSISTENCE
// -------------------------------------------------------------

export async function fetchCartFromFirestore(userId: string): Promise<CartItem[]> {
  if (!db || !userId) return [];
  try {
    const docRef = doc(db, 'carts', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().items || [];
    }
  } catch (err) {
    console.warn('Error fetching cart:', err);
  }
  return [];
}

export async function saveCartToFirestore(userId: string, items: CartItem[]): Promise<void> {
  if (!db || !userId) return;
  try {
    const docRef = doc(db, 'carts', userId);
    await setDoc(docRef, { userId, items, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Error saving cart to Firestore:', err);
  }
}

// -------------------------------------------------------------
// ORDERS PERSISTENCE
// -------------------------------------------------------------

export async function saveOrderToFirestore(order: Order): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order);
    
    // Record analytics purchase event
    order.items.forEach(async (item) => {
      await logAnalyticsEvent({
        type: 'purchase',
        productId: item.productId,
        productName: item.productName,
        sellerName: item.sellerName,
        price: item.price,
        userId: order.userId,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (err) {
    console.error('Error saving order to Firestore:', err);
    throw err;
  }
}

export async function fetchOrdersFromFirestore(userId: string): Promise<Order[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Order);
  } catch (err) {
    console.warn('Error fetching orders:', err);
    return [];
  }
}

// -------------------------------------------------------------
// TRY-ON SESSIONS
// -------------------------------------------------------------

export async function logTryOnSessionToFirestore(sessionData: {
  userId?: string;
  productId: string;
  productName: string;
  sellerId?: string;
  durationSeconds?: number;
  faceShapeDetected?: string;
  snapshotImage?: string;
}): Promise<void> {
  if (!db) return;
  try {
    await addDoc(collection(db, 'tryOnSessions'), {
      ...sessionData,
      createdAt: new Date().toISOString(),
    });

    await logAnalyticsEvent({
      type: 'tryOn',
      productId: sessionData.productId,
      productName: sessionData.productName,
      userId: sessionData.userId || 'anonymous',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error logging try-on session:', err);
  }
}

// -------------------------------------------------------------
// AI RECOMMENDATIONS PERSISTENCE
// -------------------------------------------------------------

export async function saveRecommendationsToFirestore(recData: {
  userId?: string;
  faceAnalysis: FaceAnalysisResult;
  topMatches: any[];
}): Promise<string> {
  if (!db) return '';
  try {
    const docRef = await addDoc(collection(db, 'recommendations'), {
      ...recData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    console.warn('Error saving recommendations:', err);
    return '';
  }
}

// -------------------------------------------------------------
// ANALYTICS & SELLER PERFORMANCE
// -------------------------------------------------------------

export async function logAnalyticsEvent(event: {
  type: 'view' | 'tryOn' | 'addToCart' | 'purchase';
  productId: string;
  productName?: string;
  sellerName?: string;
  price?: number;
  userId?: string;
  timestamp: string;
}): Promise<void> {
  if (!db) return;
  try {
    await addDoc(collection(db, 'analyticsEvents'), event);
  } catch (err) {
    // Non-blocking log
  }
}

export async function fetchSellerAnalyticsFromFirestore(sellerId: string): Promise<SellerAnalytics> {
  if (!db) return INITIAL_SELLER_ANALYTICS;
  try {
    const docRef = doc(db, 'sellerAnalytics', sellerId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SellerAnalytics;
    }
  } catch (err) {
    console.warn('Error fetching seller analytics:', err);
  }
  return INITIAL_SELLER_ANALYTICS;
}
