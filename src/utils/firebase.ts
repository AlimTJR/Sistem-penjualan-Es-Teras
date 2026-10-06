import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, collection, getDocs, writeBatch, onSnapshot, setDoc } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { AppState, User, Ingredient, Menu, Recipe, Closing, Absensi, Kasbon, Payroll, CashTransaction } from '../types';

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

// Initialize Firestore with specific database ID if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test according to skill instructions
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

/**
 * Uploads local AppState to Firebase Firestore
 */
export async function pushStateToFirestore(state: AppState): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Sync users
    state.users.forEach(u => {
      const ref = doc(db, 'users', u.id);
      batch.set(ref, u, { merge: true });
    });

    // Sync ingredients
    state.ingredients.forEach(ing => {
      const ref = doc(db, 'ingredients', ing.id);
      batch.set(ref, ing, { merge: true });
    });

    // Sync menus
    state.menus.forEach(m => {
      const ref = doc(db, 'menus', m.id);
      batch.set(ref, m, { merge: true });
    });

    // Sync recipes
    state.recipes.forEach(r => {
      const ref = doc(db, 'recipes', r.id);
      batch.set(ref, r, { merge: true });
    });

    await batch.commit();
    console.log('[Firebase] Master state successfully pushed to Firestore.');
  } catch (err: any) {
    console.warn('[Firebase] Notice while syncing state to Firestore:', err?.message || err);
  }
}

/**
 * Saves a new closing record to Firestore
 */
export async function saveClosingToFirestore(closing: Closing): Promise<void> {
  try {
    const ref = doc(db, 'closings', closing.id);
    await setDoc(ref, closing);
  } catch (err) {
    console.error('[Firebase] Error saving closing to Firestore:', err);
  }
}

/**
 * Saves updated ingredients stock to Firestore
 */
export async function updateIngredientsInFirestore(ingredients: Ingredient[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    ingredients.forEach(i => {
      const ref = doc(db, 'ingredients', i.id);
      batch.set(ref, i, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('[Firebase] Error updating ingredients in Firestore:', err);
  }
}

/**
 * Listen to real-time changes on collections
 */
export function setupFirestoreListeners(
  onIngredientsUpdate: (ingredients: Ingredient[]) => void,
  onClosingsUpdate: (closings: Closing[]) => void
): () => void {
  const unsubIngredients = onSnapshot(collection(db, 'ingredients'), (snapshot) => {
    if (!snapshot.empty) {
      const list: Ingredient[] = [];
      snapshot.forEach(d => list.push(d.data() as Ingredient));
      onIngredientsUpdate(list);
    }
  }, (err) => {
    console.warn('[Firebase] Ingredients listener warning:', err.message);
  });

  const unsubClosings = onSnapshot(collection(db, 'closings'), (snapshot) => {
    if (!snapshot.empty) {
      const list: Closing[] = [];
      snapshot.forEach(d => list.push(d.data() as Closing));
      onClosingsUpdate(list);
    }
  }, (err) => {
    console.warn('[Firebase] Closings listener warning:', err.message);
  });

  return () => {
    unsubIngredients();
    unsubClosings();
  };
}
