import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  getDocs,
  query,
  collection,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
/* CRITICAL: The app will break without specifying firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore as required by system constraints
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection test: client is currently offline.');
    }
    return false;
  }
}
testConnection();

// Sign In with Google popup
export async function signInWithGoogle(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;
    // Sync user profile to Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        userId: user.uid,
        displayName: user.displayName || 'Commander',
        email: user.email || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return user;
  } catch (err) {
    console.error('Sign-in error:', err);
    throw err;
  }
}

// Sign Out
export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Save Battle Record to Firestore
export async function saveSimulationRecord(record: {
  id: string;
  score: number;
  intercepts: number;
  cityIntegrity: number;
  enemyIntegrity: number;
  weatherCondition: 'ClearSkies' | 'RainShower' | 'HeavyThunderstorm';
  victory: boolean;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `simulation_records/${record.id}`;
  try {
    const recordRef = doc(db, 'simulation_records', record.id);
    await setDoc(recordRef, {
      id: record.id,
      userId: user.uid,
      userName: user.displayName || 'Commander',
      score: record.score,
      intercepts: record.intercepts,
      cityIntegrity: Math.round(record.cityIntegrity),
      enemyIntegrity: Math.round(record.enemyIntegrity),
      weatherCondition: record.weatherCondition,
      victory: record.victory,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Save Tactical Config to Firestore
export async function saveTacticalConfig(config: {
  autoDefense: boolean;
  preferredWeather: 'ClearSkies' | 'RainShower' | 'HeavyThunderstorm';
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `tactical_configs/${user.uid}`;
  try {
    const configRef = doc(db, 'tactical_configs', user.uid);
    await setDoc(configRef, {
      userId: user.uid,
      autoDefense: config.autoDefense,
      preferredWeather: config.preferredWeather,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export type { User };
