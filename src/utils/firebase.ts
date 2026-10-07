import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore, doc, getDoc, getDocFromServer, collection,
  writeBatch, onSnapshot, setDoc
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { AppState, Closing, Ingredient, CustomerDebt, CashTransaction } from '../types';

export const firebaseConfig = {
  projectId: firebaseConfigData.projectId,
  appId: firebaseConfigData.appId,
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID from config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test ping
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection to Firestore verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or Firestore not reachable.');
    } else {
      console.log('[Firebase] Connection test ping completed:', error);
    }
    return false;
  }
}

const SYNC_DOC_REF = doc(db, 'kedai_teras', 'sync_state');

/**
 * Pushes full application state to Firestore sync_state document and collections.
 * This ensures multi-device (AI Studio, Localhost, Mobile Tablet/HP) real-time consistency.
 */
export async function syncStateToFirestore(state: AppState, sourceAction: string = 'update'): Promise<void> {
  try {
    const payload = {
      users: state.users,
      absensi: state.absensi,
      menus: state.menus,
      ingredients: state.ingredients,
      recipes: state.recipes,
      expenseMaster: state.expenseMaster,
      closings: state.closings,
      kasbon: state.kasbon,
      payroll: state.payroll,
      cashTransactions: state.cashTransactions,
      monthlyReports: state.monthlyReports,
      customerDebts: state.customerDebts || [],
      lastUpdated: new Date().toISOString(),
      sourceAction,
    };

    // Save master real-time sync document
    await setDoc(SYNC_DOC_REF, payload, { merge: true });

    console.log(`[Firebase] State synced to Firestore (${sourceAction}) successfully.`);
  } catch (err: any) {
    console.warn('[Firebase] Error syncing state to Firestore:', err?.message || err);
  }
}

/**
 * Subscribes to real-time changes on the central sync_state document in Firestore.
 * When any client (AI Studio, Localhost, or mobile browser) modifies data,
 * all other clients receive the update immediately without refreshing.
 */
export function initFirestoreRealtimeSync(
  onCloudStateReceived: (cloudState: Partial<AppState>) => void,
  initialLocalState: AppState
): () => void {
  let isInitial = true;

  const unsubscribe = onSnapshot(
    SYNC_DOC_REF,
    async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data) {
          console.log('[Firebase] Received real-time update from Firestore, updated at:', data.lastUpdated);
          onCloudStateReceived({
            users: data.users,
            absensi: data.absensi,
            menus: data.menus,
            ingredients: data.ingredients,
            recipes: data.recipes,
            expenseMaster: data.expenseMaster,
            closings: data.closings,
            kasbon: data.kasbon,
            payroll: data.payroll,
            cashTransactions: data.cashTransactions,
            monthlyReports: data.monthlyReports,
            customerDebts: data.customerDebts || [],
          });
        }
      } else {
        // Document does not exist yet in Firestore (first time setup).
        // Prime the cloud database with the initial state!
        if (isInitial) {
          console.log('[Firebase] Initializing sync_state document in Firestore...');
          await syncStateToFirestore(initialLocalState, 'initial_bootstrap');
        }
      }
      isInitial = false;
    },
    (error) => {
      console.warn('[Firebase] Realtime sync listener warning:', error.message);
    }
  );

  return unsubscribe;
}

/**
 * Helper alias for syncStateToFirestore
 */
export async function pushStateToFirestore(state: AppState, sourceAction: string = 'manual_sync'): Promise<void> {
  return syncStateToFirestore(state, sourceAction);
}

export async function saveClosingToFirestore(closing: Closing): Promise<void> {
  try {
    const closingDocRef = doc(db, 'closings', closing.id);
    await setDoc(closingDocRef, closing, { merge: true });
    console.log('[Firebase] Closing individual doc saved:', closing.id);
  } catch (err: any) {
    console.warn('[Firebase] Warning saving closing doc:', err?.message || err);
  }
}

export async function updateIngredientsInFirestore(ingredients: Ingredient[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    ingredients.forEach(ing => {
      const ingDocRef = doc(db, 'ingredients', ing.id);
      batch.set(ingDocRef, ing, { merge: true });
    });
    await batch.commit();
    console.log('[Firebase] Ingredients batch updated successfully.');
  } catch (err: any) {
    console.warn('[Firebase] Warning updating ingredients:', err?.message || err);
  }
}

export function setupFirestoreListeners(
  onIngredients?: (ingredients: Ingredient[]) => void,
  onClosings?: (closings: Closing[]) => void
): () => void {
  // Optional granular listeners
  return () => {};
}
