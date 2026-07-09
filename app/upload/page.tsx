import { ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase"; // וודא שזה החיבור הרגיל שלך

// ... בתוך ה-onDrop
const onDrop = async (acceptedFiles: File[]) => {
  const file = acceptedFiles[0];
  setUploading(true);
  
  try {
    // 1. הגדרת הנתיב המדויק ב-Storage
    const storageRef = ref(storage, `invoices/${file.name}`);
    
    // 2. העלאה ישירה דרך ה-SDK (זה יפתור את ה-CORS)
    await uploadBytes(storageRef, file);
    
    // 3. עדכון ה-Firestore במיקום הקובץ
    await setDoc(doc(db, "invoices", file.name), {
      name: file.name,
      path: `invoices/${file.name}`,
      uploadedAt: new Date().toISOString()
    });

    toast.success("הקובץ עלה בהצלחה!");
  } catch (e) {
    console.error(e);
    toast.error("שגיאה בהעלאה");
  } finally {
    setUploading(false);
  }
};
