import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Dynamic Firebase configuration using environment variables (.env / Render)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    (firebaseAppletConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
    '(default)',
};

// Initialize Firebase App singleton
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(
  firebaseApp,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Enable offline cache persistence where supported
try {
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence: Multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence: Browser does not support indexedDB.');
      }
    });
  }
} catch (e) {
  // Ignore in SSR or unsupported environments
}

export const auth = getAuth(firebaseApp);

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Status: ', JSON.stringify(errInfo));
}

/**
 * IMPÉRATIF : Élimine récursivement toutes les valeurs 'undefined'
 * pour garantir des écritures Firestore strictes et conformes.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized as T;
  }

  return data;
}

/**
 * Safe Firestore Promise wrapper with guaranteed bounded timeout.
 * Prevents UI modals from hanging indefinitely on pending network calls.
 */
export async function safeFirestoreWrite<T>(
  operation: Promise<T>,
  timeoutMs = 1500
): Promise<T | void> {
  try {
    const result = await Promise.race([
      operation,
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
    return result;
  } catch (error) {
    console.warn('Firestore write warning (handled gracefully):', error);
  }
}

/**
 * Test initial server connection as required by Firestore integration rules with timeout
 */
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 800)),
    ]);
    return true;
  } catch (error) {
    return false;
  }
}

// Collection Names
export const COLLECTIONS = {
  AGENTS: 'agents',
  STUDENTS: 'students',
  PAYMENTS: 'payments',
  EXAMS: 'exams',
  INVENTORY: 'inventory',
  SUPPLY_SALES: 'supplySales',
  OPERATIONS: 'operations',
  ALERTS: 'alerts',
  SETTINGS: 'settings',
} as const;

export { doc, setDoc, getDocs, onSnapshot, deleteDoc, collection };
