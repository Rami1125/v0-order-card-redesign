import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; // חיבור לפיירבייס שלנו
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

  // משיכת כל ה-PDF מהתיקייה הספציפית שנתת (1FX8kT8iwqXPIP9hZv4m3Jz1YBfIJfnJP)
  const res = await drive.files.list({
    q: `'1FX8kT8iwqXPIP9hZv4m3Jz1YBfIJfnJP' in parents and mimeType = 'application/pdf'`,
    fields: 'files(id, name)',
  });

  // דחיפת התוצאות ל-Firestore כדי שנוכל להציג אותם מהר ב-Frontend
  const files = res.data.files || [];
  for (const file of files) {
    await setDoc(doc(collection(db, "invoices"), file.id), {
      name: file.name,
      driveId: file.id,
      updatedAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ message: `סונכרנו ${files.length} קבצים בהצלחה!` });
}
