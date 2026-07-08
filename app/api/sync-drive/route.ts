import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/lib/firebase'; 
import { collection, doc, setDoc } from 'firebase/firestore';

export async function POST() {
  console.log("SYNC_START: Starting sync...");
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });
    
    // בדיקה: האם התיקייה קיימת והרובוט רואה אותה?
    const res = await drive.files.list({
      q: `'1FX8kT8iwqXPIP9hZv4m3Jz1YBfIJfnJP' in parents and mimeType = 'application/pdf'`,
      fields: 'files(id, name)',
    });

    console.log("SYNC_FOUND_FILES:", res.data.files); // תראה את זה ב-Logs של Vercel

    const files = res.data.files || [];
    for (const file of files) {
      await setDoc(doc(collection(db, "invoices"), file.id), { 
        name: file.name, 
        driveId: file.id,
        createdAt: new Date().toISOString()
      });
    }
    return NextResponse.json({ success: true, count: files.length });
  } catch (error) {
    console.error("SYNC_ERROR:", error); // השגיאה האמיתית תופיע כאן
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
