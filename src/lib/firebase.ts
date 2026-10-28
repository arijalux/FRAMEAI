import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
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
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

export { onAuthStateChanged };
export type { User };
import firebaseConfig from '../../firebase-applet-config.json';
import { OpticalFrame, Order, TryOnLook } from '../types';
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

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Optical Frames Store Services
export async function fetchCatalogFrames(): Promise<OpticalFrame[]> {
  try {
    const snap = await getDocs(collection(db, 'frames'));
    if (snap.empty) {
      // Seed initial collection if empty
      return INITIAL_FRAMES;
    }
    const frames: OpticalFrame[] = [];
    snap.forEach((d) => frames.push(d.data() as OpticalFrame));
    return frames;
  } catch {
    // Graceful offline fallback
    return INITIAL_FRAMES;
  }
}

export async function saveTryOnLookToFirestore(look: Omit<TryOnLook, 'id'>): Promise<string> {
  const path = 'tryOnLooks';
  const guestId = 'guest-' + (localStorage.getItem('frameai_guest_id') || Math.random().toString(36).substring(2, 9));
  localStorage.setItem('frameai_guest_id', guestId);
  const effectiveUserId = auth.currentUser?.uid || guestId;

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

  try {
    const q = uid ? query(collection(db, path), where('userId', '==', uid)) : query(collection(db, path));
    const snap = await getDocs(q);
    const looks: TryOnLook[] = [];
    snap.forEach((d) => looks.push({ id: d.id, ...d.data() } as TryOnLook));
    return looks.length > 0 ? looks : local;
  } catch {
    return local;
  }
}

export async function createCustomerOrder(orderData: Omit<Order, 'id'>): Promise<string> {
  const path = 'orders';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...orderData,
      userId: auth.currentUser?.uid || 'guest-checkout',
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
