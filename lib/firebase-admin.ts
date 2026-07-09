import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID, // וודא שזה קיים ב-Vercel
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = admin.firestore();
