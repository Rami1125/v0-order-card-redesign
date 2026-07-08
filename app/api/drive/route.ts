import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
  }

  try {
    // השתמש במפתח API של גוגל כדי לגשת לקבצים פומביים, או ב-Service Account לקבצים סגורים
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; 
    
    // קריאה ישירה להורדת הקובץ מ-Google Drive API
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`Google Drive API responded with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // מחזירים את הקובץ ישירות לדפדפן של הלקוח בצורה חלקה
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${fileId}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Drive Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch PDF from Drive' }, { status: 500 });
  }
}
