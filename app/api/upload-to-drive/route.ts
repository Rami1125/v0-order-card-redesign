import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { adminDb } from '@/lib/firebase-admin';
import { Readable } from 'stream';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'לא נמצא קובץ להעלאה' }, { status: 400 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = Readable.from(buffer);

    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: ['1FX8kT8iwqXPIP9hZv4m3Jz1YBfIJfnJP'], // תיקיית היעד
      },
      media: {
        mimeType: file.type || 'application/pdf',
        body: stream,
      },
      fields: 'id, name',
    });

    const driveId = driveResponse.data.id;

    if (!driveId) {
      throw new Error('כשל בקבלת מזהה קובץ מגוגל דרייב');
    }

    await adminDb.collection("invoices").doc(driveId).set({
      name: file.name,
      driveId: driveId,
      uploadedAt: new Date().toISOString(),
      status: "pending"
    });

    return NextResponse.json({ success: true, driveId });
  } catch (error: any) {
    console.error('CRITICAL ERROR UPLOADING TO DRIVE:', error);
    // עכשיו נחזיר את השגיאה המדויקת של גוגל לפרונטאנד כדי שנראה אותה בדפדפן
    return NextResponse.json({ 
      error: 'העלאה לדרייב נכשלה', 
      details: error.message || JSON.stringify(error) 
    }, { status: 500 });
  }
}
