import * as admin from 'firebase-admin';

// הוספנו את השם המלא של המשתנה project_id כפי שהוא מופיע ב-JSON שלך
const projectId = process.env.FIREBASE_PROJECT_ID || "thematic-ruler-501808-m1";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = admin.firestore();
