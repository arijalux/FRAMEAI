import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  collection,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

export { onAuthStateChanged };
export type { User };
import firebaseConfig from '../../firebase-applet-config.json';
import { OpticalFrame, Order, TryOnLook, UserProfile } from '../types';
import { INITIAL_FRAMES } from '../data/initialFrames';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot as mandated
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing connection.');
    }
  }
}
testConnection();

// Google Auth Helpers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Complete a redirect sign-in started by loginWithGoogle's fallback; errors surface on the next attempt
getRedirectResult(auth).catch((e) => console.warn('Google redirect sign-in failed:', e));

/**
 * Signs in with a Google popup. If the browser blocks popups, falls back to a full-page
 * redirect (the page reloads and onAuthStateChanged picks up the user).
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

/** Turns Firebase Auth errors into a message for the user, or null if they simply cancelled */
export function describeAuthError(error: unknown): string | null {
  const code = (error as { code?: string }).code;
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return null;
    case 'auth/unauthorized-domain':
      return `Domain ${window.location.hostname} belum diizinkan untuk login. Admin perlu menambahkannya di Firebase Console → Authentication → Settings → Authorized domains.`;
    case 'auth/operation-not-allowed':
      return 'Login Google belum diaktifkan. Admin perlu mengaktifkannya di Firebase Console → Authentication → Sign-in method.';
    case 'auth/network-request-failed':
      return 'Koneksi bermasalah. Periksa internet Anda lalu coba lagi.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
    default:
      return 'Login gagal. Silakan coba lagi.';
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Keep in sync with isAdmin() in firestore.rules. This only decides what UI to show;
// the rules are what actually protect admin data.
const ADMIN_EMAIL = 'arijalibnujati@gmail.com';

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (user.email === ADMIN_EMAIL) return true;
  try {
    const snap = await getDocFromServer(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

// Optical Frames Store Services
export async function fetchCatalogFrames(): Promise<OpticalFrame[]> {
  try {
    const snap = await getDocs(collection(db, 'frames'));
    // Firestore holds admin edits and additions; overlay them on the built-in catalog by id
    const byId = new Map(INITIAL_FRAMES.map((f) => [f.id, f]));
    snap.forEach((d) => {
      const frame = d.data() as OpticalFrame;
      byId.set(frame.id, frame);
    });
    return [...byId.values()];
  } catch {
    // Graceful offline fallback
    return INITIAL_FRAMES;
  }
}

export async function saveFrameToDb(frame: OpticalFrame): Promise<void> {
  const path = `frames/${frame.id}`;
  try {
    await setDoc(doc(db, 'frames', frame.id), frame);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveTryOnLookToFirestore(look: Omit<TryOnLook, 'id'>): Promise<string> {
  const path = 'tryOnLooks';
  const guestId = localStorage.getItem('frameai_guest_id') || 'guest-' + Math.random().toString(36).substring(2, 9);
  localStorage.setItem('frameai_guest_id', guestId);
  const uid = auth.currentUser?.uid;
  const effectiveUserId = uid || guestId;

  const newLook: TryOnLook = {
    ...look,
    id: 'look-' + Date.now(),
    userId: effectiveUserId,
    createdAt: new Date().toISOString(),
  };

  // Cache locally
  try {
    const existing = JSON.parse(localStorage.getItem('frameai_saved_looks') || '[]');
    localStorage.setItem('frameai_saved_looks', JSON.stringify([newLook, ...existing]));
  } catch (e) {
    console.warn(e);
  }

  // Guests are local-only: Firestore rules only accept looks owned by a signed-in user
  if (!uid) return newLook.id;

  try {
    const docRef = await addDoc(collection(db, path), {
      ...look,
      userId: effectiveUserId,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.warn('Firestore write fallback to local storage:', error);
    return newLook.id;
  }
}

export async function fetchUserTryOnLooks(): Promise<TryOnLook[]> {
  const local = JSON.parse(localStorage.getItem('frameai_saved_looks') || '[]');
  const uid = auth.currentUser?.uid;
  const path = 'tryOnLooks';

  if (!uid) return local;

  try {
    const snap = await getDocs(query(collection(db, path), where('userId', '==', uid)));
    const looks: TryOnLook[] = [];
    snap.forEach((d) => looks.push({ id: d.id, ...d.data() } as TryOnLook));
    return looks.length > 0 ? looks : local;
  } catch {
    return local;
  }
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  const path = `users/${uid}`;
  try {
    // Firestore rejects undefined values (e.g. an empty PD), so drop them
    const data = Object.fromEntries(
      Object.entries({ ...profile, updatedAt: new Date().toISOString() }).filter(([, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'users', uid), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/** Orders placed by the signed-in user, newest first */
export async function fetchMyOrders(uid: string): Promise<Order[]> {
  const path = 'orders';
  try {
    const snap = await getDocs(query(collection(db, path), where('userId', '==', uid)));
    const orders: Order[] = [];
    snap.forEach((d) => orders.push({ id: d.id, ...d.data() } as Order));
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createCustomerOrder(orderData: Omit<Order, 'id'>): Promise<string> {
  const path = 'orders';
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Login diperlukan untuk membuat pesanan.');
  try {
    const docRef = await addDoc(collection(db, path), {
      ...orderData,
      userId: uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchAllOrders(): Promise<Order[]> {
  const path = 'orders';
  try {
    const snap = await getDocs(collection(db, path));
    const orders: Order[] = [];
    snap.forEach((d) => orders.push({ id: d.id, ...d.data() } as Order));
    return orders;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateOrderStatusInDb(orderId: string, status: Order['status']): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
