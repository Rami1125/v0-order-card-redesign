import React, { useState, useRef } from 'react';
// יש לעדכן את הנתיב לקובץ הקונפיגורציה של Firebase בפרויקט שלך
import { storage, db } from '../firebase/config'; 
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

export default function DocumentScanner({ deliveryNumber, driverName = "חכמת" }) {
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const canvasRef = useRef(null);

  // פתיחת מצלמה ולכידת התמונה
  const handleCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImage(img);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // כיווץ ועיבוד התמונה לתצורה שמתאימה למסמך
  const processImage = (img) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // הגבלת רוחב כדי למנוע קבצים כבדים מדי
    const MAX_WIDTH = 1200;
    const scale = MAX_WIDTH / img.width;
    canvas.width = MAX_WIDTH;
    canvas.height = img.height * scale;

    // ציור מחדש על הקנבס
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // המרה ל-Base64 בפורמט JPEG עם איכות 70%
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setImage(dataUrl);
  };

  // העלאה ישירה ל-SabanOS
  const uploadToSabanOS = async () => {
    if (!image) return;
    setIsUploading(true);
    setMessage('');
    
    try {
      // יצירת שם ייחודי לקובץ
      const fileName = `delivery_notes/scan_${deliveryNumber}_${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      // העלאה ל-Storage
      await uploadString(storageRef, image, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);
      
      // שמירת הרשומה ב-Firestore
      await addDoc(collection(db, 'scans'), {
        deliveryNumber: deliveryNumber,
        driverName: driverName,
        fileUrl: downloadURL,
        timestamp: new Date()
      });
      
      setMessage('התעודה נסרקה ועלתה ל-SabanOS בהצלחה!');
      setImage(null);
    } catch (error) {
      console.error('Upload Error:', error);
      setMessage('שגיאה בהעלאה, נסה שוב.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>סורק תעודות - משאית</h2>
      
      {/* Input נסתר שפותח את המצלמה האחורית בנייד */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        onChange={handleCapture}
        style={{ display: 'none' }}
        id="cameraInput"
      />
      
      {!image ? (
        <label htmlFor="cameraInput" style={btnPrimaryStyle}>
          📷 פתח מצלמה לסריקה
        </label>
      ) : (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <img src={image} alt="Scanned Document" style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px' }} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button onClick={uploadToSabanOS} disabled={isUploading} style={btnSuccessStyle}>
              {isUploading ? 'מעלה...' : '📤 שלח מערכת'}
            </button>
            <button onClick={() => setImage(null)} disabled={isUploading} style={btnDangerStyle}>
              🗑️ סרוק מחדש
            </button>
          </div>
        </div>
      )}
      
      {message && <p style={{ marginTop: '15px', fontWeight: 'bold', textAlign: 'center' }}>{message}</p>}
      
      {/* Canvas נסתר לעיבוד התמונה */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

// סטיילים לכפתורים
const baseBtn = {
  display: 'block', width: '100%', padding: '15px', color: '#fff', 
  textAlign: 'center', borderRadius: '8px', cursor: 'pointer', border: 'none', fontSize: '16px', fontWeight: 'bold'
};
const btnPrimaryStyle = { ...baseBtn, backgroundColor: '#0070f3' };
const btnSuccessStyle = { ...baseBtn, backgroundColor: '#28a745' };
const btnDangerStyle = { ...baseBtn, backgroundColor: '#dc3545' };
