import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/lib/firebase-admin'; // וודא שיש לך חיבור admin
import { collection, doc, setDoc } from 'firebase/firestore';

export async function POST() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });

  // סריקת התיקייה שלך
  const res = await drive.files.list({
    q: `'1FX8kT8iwqXPIP9hZv4m3Jz1YBfIJfnJP' in parents and mimeType = 'application/pdf'`,
    fields: 'files(id, name)',
  });

  const files = res.data.files || [];
  
  // דחיפה ל-Firebase
  for (const file of files) {
    if (file.id && file.name) {
      await setDoc(doc(collection(db, "invoices"), file.id), {
        name: file.name,
        driveId: file.id,
      });
    }
  }

  return NextResponse.json({ count: files.length });
}
