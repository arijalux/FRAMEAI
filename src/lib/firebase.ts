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
import { CustomDesignRequest, CustomDesignStatus, OpticalFrame, Order, TryOnLook } from '../types';
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
    // Firestore holds admin edits and additions; overlay them on the built-in catalog by id.
    // Only BJ Homemade frames are sold, so frames saved from the old demo catalog stay hidden.
    const byId = new Map(INITIAL_FRAMES.map((f) => [f.id, f]));
    snap.forEach((d) => {
      const frame = d.data() as OpticalFrame;
      if (frame.brand === 'BJ Homemade') byId.set(frame.id, frame);
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

// Custom wooden frame designs. Guests can send one (with their contact details); only
// admins can read them, since they hold contact info and the cutting files.
export async function submitCustomDesign(
  design: Omit<CustomDesignRequest, 'id' | 'userId' | 'status' | 'createdAt'>
): Promise<string> {
  const path = 'customDesigns';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...design,
      userId: auth.currentUser?.uid || 'guest',
      status: 'new',
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchCustomDesigns(): Promise<CustomDesignRequest[]> {
  const path = 'customDesigns';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
    const designs: CustomDesignRequest[] = [];
    snap.forEach((d) => designs.push({ id: d.id, ...d.data() } as CustomDesignRequest));
    return designs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateCustomDesignStatus(designId: string, status: CustomDesignStatus): Promise<void> {
  const path = `customDesigns/${designId}`;
  try {
    await updateDoc(doc(db, 'customDesigns', designId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
