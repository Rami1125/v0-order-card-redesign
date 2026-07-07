import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase, ref, push, set } from "firebase/database";

// הקונפיגורציה החדשה והמעודכנת של ח.סבן לוגיסטיקה
const firebaseConfig = {
  apiKey: "AIzaSyAg1mkCCOs1A7inc4HfPmTND2t26zbgf9A",
  authDomain: "whatsapp-8ffd1.firebaseapp.com",
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whatsapp-8ffd1",
  storageBucket: "whatsapp-8ffd1.firebasestorage.app",
  messagingSenderId: "248003330797",
  appId: "1:248003330797:web:db93f4c5b223bfa647c2e4",
  measurementId: "G-D3DHQD4QRD"
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// מניעת שגיאות אתחול כפול בזמן הפיתוח והבנייה ב-Vercel
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// התחברות חלקה ל-Firestore הדיפולטיבי (default) בפרויקט החדש
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => auth.signOut();

/**
 * אוטומציית וואטסאפ: הזרקת הודעות סידור לתוך ה-Realtime DB
 */
export const sendJoniMessage = async (phoneNumber: string, text: string, mediaType: string = "text", mediaUrl?: string) => {
  const sanitizedPhone = phoneNumber ? phoneNumber.replace(/[^\d+]/g, "") : "";
  const payload = {
    phoneNumber: sanitizedPhone,
    text,
    mediaType,
    mediaUrl: mediaUrl || null,
    timestamp: new Date().toISOString(),
    source: "Saban AI Drive PWA",
    status: "pending_joni"
  };

  const results = { rtdb: false, error: null as any };

  try {
    const outboxRef = ref(rtdb, "joni_outbox");
    const newMsgRef = push(outboxRef);
    await set(newMsgRef, payload);
    results.rtdb = true;
    console.log("🔥 Message pushed to outbox successfully:", newMsgRef.key);
  } catch (error: any) {
    console.error("❌ JONI RTDB Push Failed:", error);
    results.error = error;
  }

  return results;
};
